import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeModule } from '../employee/employee.module';
import { PermissionsController, RolesController } from './roles.controller';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';
import { Role, RoleSchema } from './schemas/role.schema';

// RoleService needs EmployeeRepository for its two guardrails (role-in-use count, RBAC_MANAGE
// self-lockout count) and EmployeeService needs RoleRepository to validate/resolve roleId on
// create/update — same circular dependency domain/rbac/service.py and domain/employee/service.py
// have in Python (there it's just a plain cross-module import; here it needs forwardRef()).
@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]), forwardRef(() => EmployeeModule)],
  controllers: [RolesController, PermissionsController],
  providers: [RoleRepository, RoleService],
  exports: [RoleRepository, RoleService],
})
export class RbacModule {}
