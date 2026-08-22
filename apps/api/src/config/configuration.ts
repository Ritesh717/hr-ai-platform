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
  agentModelProvider: 'anthropic' | 'openai' | 'deepseek';
  agentModelName: string;
  agentPromptVersion: string;
  anthropicApiKey: string | undefined;
  openaiApiKey: string | undefined;
  deepseekApiKey: string | undefined;
  throttleTtl: number;
  throttleLimit: number;
  otlpEndpoint: string | undefined;
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
    agentModelProvider: env.AGENT_MODEL_PROVIDER,
    agentModelName: env.AGENT_MODEL_NAME,
    agentPromptVersion: env.AGENT_PROMPT_VERSION,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    deepseekApiKey: env.DEEPSEEK_API_KEY,
    throttleTtl: env.THROTTLE_TTL,
    throttleLimit: env.THROTTLE_LIMIT,
    otlpEndpoint: env.OTLP_ENDPOINT,
  };
}
