import {
  AstScanner,
  DecoratorParser,
  DtoParser,
  createAiProvider,
  createLogger,
} from '@company/api-sync-core';
import type { ResolvedApiSyncConfig } from '@company/api-sync-core';
import { SchemaBuilder } from './builder/SchemaBuilder.js';
import { PathBuilder } from './builder/PathBuilder.js';
import { SecurityBuilder } from './builder/SecurityBuilder.js';
import { OpenApiBuilder } from './builder/OpenApiBuilder.js';
import { AiEnricher } from './enricher/AiEnricher.js';
import { SpecValidator } from './validator/SpecValidator.js';
import { FileWriter } from './writer/FileWriter.js';
import { SwaggerUiServer } from './server/SwaggerUiServer.js';
import { FileWatcher } from './watcher/FileWatcher.js';
import { SwaggerSyncGen } from './SwaggerSyncGen.js';

/**
 * Factory function that wires up all dependencies and creates a SwaggerSyncGen instance.
 * @param config - The fully-resolved application configuration
 * @returns A ready-to-use SwaggerSyncGen instance
 */
export function createSwaggerSyncGen(config: ResolvedApiSyncConfig): SwaggerSyncGen {
  const logger = createLogger('info');
  const aiProvider = createAiProvider(config);
  const scanner = new AstScanner(config.entry, [...config.exclude], logger);
  const decoratorParser = new DecoratorParser(logger);
  const dtoParser = new DtoParser(logger);
  const schemaBuilder = new SchemaBuilder();
  const pathBuilder = new PathBuilder();
  const securityBuilder = new SecurityBuilder();
  const openApiBuilder = new OpenApiBuilder(
    schemaBuilder,
    pathBuilder,
    securityBuilder,
    config.swagger,
    logger,
  );
  const aiEnricher = new AiEnricher(aiProvider, logger);
  const specValidator = new SpecValidator();
  const fileWriter = new FileWriter();
  const swaggerUiServer = new SwaggerUiServer(logger);
  const fileWatcher = new FileWatcher(logger);

  return new SwaggerSyncGen(
    scanner,
    decoratorParser,
    dtoParser,
    openApiBuilder,
    aiEnricher,
    specValidator,
    fileWriter,
    swaggerUiServer,
    fileWatcher,
    config,
    logger,
  );
}
