import type { RouteDefinition } from '@company/api-sync-core';
import type {
  PostmanItem,
  PostmanRequest,
  PostmanUrl,
  PostmanQueryParam,
  PostmanVariable,
  PostmanHeader,
  PostmanBody,
} from '../types.js';

/**
 * Builds a Postman Request item from a RouteDefinition.
 */
export class RequestBuilder {
  /**
   * Builds a complete Postman request item from a route definition.
   * @param route - The route definition to convert
   * @returns A Postman Item with the request configured
   */
  public buildRequest(route: RouteDefinition): PostmanItem {
    const body = this.buildBody(route);
    const request: PostmanRequest = {
      method: route.method,
      url: this.buildUrl(route),
      header: this.buildHeaders(route),
      ...(body !== undefined ? { body } : {}),
      ...(route.description ? { description: route.description } : {}),
    };

    return {
      name: this.buildRequestName(route),
      request,
    };
  }

  /**
   * Builds the Postman URL object from a route.
   */
  private buildUrl(route: RouteDefinition): PostmanUrl {
    const postmanPath = this.convertToPostmanPath(route.fullPath);
    const pathSegments = postmanPath
      .split('/')
      .filter((s) => s.length > 0);

    return {
      raw: `{{baseUrl}}${postmanPath}`,
      host: ['{{baseUrl}}'],
      path: pathSegments,
      ...(this.buildQueryParams(route).length > 0 ? { query: this.buildQueryParams(route) } : {}),
      ...(this.buildPathVariables(route).length > 0 ? { variable: this.buildPathVariables(route) } : {}),
    };
  }

  /**
   * Converts NestJS-style path to Postman format.
   * NestJS uses :param, Postman also uses :param — same convention.
   */
  private convertToPostmanPath(path: string): string {
    return path;
  }

  /**
   * Builds path variable definitions for :param segments.
   */
  private buildPathVariables(route: RouteDefinition): PostmanVariable[] {
    return route.parameters
      .filter((p) => p.location === 'path')
      .map((p): PostmanVariable => ({
        key: p.name,
        value: '',
        ...(p.description ? { description: p.description } : {}),
      }));
  }

  /**
   * Builds query params — disabled by default so user can enable as needed.
   */
  private buildQueryParams(route: RouteDefinition): PostmanQueryParam[] {
    return route.parameters
      .filter((p) => p.location === 'query')
      .map((p): PostmanQueryParam => ({
        key: p.name,
        value: '',
        disabled: true,
        ...(p.description ? { description: p.description } : {}),
      }));
  }

  /**
   * Builds headers — Content-Type for POST/PUT/PATCH.
   */
  private buildHeaders(route: RouteDefinition): PostmanHeader[] {
    const headers: PostmanHeader[] = [];

    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      headers.push({ key: 'Content-Type', value: 'application/json' });
    }

    if (route.isAuthenticated) {
      headers.push({ key: 'Authorization', value: 'Bearer {{authToken}}' });
    }

    return headers;
  }

  /**
   * Builds request body for routes that accept a body DTO.
   */
  private buildBody(route: RouteDefinition): PostmanBody | undefined {
    if (!route.bodyType) {
      return undefined;
    }

    return {
      mode: 'raw',
      raw: JSON.stringify({}, null, 2),
      options: {
        raw: { language: 'json' },
      },
    };
  }

  /**
   * Generates a human-readable request name.
   * Example: "GET /tours/:id → Get Tour By Id"
   */
  private buildRequestName(route: RouteDefinition): string {
    if (route.summary) {
      return route.summary;
    }

    const methodName = route.methodName
      .replace(/([A-Z])/g, ' $1')
      .trim();

    const formattedName = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    return `${route.method} ${route.fullPath} — ${formattedName}`;
  }
}
