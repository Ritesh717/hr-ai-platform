import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config/configuration';
import { Employee, EmployeeDocument, EmployeeStatus } from '../../modules/employee/schemas/employee.schema';
import { PermissionCode } from '../../modules/rbac/constants/permission-code.enum';
import { RoleDocument } from '../../modules/rbac/schemas/role.schema';
import { AuthenticationError } from '../errors/app.error';
import { CurrentEmployee } from './current-employee';

interface AccessTokenPayload {
  sub: string;
  tenant_id: string;
  role_id: string;
}

// Mirrors shared/auth/dependencies.py's get_current_employee — the crux of the auth model.
// The JWT's role_id claim is informational only: on every request this looks the employee up
// fresh (with its role populated) and recomputes the permission set from the live DB state, so
// a role reassignment or permission change takes effect on the caller's very next request with
// no re-login needed.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig, true>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
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

    const employee = await this.employeeModel
      .findOne({ _id: employeeId, tenantId })
      .populate<{ roleId: RoleDocument }>('roleId')
      .exec();

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
