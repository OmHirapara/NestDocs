import type { OpenAPIV3 } from 'openapi-types';
import type { EndpointMap, RouteDefinition, SchemaMap } from '@company/api-sync-core';

/**
 * Converts EndpointMap (scanned controllers) to OpenAPI 3.0 paths object.
 */
export class PathBuilder {
  /**
   * Converts all controllers and routes to the OpenAPI paths object.
   * @param endpointMap - All scanned controllers with their routes
   * @param schemaMap - All parsed DTO schemas for body/response references
   * @returns The OpenAPI paths object
   */
  public buildPaths(
    endpointMap: EndpointMap,
    schemaMap: SchemaMap,
  ): OpenAPIV3.PathsObject {
    const paths: OpenAPIV3.PathsObject = {};

    for (const controller of endpointMap) {
      for (const route of controller.routes) {
        const openApiPath = this.convertPathParams(route.fullPath);

        if (!paths[openApiPath]) {
          paths[openApiPath] = {};
        }

        const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
        const pathItem = paths[openApiPath] as OpenAPIV3.PathItemObject;
        pathItem[method] = this.buildOperation(route, schemaMap);
      }
    }

    return paths;
  }

  /**
   * Builds an OpenAPI OperationObject for a single route.
   */
  private buildOperation(
    route: RouteDefinition,
    schemaMap: SchemaMap,
  ): OpenAPIV3.OperationObject {
    const operation: OpenAPIV3.OperationObject = {
      operationId: `${route.controllerName}_${route.methodName}`,
      responses: this.buildResponses(route, schemaMap),
    };

    // Tags from controller
    if (route.tags.length > 0) {
      operation.tags = [...route.tags];
    } else {
      // Default tag from controller name (strip "Controller" suffix)
      operation.tags = [route.controllerName.replace(/Controller$/i, '')];
    }

    // Summary/description
    if (route.summary) {
      operation.summary = route.summary;
    }
    if (route.description) {
      operation.description = route.description;
    }

    // Parameters (path + query)
    const parameters = this.buildParameters(route);
    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Request body for POST/PUT/PATCH
    const requestBody = this.buildRequestBody(route, schemaMap);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    // Security — authenticated routes get security requirement
    if (route.isAuthenticated) {
      operation.security = [{ BearerAuth: [] }];
    } else {
      operation.security = [];
    }

    return operation;
  }

  /**
   * Builds path and query parameters for a route.
   */
  private buildParameters(route: RouteDefinition): OpenAPIV3.ParameterObject[] {
    return route.parameters
      .filter((p) => p.location === 'path' || p.location === 'query')
      .map((p): OpenAPIV3.ParameterObject => ({
        name: p.name,
        in: p.location as 'path' | 'query',
        required: p.location === 'path',
        schema: this.buildParamSchema(p.type),
        ...(p.description ? { description: p.description } : {}),
      }));
  }

  /**
   * Builds an OpenAPI schema object for a parameter type.
   * Handles arrays (string[]), enums, objects, and primitives.
   */
  private buildParamSchema(tsType: string): OpenAPIV3.SchemaObject {
    // Handle arrays (e.g., string[], number[])
    if (tsType.endsWith('[]')) {
      const itemType = tsType.slice(0, -2);
      return {
        type: 'array',
        items: { type: this.mapPrimitiveType(itemType) },
      };
    }

    // Handle object/Record types
    if (tsType === 'object' || tsType.startsWith('Record<') || tsType.startsWith('{')) {
      return { type: 'object' };
    }

    // Primitives
    return { type: this.mapPrimitiveType(tsType) };
  }

  /**
   * Maps a TypeScript primitive type string to an OpenAPI type.
   */
  private mapPrimitiveType(tsType: string): 'string' | 'number' | 'integer' | 'boolean' {
    const normalized = tsType.toLowerCase();
    if (normalized === 'number') return 'number';
    if (normalized === 'boolean') return 'boolean';
    return 'string';
  }

  /**
   * Builds a requestBody for routes that accept a DTO body.
   */
  private buildRequestBody(
    route: RouteDefinition,
    schemaMap: SchemaMap,
  ): OpenAPIV3.RequestBodyObject | undefined {
    if (!route.bodyType) {
      return undefined;
    }

    const hasSchema = route.bodyType in schemaMap;
    const content: OpenAPIV3.MediaTypeObject = hasSchema
      ? { schema: { $ref: `#/components/schemas/${route.bodyType}` } }
      : { schema: { type: 'object' as const } };

    return {
      required: true,
      content: {
        'application/json': content,
      },
    };
  }

  /**
   * Builds the responses object for a route.
   */
  private buildResponses(
    route: RouteDefinition,
    _schemaMap: SchemaMap,
  ): OpenAPIV3.ResponsesObject {
    const statusCode = String(route.expectedStatus);

    if (route.expectedStatus === 204) {
      return {
        [statusCode]: {
          description: 'No Content',
        },
      };
    }

    const response: OpenAPIV3.ResponseObject = {
      description: this.getDefaultDescription(route.expectedStatus),
      content: {
        'application/json': {
          schema: this.resolveResponseSchema(route.returnType, _schemaMap),
        },
      },
    };

    return { [statusCode]: response };
  }

  /**
   * Resolves the return type to an OpenAPI schema.
   */
  private resolveResponseSchema(
    returnType: string | undefined,
    schemaMap: SchemaMap,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    if (!returnType || returnType === 'void') {
      return { type: 'object' };
    }

    // 1. Direct match in schemaMap
    if (returnType in schemaMap) {
      return { $ref: `#/components/schemas/${returnType}` };
    }

    // 2. Handle Arrays (e.g., UserDto[] or unknown[])
    if (returnType.endsWith('[]')) {
      const itemType = returnType.slice(0, -2);
      return {
        type: 'array',
        items: this.resolveResponseSchema(itemType, schemaMap),
      };
    }

    // 3. Handle Record/Object types
    if (returnType.startsWith('Record<') || returnType === 'object' || returnType.includes('{')) {
      return { type: 'object' };
    }

    // 4. Handle Promise wrapper (NestJS often returns Promise<T>)
    if (returnType.startsWith('Promise<')) {
      const match = returnType.match(/Promise<(.+)>/);
      if (match) {
        return this.resolveResponseSchema(match[1], schemaMap);
      }
    }

    // 5. Primitive types
    const primitive = returnType.toLowerCase();
    if (primitive === 'string') return { type: 'string' };
    if (primitive === 'number') return { type: 'number' };
    if (primitive === 'boolean') return { type: 'boolean' };

    // Fallback
    return { type: 'object' };
  }

  /**
   * Converts NestJS-style path params (:id) to OpenAPI format ({id}).
   */
  private convertPathParams(path: string): string {
    return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
  }


  /**
   * Returns a default description for a given HTTP status code.
   */
  private getDefaultDescription(statusCode: number): string {
    switch (statusCode) {
      case 200: return 'OK';
      case 201: return 'Created';
      case 204: return 'No Content';
      default: return 'Success';
    }
  }
}
