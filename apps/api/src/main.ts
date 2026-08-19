import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';

// Mirrors apps/api/main.py's create_app() + lifespan.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AppConfig, true>);

  app.enableCors({
    origin: configService.get('corsAllowOrigins', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  logger.log(`Starting hr-ai-platform API (node port) on :${port}`, 'Bootstrap');
}

bootstrap();
