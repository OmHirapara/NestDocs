import type {
  AstScanner,
  DecoratorParser,
  DtoParser,
  ControllerDefinition,
  SchemaMap,
  ResolvedApiSyncConfig,
  Logger,
  Result,
} from '@company/api-sync-core';
import type { OpenApiBuilder } from './builder/OpenApiBuilder.js';
import type { AiEnricher } from './enricher/AiEnricher.js';
import type { SpecValidator } from './validator/SpecValidator.js';
import type { FileWriter } from './writer/FileWriter.js';
import type { SwaggerUiServer } from './server/SwaggerUiServer.js';
import type { FileWatcher } from './watcher/FileWatcher.js';
import type { SwaggerOutput } from './types.js';

/**
 * Main orchestrator for the Swagger/OpenAPI generation pipeline.
 * Coordinates scanning, parsing, enrichment, building, validation, and output.
 */
export class SwaggerSyncGen {
  constructor(
    private readonly scanner: AstScanner,
    private readonly decoratorParser: DecoratorParser,
    private readonly dtoParser: DtoParser,
    private readonly openApiBuilder: OpenApiBuilder,
    private readonly aiEnricher: AiEnricher,
    private readonly specValidator: SpecValidator,
    private readonly fileWriter: FileWriter,
    private readonly swaggerUiServer: SwaggerUiServer,
    private readonly fileWatcher: FileWatcher,
    private readonly config: ResolvedApiSyncConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Runs the full generation pipeline: scan → parse → enrich → build → validate → write.
   * @returns A Result containing the swagger output or an error
   */
  public async generate(): Promise<Result<SwaggerOutput, Error>> {
    // Step 1: Scan controller files
    this.logger.info('Scanning NestJS controllers...');
    const controllerFiles = this.scanner.findControllerFiles();
    this.logger.info(`Found ${String(controllerFiles.length)} controller files`);

    // Step 2: Parse all routes
    const endpointMap: ControllerDefinition[] = [];
    for (const sourceFile of controllerFiles) {
      const controllers = this.decoratorParser.parseControllers(sourceFile);
      endpointMap.push(...controllers);
    }

    const routeCount = endpointMap.reduce((sum, ctrl) => sum + ctrl.routes.length, 0);
    this.logger.info(`Extracted ${String(routeCount)} endpoints`);

    // Step 3: Parse all DTOs
    const dtoFiles = this.scanner.findDtoFiles();
    const schemaMap: SchemaMap = {};
    for (const sourceFile of dtoFiles) {
      const schemas = this.dtoParser.parseDtos(sourceFile);
      for (const schema of schemas) {
        schemaMap[schema.name] = schema;
      }
    }

    // Step 3.5: Resolve any DTOs referenced by controllers but not found via decorators
    // This handles plain DTO classes without class-validator decorators
    const missingBodyTypes = new Set<string>();
    for (const ctrl of endpointMap) {
      for (const route of ctrl.routes) {
        if (route.bodyType && !(route.bodyType in schemaMap)) {
          missingBodyTypes.add(route.bodyType);
        }
      }
    }

    if (missingBodyTypes.size > 0) {
      this.logger.info(
        `Resolving ${String(missingBodyTypes.size)} DTO(s) not found via decorators: ${[...missingBodyTypes].join(', ')}`,
      );

      for (const className of missingBodyTypes) {
        const sourceFile = this.scanner.findClassSourceFile(className);
        if (sourceFile) {
          const schemas = this.dtoParser.parseDtos(sourceFile);
          for (const schema of schemas) {
            if (!(schema.name in schemaMap)) {
              schemaMap[schema.name] = schema;
            }
          }
        } else {
          this.logger.warn(`Could not find source file for DTO: ${className}`);
        }
      }
    }

    this.logger.info(`Parsed ${String(Object.keys(schemaMap).length)} DTO schemas`);

    // Step 4: AI enrichment (skipped if AI disabled)
    const enrichedMap = await this.aiEnricher.enrichEndpoints(endpointMap);
    const enrichedSchemas = await this.aiEnricher.enrichSchemas(schemaMap);

    // Step 5: Build OpenAPI spec
    const spec = this.openApiBuilder.build(enrichedMap, enrichedSchemas);

    // Step 6: Validate spec
    const validationResult = await this.specValidator.validate(spec);
    if (!validationResult.ok) {
      return { ok: false, error: validationResult.error };
    }

    // Step 7: Write to disk
    const writeResult = await this.fileWriter.writeJson(
      this.config.swagger.output,
      validationResult.value,
      { pretty: this.config.output.pretty, backup: this.config.output.backup },
    );
    if (!writeResult.ok) {
      return writeResult;
    }

    this.logger.info(`✓ swagger.json written to ${this.config.swagger.output}`);
    return {
      ok: true,
      value: { spec: validationResult.value, outputPath: this.config.swagger.output },
    };
  }

  /**
   * Starts the standalone Swagger UI server for a generated spec.
   */
  public serve(spec: SwaggerOutput['spec']): void {
    if (!this.config.swagger.ui.enabled) {
      return;
    }

    this.swaggerUiServer.start(spec, this.config.swagger.ui.port, this.config.swagger.ui.path);
  }

  /**
   * Runs generate() then starts file watcher and optional Swagger UI server.
   * Regenerates on every file change in the entry directory.
   */
  public async watch(): Promise<void> {
    const result = await this.generate();

    if (result.ok && this.config.swagger.ui.enabled) {
      this.serve(result.value.spec);
    }

    this.fileWatcher.watch(this.config.entry, this.config.exclude, async (_filePath: string) => {
      const regenerated = await this.generate();
      if (regenerated.ok && this.config.swagger.ui.enabled) {
        this.swaggerUiServer.updateSpec(regenerated.value.spec, this.config.swagger.ui.path);
      }
    });
  }
}
