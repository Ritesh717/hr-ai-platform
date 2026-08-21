import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { AppConfig } from '../../config/configuration';
import { EmployeeModule } from '../employee/employee.module';
import { TenantModule } from '../tenant/tenant.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// JwtStrategy is registered here and uses EmployeeRepository (exported by EmployeeModule) for
// fresh permission resolution on every request. The Passport strategy registry is process-global
// so this module need only be imported once from AppModule.
@Module({
  imports: [
    EmployeeModule,
    TenantModule,
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
