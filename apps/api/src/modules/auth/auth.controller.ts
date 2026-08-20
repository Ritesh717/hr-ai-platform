import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';

// Mirrors apps/api/routers/auth.py (prefix /api/v1/auth). login is the only unauthenticated route.
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login({ tenantSlug: dto.tenantSlug, email: dto.email, password: dto.password });
  }

  // Reflects back what JwtStrategy.validate() already resolved for this request — no new
  // authorization logic. Exists so the frontend can gate nav/actions on the caller's actual
  // permission set instead of guessing from the role name (roles are fully dynamic per tenant).
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentEmployee() current: CurrentEmployeeType): MeResponseDto {
    return {
      employeeId: current.employeeId,
      tenantId: current.tenantId,
      roleId: current.roleId,
      roleName: current.roleName,
      permissions: [...current.permissions].sort(),
    };
  }
}
