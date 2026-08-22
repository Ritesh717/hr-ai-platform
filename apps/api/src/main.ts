import { initTracing } from './tracing';
// Must be called before any other import that instruments frameworks (HTTP, Mongoose).
initTracing();

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AppConfig, true>);

  // Security headers — applied before any request reaches route handlers.
  app.use(helmet());

  // Gzip response compression — reduces payload size for large collections.
  app.use(compression());

  app.enableCors({
    origin: configService.get('corsAllowOrigins', { infer: true }),
    credentials: true,
  });

  // All API routes live under /api/v1. Health endpoints are excluded so probes work without
  // the prefix (docker-compose healthcheck, Kubernetes liveness/readiness probes).
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'live', 'ready'],
  });

  // Body size limit: 1 MB. Guards the agent chat endpoint against extremely large payloads
  // that would trigger expensive LLM calls before DTO validation fires.
  app.use(express.json({ limit: '1mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // OpenAPI / Swagger — available at /api/v1/docs in non-production environments.
  if (configService.get('environment', { infer: true }) !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HR AI Platform API')
      .setDescription('Multi-tenant HR platform with AI agent capabilities')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  logger.log(`HR AI Platform API listening on :${port}`, 'Bootstrap');
}

bootstrap();
