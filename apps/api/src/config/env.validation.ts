import { z } from 'zod';

const jsonStringArray = z
  .string()
  .default('["http://localhost:3000"]')
  .transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
        throw new Error('not a string array');
      }
      return parsed as string[];
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CORS_ALLOW_ORIGINS must be a JSON string array' });
      return z.NEVER;
    }
  });

export const envSchema = z.object({
  ENVIRONMENT: z.string().default('local'),
  DEBUG: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/hr_ai_platform?replicaSet=rs0'),
  JWT_SECRET: z.string().default('dev-secret-change-me'),
  JWT_ALGORITHM: z.string().default('HS256'),
  JWT_EXPIRES_MINUTES: z.coerce.number().default(480),
  CORS_ALLOW_ORIGINS: jsonStringArray,
  // Agent runtime (Stage 2, story #1: see docs/blueprint.md §54 "Agent runtime decision").
  // Provider/model are env-driven, never hardcoded, so a deployment can switch models without a
  // code change. API keys are optional at the schema level because the app must still boot (and
  // every non-agent route must still work) without them configured; EmployeeAgentService fails
  // loudly, at call time, if the selected provider's key is missing.
  AGENT_MODEL_PROVIDER: z.enum(['anthropic', 'openai', 'deepseek']).default('anthropic'),
  AGENT_MODEL_NAME: z.string().default('claude-3-5-haiku-20241022'),
  AGENT_PROMPT_VERSION: z.string().default('v2'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Resolved via the official @ai-sdk/deepseek provider package (DeepSeek's chat completions API
  // is OpenAI-compatible, but @ai-sdk/deepseek already wraps it — no bespoke SDK needed) — see
  // model/agent-model.provider.ts.
  DEEPSEEK_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}
