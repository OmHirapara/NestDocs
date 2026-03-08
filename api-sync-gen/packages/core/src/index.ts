// ─── Types ───────────────────────────────────────────────────────────────────
export type { Result } from './types/result.types.js';
export { ok, err, isOk, isErr } from './types/result.types.js';

export type {
  HttpMethod,
  ParameterLocation,
  AuthType,
  ParameterDefinition,
  RouteDefinition,
  ControllerDefinition,
  EndpointMap,
} from './types/endpoint.types.js';

export type {
  PropertyType,
  PropertyDefinition,
  DtoSchema,
  SchemaMap,
} from './types/schema.types.js';

// ─── Logger ──────────────────────────────────────────────────────────────────
export type { LogLevel, Logger } from './logger/Logger.js';
export { ConsoleLogger, createLogger } from './logger/Logger.js';

// ─── Config ──────────────────────────────────────────────────────────────────
export type {
  ApiSyncConfig,
  ResolvedApiSyncConfig,
  ServerDefinition,
  AuthConfig,
  SwaggerConfig,
  SwaggerUiConfig,
  PostmanConfig,
  PostmanEnvironment,
  PostmanWorkspaceConfig,
  PostmanTestsConfig,
  AiConfig,
  AiFeaturesConfig,
  AiRateLimitConfig,
  OutputConfig,
} from './config/types.js';
export { apiSyncConfigSchema, resolveConfig } from './config/types.js';
export { validateConfig } from './config/ConfigValidator.js';
export { loadConfig } from './config/ConfigLoader.js';

// ─── Scanner ─────────────────────────────────────────────────────────────────
export { AstScanner } from './scanner/AstScanner.js';
export { DecoratorParser } from './scanner/DecoratorParser.js';
export { DtoParser } from './scanner/DtoParser.js';
export { EntityParser } from './scanner/EntityParser.js';

// ─── AI ──────────────────────────────────────────────────────────────────────
export type { AiProvider } from './ai/AiProvider.js';
export { ClaudeProvider } from './ai/ClaudeProvider.js';
export { OpenAiProvider } from './ai/OpenAiProvider.js';
export { createAiProvider } from './ai/AiProviderFactory.js';

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  ConfigValidationError,
  AstScannerError,
  DtoParseError,
  AiProviderError,
  FileWriterError,
} from './errors.js';
