import type { OpenAPIV3 } from 'openapi-types';
import type { RouteDefinition, Logger } from '@company/api-sync-core';
import type { RequestBuilder } from './RequestBuilder.js';
import type { AuthBuilder } from './AuthBuilder.js';
import type { PostmanCollection, PostmanFolder, PostmanItem } from '../types.js';

/** Resolved postman config subset. */
interface PostmanConvertConfig {
  readonly collectionName: string;
  readonly authType: 'bearer' | 'apiKey' | 'both' | 'none';
}

/**
 * Converts an OpenAPI 3.0 specification to a Postman Collection v2.1 object.
 */
export class SwaggerToPostman {
  constructor(
    private readonly requestBuilder: RequestBuilder,
    private readonly authBuilder: AuthBuilder,
    private readonly config: PostmanConvertConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Converts an OpenAPI document to a Postman collection.
   * Groups requests by tag into folders.
   * @param swagger - The OpenAPI 3.0 document
   * @returns A Postman Collection object
   */
  public convert(swagger: OpenAPIV3.Document): PostmanCollection {
    this.logger.info('Converting OpenAPI spec to Postman collection');

    const groups = this.groupByTag(swagger);
    const folders: PostmanFolder[] = Object.entries(groups).map(([tag, routes]) => ({
      name: tag,
      item: routes.map((route) => this.requestBuilder.buildRequest(route)),
    }));

    const collection: PostmanCollection = {
      info: {
        name: this.config.collectionName,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: this.authBuilder.buildAuth(this.config.authType),
      item: folders,
      variable: [
        { key: 'baseUrl', value: 'http://localhost:3000' },
      ],
    };

    this.logger.info(`Converted ${String(this.countRequests(folders))} requests into ${String(folders.length)} folders`);
    return collection;
  }

  /**
   * Groups OpenAPI paths by their first tag into RouteDefinitions.
   */
  private groupByTag(swagger: OpenAPIV3.Document): Record<string, RouteDefinition[]> {
    const groups: Record<string, RouteDefinition[]> = {};

    for (const [path, pathItem] of Object.entries(swagger.paths ?? {})) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
      for (const method of methods) {
        const operation = (pathItem as Record<string, unknown>)[method] as OpenAPIV3.OperationObject | undefined;
        if (!operation) continue;

        const tag = operation.tags?.[0] ?? 'Default';
        const route = this.operationToRoute(path, method.toUpperCase(), operation);

        if (!groups[tag]) {
          groups[tag] = [];
        }
        groups[tag].push(route);
      }
    }

    return groups;
  }

  /**
   * Converts an OpenAPI operation back to a RouteDefinition for the RequestBuilder.
   */
  private operationToRoute(
    path: string,
    method: string,
    operation: OpenAPIV3.OperationObject,
  ): RouteDefinition {
    const nestPath = path.replace(/\{([^}]+)\}/g, ':$1');
    const params = (operation.parameters ?? []) as OpenAPIV3.ParameterObject[];
    const hasSecurityReq = (operation.security ?? []).length > 0;

    // Determine body type from requestBody
    let bodyType: string | undefined;
    if (operation.requestBody) {
      const reqBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
      const jsonContent = reqBody.content?.['application/json'];
      if (jsonContent?.schema) {
        const schema = jsonContent.schema as OpenAPIV3.ReferenceObject;
        if ('$ref' in schema) {
          bodyType = schema.$ref.split('/').pop();
        }
      }
    }

    const statusCodes = Object.keys(operation.responses ?? {});
    const expectedStatus = statusCodes.length > 0 ? parseInt(statusCodes[0]!, 10) : 200;

    const route: RouteDefinition = {
      method: method as RouteDefinition['method'],
      path: nestPath,
      fullPath: nestPath,
      controllerName: operation.tags?.[0] ?? 'Default',
      methodName: operation.operationId ?? `${method.toLowerCase()}${path}`,
      parameters: params.map((p) => ({
        name: p.name,
        location: p.in as 'path' | 'query' | 'header',
        type: 'string',
        required: p.required ?? false,
      })),
      expectedStatus: isNaN(expectedStatus) ? 200 : expectedStatus,
      isAuthenticated: hasSecurityReq,
      tags: operation.tags ? [...operation.tags] : [],
      ...(bodyType ? { bodyType } : {}),
      ...(operation.summary ? { summary: operation.summary } : {}),
      ...(operation.description ? { description: operation.description } : {}),
    };

    return route;
  }

  /**
   * Counts total requests across all folders.
   */
  private countRequests(folders: readonly PostmanFolder[]): number {
    return folders.reduce((sum, folder) => sum + folder.item.length, 0);
  }
}
