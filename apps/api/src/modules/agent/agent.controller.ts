import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AgentChatRequestDto } from './dto/agent-chat-request.dto';
import { AgentChatResponseDto } from './dto/agent-chat-response.dto';
import { EmployeeAgentService } from './employee-agent.service';

// Mirrors employee.controller.ts: thin, delegates straight to the service. The controller's only
// job is resolving the caller's identity (JwtAuthGuard + CurrentEmployee, the same auth stack
// every other route uses) and handing it to the agent as tool-call context. Per-tool
// authorization happens inside EmployeeAgentService/buildToolSet (tools/agent-tool.ts), never
// here and never left to the model.
@Controller('api/v1/agent/employee')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly employeeAgentService: EmployeeAgentService) {}

  @Post('chat')
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
