import { IsString, MaxLength, MinLength } from 'class-validator';

export class AgentChatRequestDto {
  @IsString()
  @MinLength(1)
  // 4000 chars is well above any natural employee query; keeps LLM call cost bounded and
  // guards against prompt-stuffing attacks via the chat endpoint.
  @MaxLength(4000)
  message: string;
}
