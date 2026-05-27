import {
  GitServiceError,
  gitCommit,
  gitDiff,
  gitLog,
  gitStatus,
} from '@csm/core';
import { ApiError } from '../errors.js';

function wrapGit<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e) => {
    if (e instanceof GitServiceError) {
      throw new ApiError('GIT_ERROR', e.message);
    }
    throw e;
  });
}

export async function getGitStatus(personalRoot: string) {
  return wrapGit(() => gitStatus(personalRoot));
}

export async function getGitDiff(personalRoot: string, path?: string) {
  return wrapGit(() => gitDiff(personalRoot, path));
}

export async function postGitCommit(
  personalRoot: string,
  message: string,
  paths?: string[],
) {
  return wrapGit(() => gitCommit(personalRoot, message, paths));
}

export async function getGitLog(
  personalRoot: string,
  opts: { path?: string; limit?: number },
) {
  return wrapGit(() => gitLog(personalRoot, opts));
}
