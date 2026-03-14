import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createSwaggerSyncGen } from '@company/swagger-sync-gen';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch source files and regenerate swagger.json on changes')
    .action(async () => {
      const configResult = await loadConfig();
      if (!configResult.ok) handleError(configResult.error, 'Configuration');

      cliLogger.info('Starting watch mode — Ctrl+C to stop');
      cliLogger.divider();

      const gen = createSwaggerSyncGen(configResult.value);

      try {
        await gen.watch();
      } catch (err: unknown) {
        handleError(err, 'Watch mode');
      }
    });
}
