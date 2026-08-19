import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { RbacModule } from '../rbac/rbac.module';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';

// No controller — bootstrap is CLI-only (scripts/bootstrap-tenant.ts), matching Python (no
// public signup endpoint by design).
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    RbacModule,
  ],
  providers: [TenantRepository, TenantService],
  exports: [TenantRepository, TenantService],
})
export class TenantModule {}
