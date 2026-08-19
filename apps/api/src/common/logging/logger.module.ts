import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { getRequestId } from '../request-context';

// Mirrors shared/logging/setup.py's JsonFormatter + RequestIdFilter: one JSON object per line
// with timestamp/level/message plus request_id pulled from AsyncLocalStorage, framework access
// logs quieted the way uvicorn.access/sqlalchemy.engine are silenced to WARNING there.
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.DEBUG === 'true' ? 'debug' : 'info',
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        mixin: () => ({ request_id: getRequestId() }),
        customProps: () => ({ request_id: getRequestId() }),
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
