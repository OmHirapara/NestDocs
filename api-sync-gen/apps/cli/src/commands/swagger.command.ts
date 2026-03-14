import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createSwaggerSyncGen } from '@company/swagger-sync-gen';
import { Spinner } from '../utils/spinner.js';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerSwaggerCommand(program: Command): void {
  program
    .command('swagger')
    .description('Generate swagger.json from NestJS source code')
    .option('--serve', 'Open Swagger UI in browser after generation')
    .option('--watch', 'Watch for file changes and regenerate automatically')
    .option('--config <path>', 'Path to api-sync.config.ts')
    .action(async (options: { serve?: boolean; watch?: boolean; config?: string }) => {
      const spinner = new Spinner('Loading config...');
      spinner.start();

      try {
        const configResult = await loadConfig(options.config ? process.cwd() : undefined);
        if (!configResult.ok) {
          spinner.fail('Config error');
          handleError(configResult.error, 'Configuration');
        }

        spinner.update('Scanning NestJS controllers...');
        const gen = createSwaggerSyncGen(configResult.value);

        if (options.watch) {
          spinner.stop();
          cliLogger.info('Starting watch mode...');
          await gen.watch();
          return;
        }

        const result = await gen.generate();
        if (!result.ok) {
          spinner.fail('Generation failed');
          handleError(result.error, 'Swagger generation');
        }

        spinner.succeed(`swagger.json generated → ${result.value.outputPath}`);
      } catch (err: unknown) {
        spinner.fail('Unexpected error');
        handleError(err, 'Swagger command');
      }
    });
}
