import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationError } from '../../common/errors/app.error';
import { EmployeeService } from '../employee/employee.service';
import { TenantRepository } from '../tenant/tenant.repository';
import { TokenResponseDto } from './dto/token-response.dto';

// Handles login (credential verification + JWT issuance).
@Injectable()
export class AuthService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly employeeService: EmployeeService,
    private readonly jwtService: JwtService,
  ) {}

  async login(params: { tenantSlug: string; email: string; password: string }): Promise<TokenResponseDto> {
    const tenant = await this.tenantRepository.getBySlug(params.tenantSlug);
    // Same message as bad credentials — deliberately avoids leaking whether a tenant slug exists.
    if (!tenant) {
      throw new AuthenticationError('Invalid email or password');
    }

    const employee = await this.employeeService.authenticate({
      tenantId: tenant._id.toString(),
      email: params.email,
      password: params.password,
    });

    // role_id is informational only — never trusted for authorization. See JwtStrategy.
    const accessToken = this.jwtService.sign({
      sub: employee._id.toString(),
      tenant_id: employee.tenantId.toString(),
      role_id: employee.roleId.toString(),
    });

    return { accessToken, tokenType: 'bearer' };
  }
}
