import type { OpenAPIV3 } from 'openapi-types';
import type { EndpointMap, SchemaMap, Logger } from '@company/api-sync-core';
import type { SchemaBuilder } from './SchemaBuilder.js';
import type { PathBuilder } from './PathBuilder.js';
import type { SecurityBuilder } from './SecurityBuilder.js';

/** Resolved swagger config subset needed by OpenApiBuilder. */
interface ResolvedSwaggerConfig {
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly servers: readonly { readonly url: string; readonly description?: string }[];
  readonly auth: {
    readonly type: 'bearer' | 'apiKey' | 'both' | 'none';
    readonly apiKeyHeader: string;
  };
}

/**
 * Main orchestrator that produces a complete OpenAPI 3.0 document
 * by delegating to SchemaBuilder, PathBuilder, and SecurityBuilder.
 */
export class OpenApiBuilder {
  constructor(
    private readonly schemaBuilder: SchemaBuilder,
    private readonly pathBuilder: PathBuilder,
    private readonly securityBuilder: SecurityBuilder,
    private readonly config: ResolvedSwaggerConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Builds a complete OpenAPI 3.0 specification document.
   * @param endpointMap - All scanned controllers and routes
   * @param schemaMap - All parsed DTO schemas
   * @returns A complete OpenAPI 3.0 document object
   */
  public build(endpointMap: EndpointMap, schemaMap: SchemaMap): OpenAPIV3.Document {
    const routeCount = endpointMap.reduce((sum, ctrl) => sum + ctrl.routes.length, 0);
    this.logger.info(`Building OpenAPI spec with ${String(routeCount)} endpoints`);

    const servers: OpenAPIV3.ServerObject[] = this.config.servers.map((s) => ({
      url: s.url,
      ...(s.description ? { description: s.description } : {}),
    }));

    const securitySchemes = this.securityBuilder.buildSecuritySchemes(this.config.auth);

    const components: OpenAPIV3.ComponentsObject = {
      schemas: this.schemaBuilder.buildComponents(schemaMap),
    };

    if (Object.keys(securitySchemes).length > 0) {
      components.securitySchemes = securitySchemes;
    }

    const doc: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        description: this.config.description,
        version: this.config.version,
      },
      paths: this.pathBuilder.buildPaths(endpointMap, schemaMap),
      components,
    };

    if (servers.length > 0) {
      doc.servers = servers;
    }

    this.logger.info('OpenAPI spec built successfully');
    return doc;
  }
}
