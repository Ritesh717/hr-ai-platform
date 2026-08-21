import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, stepCountIs } from 'ai';
import { AppConfig } from '../../config/configuration';
import { DepartmentService } from '../department/department.service';
import { EmployeeService } from '../employee/employee.service';
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
  ) {
    this.tools = buildEmployeeAgentTools({ employeeService, departmentService });
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
      // Untrusted-content rule (CLAUDE.md #5): tool output/RAG chunks would flow back to the
      // model via the tool-result channel generateText manages internally, never folded into
      // `system` here. This scaffold only has a single user turn; multi-turn history is out of
      // scope until a real chat surface lands.
      messages: [{ role: 'user', content: params.message }],
      tools,
      stopWhen: stepCountIs(EmployeeAgentService.MAX_TOOL_STEPS),
    });

    const toolCalls = result.steps.flatMap((step) => {
      // step.toolResults only contains 'tool-result' content parts — a thrown execute() produces
      // a 'tool-error' part instead, which toolResults silently excludes. Read from step.content
      // (the full set of content parts for the step) so a thrown tool error still shows up here
      // with enough information to know it failed, rather than surfacing as output: undefined
      // indistinguishable from "no result yet".
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
