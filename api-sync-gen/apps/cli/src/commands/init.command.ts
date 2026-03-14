import type { Command } from 'commander';
import { writeFile, access } from 'node:fs/promises';
import { cliLogger } from '../utils/logger.js';

const CONFIG_TEMPLATE = `import type { ApiSyncConfig } from '@company/api-sync-core';

const config: ApiSyncConfig = {
  entry: './src',
  exclude: ['**/*.spec.ts', '**/*.test.ts'],

  swagger: {
    output: './docs/swagger.json',
    title: 'My API',
    description: 'Auto-generated API documentation',
    version: '1.0.0',
    servers: [
      { url: 'http://localhost:3000', description: 'Local' },
    ],
    auth: { type: 'bearer' },
    ui: { enabled: true, port: 3001, path: '/docs' },
  },

  postman: {
    output: './docs/collection.json',
    collectionName: 'My API',
    environments: {
      local: { baseUrl: 'http://localhost:3000' },
    },
    workspace: {
      apiKey: process.env.POSTMAN_API_KEY!,
      workspaceId: process.env.POSTMAN_WORKSPACE_ID!,
    },
    tests: {
      generateStatusTests: true,
      generateSchemaTests: true,
      generateResponseTimeTests: true,
    },
  },

  ai: {
    enabled: !!process.env.CLAUDE_API_KEY,
    provider: 'claude',
    apiKey: process.env.CLAUDE_API_KEY,
    features: {
      autoDescribeEndpoints: true,
      autoGenerateExamples: true,
      autoGenerateTestScripts: true,
    },
  },

  output: {
    pretty: true,
    overwrite: true,
    backup: true,
  },
};

export default config;
`;

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Create api-sync.config.ts in current directory')
    .option('--force', 'Overwrite existing config file')
    .action(async (options: { force?: boolean }) => {
      const configPath = './api-sync.config.ts';

      try {
        await access(configPath);
        if (!options.force) {
          cliLogger.warn('api-sync.config.ts already exists. Use --force to overwrite.');
          return;
        }
      } catch {
        // File doesn't exist — proceed
      }

      await writeFile(configPath, CONFIG_TEMPLATE, 'utf-8');
      cliLogger.success('Created api-sync.config.ts');
      cliLogger.info('Next steps:');
      cliLogger.info('  1. Add CLAUDE_API_KEY and POSTMAN_API_KEY to your .env file');
      cliLogger.info('  2. Run: npx api-sync all');
    });
}
