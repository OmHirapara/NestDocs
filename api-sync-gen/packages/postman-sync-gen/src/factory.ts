import {
  createAiProvider,
  createLogger,
} from '@company/api-sync-core';
import type { ResolvedApiSyncConfig } from '@company/api-sync-core';
import { RequestBuilder } from './converter/RequestBuilder.js';
import { AuthBuilder } from './converter/AuthBuilder.js';
import { EnvironmentBuilder } from './converter/EnvironmentBuilder.js';
import { SwaggerToPostman } from './converter/SwaggerToPostman.js';
import { TestScriptGenerator } from './tester/TestScriptGenerator.js';
import { PreRequestGenerator } from './tester/PreRequestGenerator.js';
import { PostmanApiClient } from './pusher/PostmanApiClient.js';
import { CollectionDiff } from './pusher/CollectionDiff.js';
import { WorkspacePusher } from './pusher/WorkspacePusher.js';
import { NewmanRunner } from './runner/NewmanRunner.js';
import { PostmanSyncGen } from './PostmanSyncGen.js';

/**
 * Factory function that wires up all dependencies and creates a PostmanSyncGen instance.
 * @param config - The fully-resolved application configuration
 * @returns A ready-to-use PostmanSyncGen instance
 */
export function createPostmanSyncGen(config: ResolvedApiSyncConfig): PostmanSyncGen {
  const logger = createLogger('info');
  const aiProvider = createAiProvider(config);

  const requestBuilder = new RequestBuilder();
  const authBuilder = new AuthBuilder();
  const environmentBuilder = new EnvironmentBuilder();
  const swaggerToPostman = new SwaggerToPostman(
    requestBuilder,
    authBuilder,
    {
      collectionName: config.postman.collectionName,
      authType: config.swagger.auth.type,
    },
    logger,
  );

  const testScriptGenerator = new TestScriptGenerator(aiProvider, config.postman.tests, logger);
  const preRequestGenerator = new PreRequestGenerator(aiProvider);

  // Only create workspace pusher if API key is configured
  let workspacePusher: WorkspacePusher | null = null;
  if (config.postman.workspace.apiKey) {
    const apiClient = new PostmanApiClient(config.postman.workspace.apiKey);
    const collectionDiff = new CollectionDiff();
    workspacePusher = new WorkspacePusher(apiClient, collectionDiff, config.postman.workspace, logger);
  }

  const newmanRunner = new NewmanRunner(logger);

  return new PostmanSyncGen(
    swaggerToPostman,
    testScriptGenerator,
    preRequestGenerator,
    workspacePusher,
    environmentBuilder,
    newmanRunner,
    config,
    logger,
  );
}
