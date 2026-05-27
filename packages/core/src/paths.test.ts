import { describe, it, expect } from 'vitest';
import { assertInsideRoot, expandHome, toPosixPath } from './paths.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('paths', () => {
  it('expandHome expands ~/path', () => {
    const home = process.env.HOME ?? '';
    if (!home) return;
    expect(expandHome('~/foo')).toBe(join(home, 'foo'));
  });

  it('assertInsideRoot allows paths under root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'csm-root-'));
    const inner = join(root, 'a', 'b.txt');
    await mkdir(join(root, 'a'), { recursive: true });
    await writeFile(inner, 'x');
    expect(assertInsideRoot(inner, root)).toBe(inner);
  });

  it('assertInsideRoot rejects escape', async () => {
    const root = await mkdtemp(join(tmpdir(), 'csm-root-'));
    expect(() => assertInsideRoot('/etc/passwd', root)).toThrow(/escapes root/);
  });

  it('toPosixPath normalizes', () => {
    expect(toPosixPath('a\\b/c')).toBe('a/b/c');
  });
});
