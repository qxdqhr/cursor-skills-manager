import type { ValidationError } from './types.js';

export class SkillValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'SkillValidationError';
    this.errors = errors;
  }
}

export class SkillWriteError extends Error {
  constructor(
    message: string,
    public code: 'PATH_FORBIDDEN' | 'CONFLICT' | 'NOT_FOUND' = 'CONFLICT',
  ) {
    super(message);
    this.name = 'SkillWriteError';
  }
}
