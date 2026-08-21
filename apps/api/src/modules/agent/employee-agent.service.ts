import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { generateText, stepCountIs } from 'ai';
import { AppConfig } from '../../config/configuration';
import { DepartmentService } from '../department/department.service';
import { EmployeeService } from '../employee/employee.service';
import { LeaveService } from '../leave/leave.service';
import { AgentModelConfig, resolveAgentModel } from './model/agent-model.provider';
import { EmployeeAgentPromptService } from './prompt.service';
import { AnyAgentToolDefinition, buildToolSet } from './tools/agent-tool';
import { AgentToolContext } from './tools/agent-tool-context';
import { buildEmployeeAgentTools } from './tools/employee-agent.tools';

export interface EmployeeAgentChatParams {
  message: string;
  context: AgentToolContext;
}

export interface EmployeeAgentToolCallSummary {
  name: string;
  input: unknown;
  // Populated from the matching 'tool-result' content part (see chat()) — undefined when the
  // call instead produced a 'tool-error' part (below) or when the model's tool-call loop was cut
  // short (stopWhen) before either came back. Story #5 (tracing) is the proper home for a full
  // agent trace; this is the minimum this story's own acceptance criteria need ("tool call +
  // result appear in the agent trace").
  output?: unknown;
  // Populated from the matching 'tool-error' content part — set whenever the tool's handler threw
  // (e.g. an AuthorizationError from a denied permission check). The `ai` SDK's generateText()
  // catches a thrown execute() and turns it into a 'tool-error' content part instead of a
  // 'tool-result' one; step.toolResults only ever contains 'tool-result' parts, so without this
  // the trace would silently show output: undefined for exactly the case — an authorization
  // denial — that matters most to capture ("tool call + result appear in the trace").
  error?: unknown;
}

export interface EmployeeAgentChatResult {
  reply: string;
  agentVersion: string;
  promptVersion: string;
  modelProvider: string;
  modelName: string;
  toolCalls: EmployeeAgentToolCallSummary[];
}

// Story #1 (Stage 2 — agent runtime scaffold), tool registry populated by story #2. The
// tool-calling loop itself: resolves the model and versioned prompt from config, runs
// generateText() with the Employee & org read-tool registry (tools/employee-agent.tools.ts), and
// records the agent/prompt/model identifiers every production run needs (blueprint §31: "Record
// agent_version, prompt_version, model, tool_versions for every production run").
//
// Deliberately not a singleton-held model instance — resolveAgentModel() is called fresh on each
// chat() so a missing API key surfaces at call time, not at process boot (see
// model/agent-model.provider.ts).
@Injectable()
export class EmployeeAgentService {
  private readonly logger = new Logger(EmployeeAgentService.name);

  static readonly AGENT_VERSION = 'v1';
  private static readonly MAX_TOOL_STEPS = 5;

  // Built once — EmployeeService/DepartmentService are request-scoped-free singletons, and
  // buildEmployeeAgentTools() only closes over them, not over any per-request state (the actual
  // caller identity is threaded through per chat() call via AgentToolContext, not through this).
  private readonly tools: AnyAgentToolDefinition[];

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly promptService: EmployeeAgentPromptService,
    employeeService: EmployeeService,
    departmentService: DepartmentService,
    leaveService: LeaveService,
  ) {
    this.tools = buildEmployeeAgentTools({ employeeService, departmentService, leaveService });
  }

  async chat(params: EmployeeAgentChatParams): Promise<EmployeeAgentChatResult> {
    const modelConfig: AgentModelConfig = {
      agentModelProvider: this.configService.get('agentModelProvider', { infer: true }),
      agentModelName: this.configService.get('agentModelName', { infer: true }),
      anthropicApiKey: this.configService.get('anthropicApiKey', { infer: true }),
      openaiApiKey: this.configService.get('openaiApiKey', { infer: true }),
      deepseekApiKey: this.configService.get('deepseekApiKey', { infer: true }),
    };
    const promptVersion = this.configService.get('agentPromptVersion', { infer: true });

    // Story #5: root span covering the entire agent run. Child spans — one per LLM call step —
    // are created automatically by generateText()'s experimental_telemetry option (see below).
    // Attributes follow blueprint §24: trace/span metadata only, never sensitive payload content.
    const tracer = trace.getTracer('employee-agent', EmployeeAgentService.AGENT_VERSION);
    return tracer.startActiveSpan('employee_agent.chat', async (span) => {
      span.setAttributes({
        'agent.name': 'employee-agent',
        'agent.version': EmployeeAgentService.AGENT_VERSION,
        'agent.prompt_version': promptVersion,
        'model.provider': modelConfig.agentModelProvider,
        'model.name': modelConfig.agentModelName,
        'tenant.id': params.context.tenantId,
        // user.id is safe metadata per blueprint §24; message content is never recorded here
        'user.id': params.context.actorId,
      });

      try {
        const result = await this.runChat(params, modelConfig, promptVersion);
        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('agent.tool_calls_count', result.toolCalls.length);
        return result;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
        throw err;
      } finally {
        span.end();
      }
    });
  }

  private async runChat(
    params: EmployeeAgentChatParams,
    modelConfig: AgentModelConfig,
    promptVersion: string,
  ): Promise<EmployeeAgentChatResult> {
    const prompt = this.promptService.load(promptVersion);
    const model = resolveAgentModel(modelConfig);
    const tools = buildToolSet(this.tools, params.context);

    this.logger.log({
      msg: 'employee_agent.chat.start',
      tenantId: params.context.tenantId,
      actorId: params.context.actorId,
      agentVersion: EmployeeAgentService.AGENT_VERSION,
      promptVersion,
      modelProvider: modelConfig.agentModelProvider,
      modelName: modelConfig.agentModelName,
    });

    const result = await generateText({
      model,
      system: prompt.content,
      // Untrusted-content rule (CLAUDE.md #5): tool output/RAG chunks flow back to the model via
      // the tool-result channel generateText manages internally, never folded into `system` here.
      messages: [{ role: 'user', content: params.message }],
      tools,
      stopWhen: stepCountIs(EmployeeAgentService.MAX_TOOL_STEPS),
      // Story #5: per-step LLM call spans (model, latency, token usage) recorded automatically
      // by the ai SDK's OTel integration. recordInputs/recordOutputs are false: message content
      // and tool I/O must not appear in trace attributes (blueprint §24/§28).
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'employee-agent',
        recordInputs: false,
        recordOutputs: false,
      },
    });

    const toolCalls = result.steps.flatMap((step) => {
      // step.toolResults only contains 'tool-result' content parts — a thrown execute() produces
      // a 'tool-error' part instead, which toolResults silently excludes. Read from step.content
      // so a thrown tool error still shows up here with enough information to know it failed.
      const outcomeByCallId = new Map<string, { output?: unknown; error?: unknown }>();
      for (const part of step.content) {
        if (part.type === 'tool-result') {
          outcomeByCallId.set(part.toolCallId, { output: part.output });
        } else if (part.type === 'tool-error') {
          outcomeByCallId.set(part.toolCallId, { error: part.error });
        }
      }
      return step.toolCalls.map((call) => {
        const outcome = outcomeByCallId.get(call.toolCallId);
        return { name: call.toolName, input: call.input, output: outcome?.output, error: outcome?.error };
      });
    });

    return {
      reply: result.text,
      agentVersion: EmployeeAgentService.AGENT_VERSION,
      promptVersion,
      modelProvider: modelConfig.agentModelProvider,
      modelName: modelConfig.agentModelName,
      toolCalls,
    };
  }
}
