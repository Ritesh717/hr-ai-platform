import { apiFetch } from "@/lib/api/client";
import type { ChatToolCallTrace } from "@/lib/api/types";

// Mirrors apps/api/src/modules/agent/dto/agent-chat-request.dto.ts
interface AgentChatRequestDto {
  message: string;
}

// Mirrors apps/api/src/modules/agent/dto/agent-chat-response.dto.ts
export interface AgentToolCallResponseDto {
  name: string;
  input: unknown;
  output: unknown;
  error?: unknown;
}

export interface AgentChatResponseDto {
  reply: string;
  agentVersion: string;
  promptVersion: string;
  modelProvider: string;
  modelName: string;
  toolCalls: AgentToolCallResponseDto[];
}

// POST /api/v1/agent/employee/chat — single-turn, non-streaming request.
// Auth goes through the same apiFetch path as all other API calls (JWT header from token store).
// Never log the request/response payload (blueprint §28).
export async function postAgentChat(message: string): Promise<AgentChatResponseDto> {
  const dto: AgentChatRequestDto = { message };
  return apiFetch<AgentChatResponseDto>("/api/v1/agent/employee/chat", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// Maps a server-side AgentToolCallResponseDto to the client-side ChatToolCallTrace shape.
export function toToolCallTrace(dto: AgentToolCallResponseDto): ChatToolCallTrace {
  return { name: dto.name, input: dto.input };
}
