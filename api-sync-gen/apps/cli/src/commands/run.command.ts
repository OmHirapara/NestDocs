import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createPostmanSyncGen } from '@company/postman-sync-gen';
import { Spinner } from '../utils/spinner.js';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Run Postman collection tests with Newman')
    .option('--collection <path>', 'Path to collection.json', './docs/collection.json')
    .option('--env <path>', 'Path to environment file')
    .option('--reporter <type>', 'Reporter type: cli, html, json', 'cli')
    .action(async (options: { collection: string; env?: string; reporter: string }) => {
      const spinner = new Spinner('Starting Newman test runner...');
      spinner.start();

      try {
        const configResult = await loadConfig();
        if (!configResult.ok) handleError(configResult.error, 'Configuration');

        const gen = createPostmanSyncGen(configResult.value);
        spinner.update('Running collection tests...');

        const result = await gen.run(options.collection, options.env);

        if (!result.ok) {
          spinner.fail('Tests failed');
          cliLogger.error(result.error.message);
          process.exit(1);
        }

        spinner.succeed('All tests passed');
      } catch (err: unknown) {
        spinner.fail('Newman error');
        handleError(err, 'Run command');
      }
    });
}
