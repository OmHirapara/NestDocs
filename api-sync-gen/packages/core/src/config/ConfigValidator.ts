import type { ZodError } from 'zod';
import type { ApiSyncConfig } from './types.js';
import { apiSyncConfigSchema } from './types.js';
import { ConfigValidationError } from '../errors.js';
import type { Result } from '../types/result.types.js';
import { ok, err } from '../types/result.types.js';

/**
 * Validates a raw configuration object against the ApiSyncConfig schema.
 *
 * @param raw - Untyped input, typically loaded from a config file
 * @returns A Result containing the validated config or a ConfigValidationError with human-readable details
 */
export function validateConfig(raw: unknown): Result<ApiSyncConfig, ConfigValidationError> {
  const parseResult = apiSyncConfigSchema.safeParse(raw);

  if (parseResult.success) {
    return ok(parseResult.data as ApiSyncConfig);
  }

  const details = formatZodErrors(parseResult.error);
  const message = `Config validation failed:\n${details.join('\n')}`;

  return err(new ConfigValidationError(message, details));
}

/**
 * Converts Zod errors into human-readable strings.
 * @param zodError - The Zod validation error
 * @returns Array of formatted error messages
 */
function formatZodErrors(zodError: ZodError): string[] {
  return zodError.issues.map((issue) => {
    const path = issue.path.join('.');
    const prefix = path.length > 0 ? `${path}: ` : '';
    return `${prefix}${issue.message}`;
  });
}
