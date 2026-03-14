import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createPostmanSyncGen } from '@company/postman-sync-gen';
import { Spinner } from '../utils/spinner.js';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerPostmanCommand(program: Command): void {
  program
    .command('postman')
    .description('Generate Postman collection from swagger.json')
    .option('--swagger-path <path>', 'Path to swagger.json', './docs/swagger.json')
    .action(async (options: { swaggerPath: string }) => {
      const spinner = new Spinner('Loading config...');
      spinner.start();

      try {
        const configResult = await loadConfig();
        if (!configResult.ok) {
          spinner.fail('Config error');
          handleError(configResult.error, 'Configuration');
        }

        spinner.update('Converting swagger.json to Postman collection...');
        const gen = createPostmanSyncGen(configResult.value);
        const result = await gen.generate(options.swaggerPath);

        if (!result.ok) {
          spinner.fail('Generation failed');
          handleError(result.error, 'Postman generation');
        }

        spinner.succeed(`collection.json generated → ${result.value.outputPath}`);
        cliLogger.blank();
        cliLogger.info('Import into Postman or run: npx api-sync run');
      } catch (err: unknown) {
        spinner.fail('Unexpected error');
        handleError(err, 'Postman command');
      }
    });
}
