import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { hashPassword } from '../../common/auth/security';
import { ConflictError } from '../../common/errors/app.error';
import { Employee, EmployeeDocument, EmployeeStatus } from '../employee/schemas/employee.schema';
import { RoleName } from '../rbac/constants/permission-code.enum';
import { RoleService } from '../rbac/role.service';
import { TenantRepository } from './tenant.repository';
import { TenantDocument } from './schemas/tenant.schema';

// Mirrors domain/tenant/service.py's TenantService. `bootstrap` is the one actor-less/
// system-level operation in the codebase — reachable only from scripts/bootstrap-tenant.ts,
// never a controller (there is no public signup endpoint by design). It talks to
// EmployeeRepository-equivalent (the raw Employee model) directly rather than EmployeeService,
// since there's no authenticated actor yet to run EmployeeService's permission checks against.
@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly roleService: RoleService,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async bootstrap(params: {
    tenantName: string;
    tenantSlug: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
  }): Promise<{ tenant: TenantDocument; admin: EmployeeDocument }> {
    const existing = await this.tenantRepository.getBySlug(params.tenantSlug);
    if (existing) throw new ConflictError(`Tenant slug '${params.tenantSlug}' is already taken`);

    const hashedPassword = await hashPassword(params.adminPassword);

    let tenant!: TenantDocument;
    let admin!: EmployeeDocument;
    await this.connection.transaction(async (session) => {
      tenant = await this.tenantRepository.create({ name: params.tenantName, slug: params.tenantSlug }, session);
      const roles = await this.roleService.seedDefaultRoles(tenant._id as Types.ObjectId, session);
      const hrAdminRole = roles[RoleName.HR_ADMIN];

      const [created] = await this.employeeModel.create(
        [
          {
            tenantId: tenant._id,
            roleId: hrAdminRole._id,
            email: params.adminEmail,
            hashedPassword,
            fullName: params.adminFullName,
            jobTitle: 'HR Administrator',
            status: EmployeeStatus.ACTIVE,
            hireDate: new Date(),
          },
        ],
        { session },
      );
      admin = created;
    });

    return { tenant, admin };
  }
}
