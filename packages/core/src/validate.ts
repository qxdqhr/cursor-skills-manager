import type { ValidateSkillInput, ValidationError } from './types.js';

const NAME_RE = /^[a-z0-9-]{1,64}$/;
const DESCRIPTION_MAX = 1024;

export function validateSkill(input: ValidateSkillInput): { ok: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const name = String(input.frontmatter.name ?? '').trim();
  const description = String(input.frontmatter.description ?? '').trim();

  if (!name) {
    errors.push({
      field: 'name',
      code: 'NAME_REQUIRED',
      message: 'name is required',
    });
  } else if (!NAME_RE.test(name)) {
    errors.push({
      field: 'name',
      code: 'NAME_INVALID',
      message: 'name must be lowercase letters, numbers, and hyphens only (max 64)',
    });
  } else if (name !== input.directoryName) {
    errors.push({
      field: 'name',
      code: 'NAME_DIR_MISMATCH',
      message: `name must match directory name "${input.directoryName}"`,
    });
  }

  if (!description) {
    errors.push({
      field: 'description',
      code: 'DESCRIPTION_REQUIRED',
      message: 'description is required',
    });
  } else if (description.length > DESCRIPTION_MAX) {
    errors.push({
      field: 'description',
      code: 'DESCRIPTION_TOO_LONG',
      message: `description must be at most ${DESCRIPTION_MAX} characters`,
    });
  }

  return { ok: errors.length === 0, errors };
}
