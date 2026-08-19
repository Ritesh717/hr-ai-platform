import { EnvConfig } from './env.validation';

export interface AppConfig {
  environment: string;
  debug: boolean;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtAlgorithm: string;
  jwtExpiresMinutes: number;
  corsAllowOrigins: string[];
}

export function buildConfig(env: EnvConfig): AppConfig {
  return {
    environment: env.ENVIRONMENT,
    debug: env.DEBUG,
    port: env.PORT,
    mongodbUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    jwtAlgorithm: env.JWT_ALGORITHM,
    jwtExpiresMinutes: env.JWT_EXPIRES_MINUTES,
    corsAllowOrigins: env.CORS_ALLOW_ORIGINS,
  };
}
