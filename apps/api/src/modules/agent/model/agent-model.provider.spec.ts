import { resolveAgentModel } from './agent-model.provider';

describe('resolveAgentModel', () => {
  it('throws when the anthropic provider is selected but no API key is configured', () => {
    expect(() =>
      resolveAgentModel({
        agentModelProvider: 'anthropic',
        agentModelName: 'claude-3-5-haiku-20241022',
        anthropicApiKey: undefined,
        openaiApiKey: undefined,
        deepseekApiKey: undefined,
      }),
    ).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('throws when the openai provider is selected but no API key is configured', () => {
    expect(() =>
      resolveAgentModel({
        agentModelProvider: 'openai',
        agentModelName: 'gpt-4o-mini',
        anthropicApiKey: undefined,
        openaiApiKey: undefined,
        deepseekApiKey: undefined,
      }),
    ).toThrow(/OPENAI_API_KEY/);
  });

  it('throws when the deepseek provider is selected but no API key is configured', () => {
    expect(() =>
      resolveAgentModel({
        agentModelProvider: 'deepseek',
        agentModelName: 'deepseek-chat',
        anthropicApiKey: undefined,
        openaiApiKey: undefined,
        deepseekApiKey: undefined,
      }),
    ).toThrow(/DEEPSEEK_API_KEY/);
  });

  it('resolves a model instance when the matching API key is present (anthropic)', () => {
    const model = resolveAgentModel({
      agentModelProvider: 'anthropic',
      agentModelName: 'claude-3-5-haiku-20241022',
      anthropicApiKey: 'test-key',
      openaiApiKey: undefined,
      deepseekApiKey: undefined,
    });
    expect(model).toBeDefined();
  });

  it('resolves a model instance when the matching API key is present (openai)', () => {
    const model = resolveAgentModel({
      agentModelProvider: 'openai',
      agentModelName: 'gpt-4o-mini',
      anthropicApiKey: undefined,
      openaiApiKey: 'test-key',
      deepseekApiKey: undefined,
    });
    expect(model).toBeDefined();
  });

  it('resolves a model instance when the matching API key is present (deepseek)', () => {
    const model = resolveAgentModel({
      agentModelProvider: 'deepseek',
      agentModelName: 'deepseek-chat',
      anthropicApiKey: undefined,
      openaiApiKey: undefined,
      deepseekApiKey: 'test-key',
    });
    expect(model).toBeDefined();
  });
});
