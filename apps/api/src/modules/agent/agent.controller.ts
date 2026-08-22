import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AgentChatRequestDto } from './dto/agent-chat-request.dto';
import { AgentChatResponseDto } from './dto/agent-chat-response.dto';
import { EmployeeAgentService } from './employee-agent.service';

// Thin controller: the only job here is resolving caller identity (JwtAuthGuard +
// CurrentEmployee) and forwarding it as AgentToolContext. Per-tool authorization happens inside
// EmployeeAgentService/buildToolSet — never here, never left to the model.
@ApiTags('agent')
@ApiBearerAuth()
@Controller('agent/employee')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly employeeAgentService: EmployeeAgentService) {}

  // Tighter rate limit than the default (30 per minute per IP): each request can trigger
  // multiple LLM calls and domain-service reads, so excess requests are expensive.
  @Post('chat')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async chat(
    @Body() dto: AgentChatRequestDto,
    @CurrentEmployee() current: CurrentEmployeeType,
  ): Promise<AgentChatResponseDto> {
    const result = await this.employeeAgentService.chat({
      message: dto.message,
      context: {
        tenantId: current.tenantId,
        actorId: current.employeeId,
        actorPermissions: current.permissions,
      },
    });
    return AgentChatResponseDto.fromResult(result);
  }
}
