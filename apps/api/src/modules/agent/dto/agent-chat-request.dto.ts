import { IsString, MinLength } from 'class-validator';

// Mirrors employee-create.dto.ts's pattern: thin, validated at the edge. A single free-text
// message is the whole request contract for this scaffolding story — multi-turn conversation
// history is out of scope until a real chat surface lands.
export class AgentChatRequestDto {
  @IsString()
  @MinLength(1)
  message: string;
}
