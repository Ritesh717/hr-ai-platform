import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { AppConfig } from '../../../config/configuration';

// Story #1 (Stage 2 — agent runtime scaffold): resolves the LanguageModel the AI SDK's
// generateText() calls, purely from env-driven config (AppConfig, itself built from
// process.env — see config/env.validation.ts). Never hardcode a provider, model name, or API key
// here; that's the whole point of making this a function of AppConfig instead of a constant.
//
// Deliberately throws (rather than silently falling back to a different provider) when the
// configured provider's API key is missing — a misconfigured agent should fail loudly at the
// point of use, not send a request the caller didn't ask for or leave a caller wondering why the
// agent is silently mocked/broken.
export type AgentModelConfig = Pick<
  AppConfig,
  'agentModelProvider' | 'agentModelName' | 'anthropicApiKey' | 'openaiApiKey' | 'deepseekApiKey'
>;

export function resolveAgentModel(config: AgentModelConfig): LanguageModel {
  switch (config.agentModelProvider) {
    case 'anthropic': {
      if (!config.anthropicApiKey) {
        throw new Error("ANTHROPIC_API_KEY is required when AGENT_MODEL_PROVIDER='anthropic'");
      }
      return createAnthropic({ apiKey: config.anthropicApiKey })(config.agentModelName);
    }
    case 'openai': {
      if (!config.openaiApiKey) {
        throw new Error("OPENAI_API_KEY is required when AGENT_MODEL_PROVIDER='openai'");
      }
      return createOpenAI({ apiKey: config.openaiApiKey })(config.agentModelName);
    }
    case 'deepseek': {
      // DeepSeek's chat completions API is OpenAI-compatible; the official `@ai-sdk/deepseek`
      // provider package (same @ai-sdk/provider* versions as the anthropic/openai providers
      // already in use) wraps that endpoint behind the same LanguageModel interface, so this
      // needs no bespoke request plumbing.
      if (!config.deepseekApiKey) {
        throw new Error("DEEPSEEK_API_KEY is required when AGENT_MODEL_PROVIDER='deepseek'");
      }
      return createDeepSeek({ apiKey: config.deepseekApiKey })(config.agentModelName);
    }
    default: {
      // Exhaustiveness guard — env.validation.ts's z.enum(['anthropic', 'openai', 'deepseek'])
      // should make this unreachable, but keep it typed so adding a provider to the enum without
      // updating this switch is a compile error, not a silent runtime gap.
      const exhaustiveCheck: never = config.agentModelProvider;
      throw new Error(`Unsupported AGENT_MODEL_PROVIDER '${String(exhaustiveCheck)}'`);
    }
  }
}
