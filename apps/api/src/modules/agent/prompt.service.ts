import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../common/errors/app.error';

// CLAUDE.md rule 8 / blueprint §31 ("Prompt Management"): prompts are versioned files, never
// inline strings edited in place. Each version lives at
// prompts/employee-agent/<version>.md (frontmatter + the actual system prompt body) and is
// immutable once shipped — a prompt change is a new version file plus an AGENT_PROMPT_VERSION
// bump, never an edit to an existing version's content, so a given prompt_version string always
// means the same text in every environment and can be cited in traces/evals (blueprint §31: "for
// every production run, record agent_version, prompt_version, model, tool_versions").
export interface VersionedPrompt {
  version: string;
  content: string;
}

@Injectable()
export class EmployeeAgentPromptService {
  private readonly cache = new Map<string, VersionedPrompt>();

  load(version: string): VersionedPrompt {
    const cached = this.cache.get(version);
    if (cached) return cached;

    // __dirname resolves under src/ in dev (ts-node) and under dist/ in the built app — the
    // nest-cli.json "assets" entry copies this module's prompts/ directory into dist at the same
    // relative path, so this join() is correct in both cases without an env-specific branch.
    const filePath = join(__dirname, 'prompts', 'employee-agent', `${version}.md`);

    let raw: string;
    try {
      raw = readFileSync(filePath, 'utf-8');
    } catch {
      throw new NotFoundError(`Unknown employee-agent prompt version '${version}'`);
    }

    const prompt: VersionedPrompt = { version, content: raw };
    this.cache.set(version, prompt);
    return prompt;
  }
}
