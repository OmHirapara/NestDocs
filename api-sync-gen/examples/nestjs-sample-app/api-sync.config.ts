import type { ApiSyncConfig } from '@company/api-sync-core';

const config: ApiSyncConfig = {
  entry: './src',
  exclude: ['**/*.spec.ts', '**/*.test.ts'],
  swagger: {
    output: './docs/swagger.json',
    title: 'TourMate API',
    description: 'Travel tour booking platform API',
    version: '1.0.0',
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development' },
      { url: 'https://staging-api.tourmate.com', description: 'Staging' },
    ],
    auth: { type: 'bearer' },
    ui: { enabled: true, port: 3001, path: '/docs' },
  },
  postman: {
    output: './docs/collection.json',
    collectionName: 'TourMate API',
    environments: {
      local: { baseUrl: 'http://localhost:3000', authToken: '{{LOCAL_TOKEN}}' },
      staging: { baseUrl: 'https://staging-api.tourmate.com', authToken: '{{STAGING_TOKEN}}' },
    },
    workspace: {
      apiKey: process.env.POSTMAN_API_KEY ?? '',
      workspaceId: process.env.POSTMAN_WORKSPACE_ID ?? '',
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
    model: process.env.CLAUDE_MODEL, // Optional: defaults to claude-3-5-sonnet if not set
    features: {
      autoDescribeEndpoints: true,
      autoGenerateExamples: true,
      autoGenerateTestScripts: true,
      autoGeneratePreRequest: true,
      inferReturnTypes: true,
    },
  },
  output: { pretty: true, overwrite: true, backup: true },
};

export default config;
