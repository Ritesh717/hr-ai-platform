import { Module } from '@nestjs/common';
import { DepartmentModule } from '../department/department.module';
import { EmployeeModule } from '../employee/employee.module';
import { AgentController } from './agent.controller';
import { EmployeeAgentService } from './employee-agent.service';
import { EmployeeAgentPromptService } from './prompt.service';

// Stage 2 story #1 scaffold + story #2 (read tools): one agent (EmployeeAgentService), a
// registry of read-only tools (tools/employee-agent.tools.ts) wired to EmployeeService/
// DepartmentService via EmployeeModule/DepartmentModule (both already export their service),
// env-driven model config (model/agent-model.provider.ts), and a versioned system prompt
// (prompts/employee-agent/, current default v2, via prompt.service.ts). Future Stage 2 stories
// (#3 leave/payroll read tools) extend buildEmployeeAgentTools()/add sibling registries rather
// than adding a new module — this stays a single agent per CLAUDE.md rule 7 until tools/
// permissions genuinely diverge enough to justify splitting.
@Module({
  imports: [EmployeeModule, DepartmentModule],
  controllers: [AgentController],
  providers: [EmployeeAgentPromptService, EmployeeAgentService],
  exports: [EmployeeAgentService],
})
export class AgentModule {}
