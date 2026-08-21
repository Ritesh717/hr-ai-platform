import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { EmployeeAgentService } from './employee-agent.service';
import { EmployeeAgentPromptService } from './prompt.service';

// Stage 2 story #1 scaffold: one agent (EmployeeAgentService), an empty tool registry
// (tools/employee-agent.tools.ts), env-driven model config (model/agent-model.provider.ts), and
// a versioned system prompt (prompts/employee-agent/v1.md via prompt.service.ts). Future Stage 2
// stories (#2 read tools, #3 more read tools) extend EMPLOYEE_AGENT_TOOLS in-place rather than
// adding a new module — this stays a single agent per CLAUDE.md rule 7 until tools/permissions
// genuinely diverge enough to justify splitting.
@Module({
  controllers: [AgentController],
  providers: [EmployeeAgentPromptService, EmployeeAgentService],
  exports: [EmployeeAgentService],
})
export class AgentModule {}
