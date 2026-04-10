import { LessonImport } from '../types/lesson';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  lesson?: LessonImport;
}

export function validateLessonJSON(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['Invalid JSON: cannot parse'] };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errors: ['Root must be a JSON object'] };
  }

  const obj = parsed as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    errors.push('title must be a non-empty string');
  }

  if (typeof obj.description !== 'string' || obj.description.trim() === '') {
    errors.push('description must be a non-empty string');
  }

  if (obj.tags !== undefined) {
    if (!Array.isArray(obj.tags) || !obj.tags.every((t) => typeof t === 'string')) {
      errors.push('tags must be an array of strings');
    }
  }

  if (!Array.isArray(obj.lines) || obj.lines.length === 0) {
    errors.push('lines must be a non-empty array');
  } else {
    (obj.lines as unknown[]).forEach((line, i) => {
      if (typeof line !== 'object' || line === null) {
        errors.push(`lines[${i}] must be an object`);
        return;
      }
      const l = line as Record<string, unknown>;
      if (typeof l.ru !== 'string' || l.ru.trim() === '') {
        errors.push(`lines[${i}].ru must be a non-empty string`);
      }
      if (typeof l.en !== 'string' || l.en.trim() === '') {
        errors.push(`lines[${i}].en must be a non-empty string`);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    lesson: {
      title: (obj.title as string).trim(),
      description: (obj.description as string).trim(),
      tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : [],
      lines: (obj.lines as Array<Record<string, string>>).map((l) => ({
        ru: l.ru.trim(),
        en: l.en.trim(),
      })),
    },
  };
}
