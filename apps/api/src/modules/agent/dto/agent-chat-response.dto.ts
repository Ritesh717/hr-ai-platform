import { EmployeeAgentChatResult } from '../employee-agent.service';

export class AgentToolCallResponseDto {
  name: string;
  input: unknown;

  constructor(name: string, input: unknown) {
    this.name = name;
    this.input = input;
  }
}

// The request/response contract the API layer (and eventually the frontend chat surface) calls
// against. Carries the agent/prompt/model identifiers alongside the reply so every response is
// traceable back to exactly which prompt version and model produced it (blueprint §31).
export class AgentChatResponseDto {
  reply: string;
  agentVersion: string;
  promptVersion: string;
  modelProvider: string;
  modelName: string;
  toolCalls: AgentToolCallResponseDto[];

  static fromResult(result: EmployeeAgentChatResult): AgentChatResponseDto {
    const dto = new AgentChatResponseDto();
    dto.reply = result.reply;
    dto.agentVersion = result.agentVersion;
    dto.promptVersion = result.promptVersion;
    dto.modelProvider = result.modelProvider;
    dto.modelName = result.modelName;
    dto.toolCalls = result.toolCalls.map((call) => new AgentToolCallResponseDto(call.name, call.input));
    return dto;
  }
}
