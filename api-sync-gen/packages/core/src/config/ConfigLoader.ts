import { cosmiconfig } from 'cosmiconfig';
import * as dotenv from 'dotenv';
import type { ResolvedApiSyncConfig } from './types.js';
import { resolveConfig } from './types.js';
import { validateConfig } from './ConfigValidator.js';
import { ConfigValidationError } from '../errors.js';
import type { Result } from '../types/result.types.js';
import { ok, err } from '../types/result.types.js';

/**
 * Loads, validates, and resolves the api-sync configuration.
 *
 * 1. Loads `.env` via dotenv so environment variables are available in config files
 * 2. Searches for `api-sync.config.{ts,js,json}` using cosmiconfig
 * 3. Validates the raw config against the Zod schema
 * 4. Resolves defaults, producing a ResolvedApiSyncConfig
 *
 * @param cwd - Directory to start searching from (defaults to process.cwd())
 * @returns A Result with the resolved config or a ConfigValidationError
 */
export async function loadConfig(
  cwd?: string,
): Promise<Result<ResolvedApiSyncConfig, ConfigValidationError>> {
  const searchDir = cwd ?? process.cwd();

  // Load .env so process.env vars are available inside config files
  dotenv.config({ path: `${searchDir}/.env` });

  const explorer = cosmiconfig('api-sync', {
    searchPlaces: [
      'api-sync.config.ts',
      'api-sync.config.js',
      'api-sync.config.json',
      '.api-syncrc',
      '.api-syncrc.json',
      '.api-syncrc.yaml',
      '.api-syncrc.yml',
    ],
  });

  try {
    const searchResult = await explorer.search(searchDir);

    if (!searchResult || searchResult.isEmpty) {
      return err(
        new ConfigValidationError(
          'No api-sync.config.ts found. Run npx api-sync --init to create one.',
          ['Configuration file not found in the project directory tree.'],
        ),
      );
    }

    const validationResult = validateConfig(searchResult.config);

    if (!validationResult.ok) {
      return validationResult;
    }

    const resolved = resolveConfig(validationResult.value);
    return ok(resolved);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? `Failed to load config: ${error.message}`
        : 'Failed to load config: unknown error';

    return err(
      new ConfigValidationError(message, [message]),
    );
  }
}
