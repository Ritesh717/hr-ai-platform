import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, stepCountIs } from 'ai';
import { AppConfig } from '../../config/configuration';
import { AgentModelConfig, resolveAgentModel } from './model/agent-model.provider';
import { EmployeeAgentPromptService } from './prompt.service';
import { buildToolSet } from './tools/agent-tool';
import { AgentToolContext } from './tools/agent-tool-context';
import { EMPLOYEE_AGENT_TOOLS } from './tools/employee-agent.tools';

export interface EmployeeAgentChatParams {
  message: string;
  context: AgentToolContext;
}

export interface EmployeeAgentToolCallSummary {
  name: string;
  input: unknown;
}

export interface EmployeeAgentChatResult {
  reply: string;
  agentVersion: string;
  promptVersion: string;
  modelProvider: string;
  modelName: string;
  toolCalls: EmployeeAgentToolCallSummary[];
}

// Story #1 (Stage 2 — agent runtime scaffold). The tool-calling loop itself: resolves the model
// and versioned prompt from config, runs generateText() with the (currently empty) tool
// registry, and records the agent/prompt/model identifiers every production run needs (blueprint
// §31: "Record agent_version, prompt_version, model, tool_versions for every production run").
//
// Deliberately not a singleton-held model instance — resolveAgentModel() is called fresh on each
// chat() so a missing API key surfaces at call time, not at process boot (see
// model/agent-model.provider.ts).
@Injectable()
export class EmployeeAgentService {
  private readonly logger = new Logger(EmployeeAgentService.name);

  static readonly AGENT_VERSION = 'v1';
  private static readonly MAX_TOOL_STEPS = 5;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly promptService: EmployeeAgentPromptService,
  ) {}

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
    const tools = buildToolSet(EMPLOYEE_AGENT_TOOLS, params.context);

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

    const toolCalls = result.steps.flatMap((step) =>
      step.toolCalls.map((call) => ({ name: call.toolName, input: call.input })),
    );

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
