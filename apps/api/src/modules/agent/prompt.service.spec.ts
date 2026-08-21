import { NotFoundError } from '../../common/errors/app.error';
import { EmployeeAgentPromptService } from './prompt.service';

describe('EmployeeAgentPromptService', () => {
  let service: EmployeeAgentPromptService;

  beforeEach(() => {
    service = new EmployeeAgentPromptService();
  });

  it('loads the versioned prompt file from disk', () => {
    const prompt = service.load('v1');
    expect(prompt.version).toBe('v1');
    expect(prompt.content).toContain('Employee Agent');
    expect(prompt.content).toContain('Never invent data');
  });

  it('caches the loaded prompt (returns the same object on a second call)', () => {
    const first = service.load('v1');
    const second = service.load('v1');
    expect(second).toBe(first);
  });

  it('throws NotFoundError for an unknown version', () => {
    expect(() => service.load('v999-does-not-exist')).toThrow(NotFoundError);
  });
});
