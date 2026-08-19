import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { AppConfig } from '../../config/configuration';
import { EmployeeModule } from '../employee/employee.module';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { TenantModule } from '../tenant/tenant.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Owns the JwtStrategy provider (registered here, defined in common/auth since other modules'
// JwtAuthGuard usages depend on it being instantiated once at bootstrap — Passport's strategy
// registry is process-global, not scoped per Nest module, so this module just needs to be
// imported once from AppModule).
@Module({
  imports: [
    EmployeeModule,
    TenantModule,
    // JwtStrategy injects the Employee model directly (not EmployeeModule's exports, which only
    // cover EmployeeRepository/EmployeeService) — register it here too, same as
    // DepartmentModule/TenantModule do for their own direct Employee model needs.
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        secret: configService.get('jwtSecret', { infer: true }),
        signOptions: {
          algorithm: configService.get('jwtAlgorithm', { infer: true }) as 'HS256',
          expiresIn: `${configService.get('jwtExpiresMinutes', { infer: true })}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
