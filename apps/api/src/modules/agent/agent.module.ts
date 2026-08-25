import { Module } from '@nestjs/common';
import { DepartmentModule } from '../department/department.module';
import { EmployeeModule } from '../employee/employee.module';
import { LeaveModule } from '../leave/leave.module';
import { PayrollModule } from '../payroll/payroll.module';
import { AgentController } from './agent.controller';
import { EmployeeAgentService } from './employee-agent.service';
import { EmployeeAgentPromptService } from './prompt.service';

// Stage 2 stories #1–#3: one agent (EmployeeAgentService), a registry of six read-only tools
// wired to EmployeeService/DepartmentService/LeaveService/PayrollService via their modules
// (PayrollModule added by issue #184 to wire the previously-stubbed get_payslip tool). Stays a
// single agent per CLAUDE.md rule 7 until tools/permissions genuinely diverge enough to justify
// splitting.
@Module({
  imports: [EmployeeModule, DepartmentModule, LeaveModule, PayrollModule],
  controllers: [AgentController],
  providers: [EmployeeAgentPromptService, EmployeeAgentService],
  exports: [EmployeeAgentService],
})
export class AgentModule {}
