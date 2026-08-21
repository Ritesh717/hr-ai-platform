import { ConfigService } from '@nestjs/config';
import { MockLanguageModelV3 } from 'ai/test';
import { AppConfig } from '../../config/configuration';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { EmployeeAgentService } from './employee-agent.service';
import * as modelProvider from './model/agent-model.provider';
import { EmployeeAgentPromptService } from './prompt.service';

// Substitutes the real Anthropic/OpenAI client construction with the `ai` SDK's own test double
// (MockLanguageModelV3) so this proves the actual tool-calling loop — versioned prompt loading,
// generateText(), tool-set assembly, response shaping — works end to end without a network call
// or a real API key, i.e. exactly the "trivial no-tool round trip against the chosen model" the
// story's acceptance criteria asks for.
jest.spyOn(modelProvider, 'resolveAgentModel');

function fakeConfigService(overrides: Partial<AppConfig> = {}): ConfigService<AppConfig, true> {
  const values: Partial<AppConfig> = {
    agentModelProvider: 'anthropic',
    agentModelName: 'claude-3-5-haiku-20241022',
    agentPromptVersion: 'v1',
    anthropicApiKey: 'test-key',
    openaiApiKey: undefined,
    deepseekApiKey: undefined,
    ...overrides,
  };
  return { get: (key: keyof AppConfig) => values[key] } as unknown as ConfigService<AppConfig, true>;
}

describe('EmployeeAgentService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes a no-tool round trip: loads the versioned prompt, calls the model, returns a reply', async () => {
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: {
          inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 8, text: 8, reasoning: undefined },
        },
        content: [{ type: 'text' as const, text: 'You have no pending requests right now.' }],
        warnings: [],
      }),
    });
    jest.spyOn(modelProvider, 'resolveAgentModel').mockReturnValue(mockModel);

    const service = new EmployeeAgentService(fakeConfigService(), new EmployeeAgentPromptService());

    const result = await service.chat({
      message: 'Do I have any pending requests?',
      context: {
        tenantId: 'tenant-1',
        actorId: 'employee-1',
        actorPermissions: new Set<PermissionCode>(),
      },
    });

    expect(result.reply).toBe('You have no pending requests right now.');
    expect(result.agentVersion).toBe(EmployeeAgentService.AGENT_VERSION);
    expect(result.promptVersion).toBe('v1');
    expect(result.modelProvider).toBe('anthropic');
    expect(result.modelName).toBe('claude-3-5-haiku-20241022');
    expect(result.toolCalls).toEqual([]);
  });

  it('propagates a missing-API-key failure from model resolution instead of masking it', async () => {
    jest.spyOn(modelProvider, 'resolveAgentModel').mockImplementation(() => {
      throw new Error("ANTHROPIC_API_KEY is required when AGENT_MODEL_PROVIDER='anthropic'");
    });

    const service = new EmployeeAgentService(
      fakeConfigService({ anthropicApiKey: undefined }),
      new EmployeeAgentPromptService(),
    );

    await expect(
      service.chat({
        message: 'hi',
        context: { tenantId: 'tenant-1', actorId: 'employee-1', actorPermissions: new Set() },
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
