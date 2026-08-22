import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { buildConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AppConfig } from './config/configuration';
import { LoggerModule } from './common/logging/logger.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AgentModule } from './modules/agent/agent.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentModule } from './modules/department/department.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { HealthModule } from './modules/health/health.module';
import { LeaveModule } from './modules/leave/leave.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => buildConfig(validateEnv(process.env))],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => [
        {
          ttl: configService.get('throttleTtl', { infer: true }),
          limit: configService.get('throttleLimit', { infer: true }),
        },
      ],
    }),
    LoggerModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodbUri'),
      }),
    }),
    HealthModule,
    TenantModule,
    AuthModule,
    EmployeeModule,
    DepartmentModule,
    RbacModule,
    AuditLogModule,
    LeaveModule,
    AgentModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
