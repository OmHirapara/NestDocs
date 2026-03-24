import type { Command } from 'commander';
import { loadConfig } from '@company/api-sync-core';
import { createSwaggerSyncGen } from '@company/swagger-sync-gen';
import { createPostmanSyncGen } from '@company/postman-sync-gen';
import { Spinner } from '../utils/spinner.js';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerAllCommand(program: Command): void {
  program
    .command('all')
    .description('Generate swagger.json + collection.json and push to Postman Workspace')
    .option('--no-push', 'Skip pushing to Postman Workspace')
    .option('--no-serve', 'Skip opening Swagger UI')
    .action(async (options: { push: boolean; serve: boolean }) => {
      cliLogger.blank();
      cliLogger.info('api-sync — Starting full generation pipeline');
      cliLogger.divider();

      // Step 1: Load config
      cliLogger.step(1, 5, 'Loading configuration...');
      const configResult = await loadConfig();
      if (!configResult.ok) handleError(configResult.error, 'Configuration');
      const config = configResult.value;

      // Step 2: Generate swagger.json
      cliLogger.step(2, 5, 'Generating swagger.json...');
      const swaggerSpinner = new Spinner('Scanning NestJS controllers...');
      swaggerSpinner.start();

      const swaggerGen = createSwaggerSyncGen(config);
      const swaggerResult = await swaggerGen.generate();

      if (!swaggerResult.ok) {
        swaggerSpinner.fail('swagger.json generation failed');
        handleError(swaggerResult.error, 'Swagger generation');
      }

      swaggerSpinner.succeed(`swagger.json → ${swaggerResult.value.outputPath}`);

      // Step 3: Start Swagger UI
      if (options.serve && config.swagger.ui.enabled) {
        cliLogger.step(3, 5, 'Starting Swagger UI...');
        swaggerGen.serve(swaggerResult.value.spec);
        const port = config.swagger.ui.port;
        const path = config.swagger.ui.path;
        cliLogger.success(`Swagger UI → http://localhost:${String(port)}${path}`);
      } else {
        cliLogger.step(3, 5, 'Swagger UI skipped');
      }

      // Step 4: Generate collection.json
      cliLogger.step(4, 5, 'Generating Postman collection...');
      const postmanSpinner = new Spinner('Converting to Postman format...');
      postmanSpinner.start();

      const postmanGen = createPostmanSyncGen(config);
      const postmanResult = await postmanGen.generate(swaggerResult.value.outputPath);

      if (!postmanResult.ok) {
        postmanSpinner.fail('collection.json generation failed');
        handleError(postmanResult.error, 'Postman generation');
      }

      postmanSpinner.succeed(`collection.json → ${postmanResult.value.outputPath}`);

      // Step 5: Push to Postman Workspace
      if (options.push && config.postman.workspace.apiKey) {
        cliLogger.step(5, 5, 'Pushing to Postman Team Workspace...');
        const pushSpinner = new Spinner('Connecting to Postman API...');
        pushSpinner.start();

        const pushResult = await postmanGen.push(swaggerResult.value.outputPath);

        if (!pushResult.ok) {
          pushSpinner.fail('Workspace push failed');
          cliLogger.warn(`Push failed: ${pushResult.error.message}`);
          cliLogger.warn(
            'Collection saved locally — import manually or check your POSTMAN_API_KEY',
          );
        } else {
          pushSpinner.succeed('Postman Team Workspace updated');
        }
      } else {
        cliLogger.step(5, 5, 'Workspace push skipped (no POSTMAN_API_KEY or --no-push)');
      }

      // Final summary
      cliLogger.divider();
      cliLogger.success('Generation complete!');
      cliLogger.blank();
    });
}
