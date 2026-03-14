import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createPostmanSyncGen } from '@company/postman-sync-gen';
import { Spinner } from '../utils/spinner.js';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerPushCommand(program: Command): void {
  program
    .command('push')
    .description('Push collection to Postman Team Workspace')
    .option('--swagger-path <path>', 'Path to swagger.json', './docs/swagger.json')
    .option('--env <name>', 'Also push named environment file', 'local')
    .action(async (options: { swaggerPath: string; env: string }) => {
      const spinner = new Spinner('Connecting to Postman API...');
      spinner.start();

      try {
        const configResult = await loadConfig();
        if (!configResult.ok) {
          spinner.fail('Config error');
          handleError(configResult.error, 'Configuration');
        }

        const config = configResult.value;
        if (!config.postman.workspace.apiKey) {
          spinner.fail('Postman API key not configured');
          cliLogger.error('Set POSTMAN_API_KEY in your .env file');
          process.exit(1);
        }

        spinner.update('Pushing to Postman Team Workspace...');
        const gen = createPostmanSyncGen(config);
        const result = await gen.push(options.swaggerPath);

        if (!result.ok) {
          spinner.fail('Push failed');
          handleError(result.error, 'Postman push');
        }

        spinner.succeed('Collection pushed to Postman Workspace successfully');
        cliLogger.info('Your team workspace is now up to date');
      } catch (err: unknown) {
        spinner.fail('Unexpected error');
        handleError(err, 'Push command');
      }
    });
}
