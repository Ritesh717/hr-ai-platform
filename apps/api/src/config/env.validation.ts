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
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}
