import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config/configuration';
import { EmployeeRepository } from '../../modules/employee/employee.repository';
import { EmployeeStatus } from '../../modules/employee/schemas/employee.schema';
import { PermissionCode } from '../../modules/rbac/constants/permission-code.enum';
import { AuthenticationError } from '../errors/app.error';
import { CurrentEmployee } from './current-employee';

interface AccessTokenPayload {
  sub: string;
  tenant_id: string;
  role_id: string;
}

// The JWT's role_id claim is informational only: on every request this resolves the employee
// and recomputes their permission set from the live DB, so a role reassignment takes effect
// on the very next request with no re-login needed.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private readonly employeeRepository: EmployeeRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwtSecret', { infer: true }),
      algorithms: [configService.get('jwtAlgorithm', { infer: true })],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<CurrentEmployee> {
    let employeeId: Types.ObjectId;
    let tenantId: Types.ObjectId;
    try {
      employeeId = new Types.ObjectId(payload.sub);
      tenantId = new Types.ObjectId(payload.tenant_id);
    } catch {
      throw new AuthenticationError('Malformed token');
    }

    const employee = await this.employeeRepository.getByIdWithRolePermissions(employeeId, tenantId);

    if (!employee || employee.status === EmployeeStatus.TERMINATED) {
      throw new AuthenticationError('Account is no longer active');
    }

    const role = employee.roleId;
    const permissions = new Set(role.permissions as PermissionCode[]);

    return {
      employeeId: employee._id.toString(),
      tenantId: employee.tenantId.toString(),
      roleId: role._id.toString(),
      roleName: role.name,
      permissions,
    };
  }
}
