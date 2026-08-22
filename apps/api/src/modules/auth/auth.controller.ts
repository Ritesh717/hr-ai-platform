import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/auth/current-employee.decorator';
import { CurrentEmployee as CurrentEmployeeType } from '../../common/auth/current-employee';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login({ tenantSlug: dto.tenantSlug, email: dto.email, password: dto.password });
  }

  // Returns the caller's resolved identity and permission set so the frontend can gate
  // nav items on actual permissions (which are fully dynamic per tenant, not inferred from role).
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
