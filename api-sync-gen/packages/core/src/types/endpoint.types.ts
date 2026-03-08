/**
 * HTTP methods supported by NestJS route decorators.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Where a parameter is located in the HTTP request.
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'body';

/**
 * Authentication type for an endpoint.
 */
export type AuthType = 'bearer' | 'apiKey' | 'both' | 'none';

/**
 * Definition for a single endpoint parameter.
 */
export interface ParameterDefinition {
  /** Name of the parameter */
  readonly name: string;
  /** Where this parameter is found in the request */
  readonly location: ParameterLocation;
  /** TypeScript type as a string */
  readonly type: string;
  /** Whether the parameter is required */
  readonly required: boolean;
  /** Human-readable description */
  readonly description?: string;
}

/**
 * Fully-parsed definition of a single API route.
 */
export interface RouteDefinition {
  /** HTTP method (GET, POST, etc.) */
  readonly method: HttpMethod;
  /** Relative path from the controller prefix */
  readonly path: string;
  /** Full path including controller prefix */
  readonly fullPath: string;
  /** Name of the parent controller class */
  readonly controllerName: string;
  /** Name of the handler method */
  readonly methodName: string;
  /** All parameters declared on the handler */
  readonly parameters: readonly ParameterDefinition[];
  /** DTO class name if the handler accepts a @Body() */
  readonly bodyType?: string;
  /** Return type of the handler as a string */
  readonly returnType?: string;
  /** Expected HTTP status code (from @HttpCode or convention) */
  readonly expectedStatus: number;
  /** Whether the route is protected by a guard */
  readonly isAuthenticated: boolean;
  /** OpenAPI tags for grouping */
  readonly tags: readonly string[];
  /** Short summary for documentation */
  readonly summary?: string;
  /** Longer description for documentation */
  readonly description?: string;
}

/**
 * Represents a full NestJS controller with all its routes.
 */
export interface ControllerDefinition {
  /** Controller class name */
  readonly name: string;
  /** URL prefix from @Controller('prefix') */
  readonly prefix: string;
  /** Absolute path to the source file */
  readonly filePath: string;
  /** All routes declared in this controller */
  readonly routes: readonly RouteDefinition[];
}

/**
 * Collection of all scanned controllers — the top-level scan result.
 */
export type EndpointMap = readonly ControllerDefinition[];
