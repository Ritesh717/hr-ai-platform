import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfig } from '../../config/configuration';
import { getRequestId } from '../request-context';

// Structured JSON logging via nestjs-pino. One JSON object per line with timestamp/level/message
// plus request_id from AsyncLocalStorage for correlation across log lines in the same request.
// ConfigModule is global so ConfigService is available here without a separate import.
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        pinoHttp: {
          level: configService.get('debug', { infer: true }) ? 'debug' : 'info',
          formatters: {
            level: (label: string) => ({ level: label }),
          },
          timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
          mixin: () => ({ request_id: getRequestId() }),
          customProps: () => ({ request_id: getRequestId() }),
        },
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
