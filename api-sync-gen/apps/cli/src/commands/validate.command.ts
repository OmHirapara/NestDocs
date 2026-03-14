import type { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import type { OpenAPIV3 } from 'openapi-types';
import { SpecValidator } from '@company/swagger-sync-gen';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <swagger-path>')
    .description('Validate an existing swagger.json against OpenAPI 3.0 spec')
    .action(async (swaggerPath: string) => {
      try {
        const content = await readFile(swaggerPath, 'utf-8');
        const spec = JSON.parse(content) as OpenAPIV3.Document;

        const validator = new SpecValidator();
        const result = await validator.validate(spec);

        if (result.ok) {
          cliLogger.success(`${swaggerPath} is valid OpenAPI 3.0`);
        } else {
          cliLogger.error('Validation failed:');
          for (const e of result.error.errors) {
            cliLogger.error(`  • ${e}`);
          }
          process.exit(1);
        }
      } catch (err: unknown) {
        handleError(err, 'Validation');
      }
    });
}
