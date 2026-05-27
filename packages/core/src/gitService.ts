import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { simpleGit, type SimpleGit } from 'simple-git';
import { assertInsideRoot } from './paths.js';

export class GitServiceError extends Error {
  constructor(
    message: string,
    public code: 'NOT_A_REPO' | 'GIT_ERROR' = 'GIT_ERROR',
  ) {
    super(message);
    this.name = 'GitServiceError';
  }
}

function repoGit(personalRoot: string): SimpleGit {
  const root = resolve(personalRoot);
  if (!existsSync(join(root, '.git'))) {
    throw new GitServiceError('Not a git repository', 'NOT_A_REPO');
  }
  return simpleGit(root);
}

export type GitFileEntry = {
  path: string;
  status: string;
};

export type GitStatusResult = {
  branch: string;
  clean: boolean;
  files: GitFileEntry[];
};

function mapFileStatus(working: string, index: string): string {
  const w = working.trim();
  const i = index.trim();
  if (w === '?' || i === '?') return 'untracked';
  if (w === 'D' || i === 'D') return 'deleted';
  if (w === 'A' || i === 'A') return 'added';
  if (w === 'R' || i === 'R') return 'renamed';
  if (w === 'M' || i === 'M') return 'modified';
  if (w === ' ' && i === 'M') return 'staged';
  return 'modified';
}

export async function gitStatus(personalRoot: string): Promise<GitStatusResult> {
  const git = repoGit(personalRoot);
  try {
    const status = await git.status();
    return {
      branch: status.current ?? 'unknown',
      clean: status.isClean(),
      files: status.files.map((f) => ({
        path: f.path,
        status: mapFileStatus(f.working_dir, f.index),
      })),
    };
  } catch (e) {
    throw new GitServiceError(e instanceof Error ? e.message : String(e));
  }
}

export async function gitDiff(
  personalRoot: string,
  filePath?: string,
): Promise<{ path: string | null; diff: string }> {
  const git = repoGit(personalRoot);
  if (filePath) {
    assertInsideRoot(join(personalRoot, filePath), personalRoot);
  }
  try {
    const diff = filePath
      ? await git.diff(['--', filePath])
      : await git.diff();
    return { path: filePath ?? null, diff };
  } catch (e) {
    throw new GitServiceError(e instanceof Error ? e.message : String(e));
  }
}

export async function gitCommit(
  personalRoot: string,
  message: string,
  paths?: string[],
): Promise<{ hash: string; summary: { changes: number; insertions: number; deletions: number } }> {
  const git = repoGit(personalRoot);
  const trimmed = message.trim();
  if (!trimmed) {
    throw new GitServiceError('Commit message is required');
  }

  try {
    if (paths && paths.length > 0) {
      for (const p of paths) {
        assertInsideRoot(join(personalRoot, p), personalRoot);
      }
      await git.add(paths);
    } else {
      await git.add('.');
    }
    const result = await git.commit(trimmed);
    return {
      hash: result.commit ?? '',
      summary: {
        changes: result.summary.changes,
        insertions: result.summary.insertions,
        deletions: result.summary.deletions,
      },
    };
  } catch (e) {
    throw new GitServiceError(e instanceof Error ? e.message : String(e));
  }
}

export type GitLogEntry = {
  hash: string;
  date: string;
  message: string;
  author: string;
};

export async function gitLog(
  personalRoot: string,
  opts: { path?: string; limit?: number } = {},
): Promise<{ items: GitLogEntry[] }> {
  const git = repoGit(personalRoot);
  if (opts.path) {
    assertInsideRoot(join(personalRoot, opts.path), personalRoot);
  }
  try {
    const log = await git.log({
      maxCount: opts.limit ?? 20,
      file: opts.path,
    });
    return {
      items: log.all.map((c) => ({
        hash: c.hash,
        date: c.date,
        message: c.message,
        author: c.author_name,
      })),
    };
  } catch (e) {
    throw new GitServiceError(e instanceof Error ? e.message : String(e));
  }
}
