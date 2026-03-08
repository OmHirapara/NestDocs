import { readFile } from 'node:fs/promises';
import type { OpenAPIV3 } from 'openapi-types';
import type { Result, ResolvedApiSyncConfig, Logger } from '@company/api-sync-core';
import type { SwaggerToPostman } from './converter/SwaggerToPostman.js';
import type { TestScriptGenerator } from './tester/TestScriptGenerator.js';
import type { PreRequestGenerator } from './tester/PreRequestGenerator.js';
import type { WorkspacePusher } from './pusher/WorkspacePusher.js';
import type { EnvironmentBuilder } from './converter/EnvironmentBuilder.js';
import type { NewmanRunner } from './runner/NewmanRunner.js';
import type { PostmanOutput, PostmanCollection, PostmanFolder, PostmanItem, PostmanEvent } from './types.js';
import { FileWriterError } from '@company/api-sync-core';

/** Re-import FileWriter from swagger-sync-gen would create cross-package dep, so inline. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Main orchestrator for the Postman collection generation pipeline.
 * Coordinates conversion, test injection, file output, workspace push, and Newman runs.
 */
export class PostmanSyncGen {
  constructor(
    private readonly swaggerToPostman: SwaggerToPostman,
    private readonly testScriptGenerator: TestScriptGenerator,
    private readonly preRequestGenerator: PreRequestGenerator,
    private readonly workspacePusher: WorkspacePusher | null,
    private readonly environmentBuilder: EnvironmentBuilder,
    private readonly newmanRunner: NewmanRunner,
    private readonly config: ResolvedApiSyncConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Full generation pipeline: load swagger → convert → inject tests → write.
   * @param swaggerPath - Path to the swagger.json file
   * @returns Result containing output info or an error
   */
  public async generate(swaggerPath: string): Promise<Result<PostmanOutput, Error>> {
    // Step 1: Load swagger.json
    const swagger = await this.loadSwagger(swaggerPath);
    if (!swagger) {
      return { ok: false, error: new Error(`Failed to load swagger from: ${swaggerPath}`) };
    }

    // Step 2: Convert to Postman collection
    const collection = this.swaggerToPostman.convert(swagger);
    const requestCount = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
    this.logger.info(`Converted ${String(requestCount)} requests`);

    // Step 3: Inject tests into each request
    const collectionWithTests = await this.injectTests(collection);
    this.logger.info('Test scripts injected');

    // Step 4: Write collection.json
    const outputPath = this.config.postman.output;
    try {
      await mkdir(dirname(outputPath), { recursive: true });
      const content = JSON.stringify(collectionWithTests, null, this.config.output.pretty ? 2 : 0);
      await writeFile(outputPath, content, 'utf-8');
    } catch (cause: unknown) {
      return { ok: false, error: new FileWriterError(`Failed to write: ${outputPath}`, outputPath, cause) };
    }

    // Step 5: Write environment files
    const environments = this.environmentBuilder.buildAllEnvironments(
      this.config.postman.environments ?? {},
    );
    for (const env of environments) {
      const envPath = `./docs/postman-env-${env.name}.json`;
      try {
        await mkdir(dirname(envPath), { recursive: true });
        await writeFile(envPath, JSON.stringify(env, null, 2), 'utf-8');
      } catch {
        this.logger.warn(`Failed to write environment: ${envPath}`);
      }
    }

    this.logger.info(`✓ collection.json written to ${outputPath}`);
    return { ok: true, value: { collection: collectionWithTests, outputPath } };
  }

  /**
   * Generates and pushes the collection to the Postman workspace.
   * @param swaggerPath - Path to the swagger.json file
   * @returns Result indicating success or an error
   */
  public async push(swaggerPath: string): Promise<Result<void, Error>> {
    const generateResult = await this.generate(swaggerPath);
    if (!generateResult.ok) {
      return generateResult;
    }

    if (!this.workspacePusher) {
      this.logger.warn('Postman workspace not configured — skipping push');
      return { ok: true, value: undefined };
    }

    return this.workspacePusher.push(generateResult.value.collection);
  }

  /**
   * Runs a collection using Newman.
   * @param collectionPath - Path to the collection JSON
   * @param envPath - Optional environment JSON path
   * @returns Result indicating success or an error
   */
  public async run(collectionPath: string, envPath?: string): Promise<Result<void, Error>> {
    const result = await this.newmanRunner.run(collectionPath, envPath);
    return result.ok ? { ok: true, value: undefined } : result;
  }

  /**
   * Loads and parses a swagger.json file.
   */
  private async loadSwagger(swaggerPath: string): Promise<OpenAPIV3.Document | null> {
    try {
      const content = await readFile(swaggerPath, 'utf-8');
      return JSON.parse(content) as OpenAPIV3.Document;
    } catch {
      this.logger.error(`Failed to read swagger file: ${swaggerPath}`);
      return null;
    }
  }

  /**
   * Injects test and pre-request scripts into each item in the collection.
   */
  private async injectTests(collection: PostmanCollection): Promise<PostmanCollection> {
    const enrichedFolders: PostmanFolder[] = [];

    for (const folder of collection.item) {
      const enrichedItems: PostmanItem[] = [];

      for (const item of folder.item) {
        const events: PostmanEvent[] = [];

        // Generate test script
        const testScript = await this.testScriptGenerator.generateTests(
          {
            method: item.request.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            path: item.request.url.path.join('/'),
            fullPath: `/${item.request.url.path.join('/')}`,
            controllerName: folder.name,
            methodName: item.name,
            parameters: [],
            expectedStatus: 200,
            isAuthenticated: false,
            tags: [],
          },
          null,
        );

        if (testScript) {
          events.push({
            listen: 'test',
            script: { type: 'text/javascript', exec: testScript.split('\n') },
          });
        }

        // Generate pre-request script
        const preRequestScript = await this.preRequestGenerator.generatePreRequest({
          method: item.request.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          path: item.request.url.path.join('/'),
          fullPath: `/${item.request.url.path.join('/')}`,
          controllerName: folder.name,
          methodName: item.name,
          parameters: [],
          expectedStatus: 200,
          isAuthenticated: item.request.header?.some((h) => h.key === 'Authorization') ?? false,
          tags: [],
        });

        if (preRequestScript) {
          events.push({
            listen: 'prerequest',
            script: { type: 'text/javascript', exec: preRequestScript.split('\n') },
          });
        }

        enrichedItems.push({
          ...item,
          ...(events.length > 0 ? { event: events } : {}),
        });
      }

      enrichedFolders.push({ ...folder, item: enrichedItems });
    }

    return { ...collection, item: enrichedFolders };
  }
}
