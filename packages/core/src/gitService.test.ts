import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { gitCommit, gitDiff, gitStatus } from './gitService.js';

const execFileAsync = promisify(execFile);

describe('gitService', () => {
  const root = join(tmpdir(), `csm-git-${Date.now()}`);

  beforeAll(async () => {
    await mkdir(root, { recursive: true });
    await execFileAsync('git', ['init'], { cwd: root });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    await execFileAsync('git', ['config', 'user.name', 'CSM Test'], { cwd: root });
    await writeFile(join(root, 'readme.txt'), 'hello\n', 'utf8');
    await execFileAsync('git', ['add', 'readme.txt'], { cwd: root });
    await execFileAsync('git', ['commit', '-m', 'init'], { cwd: root });
  });

  afterAll(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(root, { recursive: true, force: true }).catch(() => undefined);
  });

  it('reports clean then dirty after edit', async () => {
    const clean = await gitStatus(root);
    expect(clean.clean).toBe(true);

    await writeFile(join(root, 'readme.txt'), 'hello world\n', 'utf8');
    const dirty = await gitStatus(root);
    expect(dirty.clean).toBe(false);
    expect(dirty.files.some((f) => f.path === 'readme.txt')).toBe(true);

    const diff = await gitDiff(root, 'readme.txt');
    expect(diff.diff).toContain('hello');
  });

  it('commits staged files', async () => {
    await gitCommit(root, 'test commit', ['readme.txt']);
    const after = await gitStatus(root);
    expect(after.clean).toBe(true);
  });
});
