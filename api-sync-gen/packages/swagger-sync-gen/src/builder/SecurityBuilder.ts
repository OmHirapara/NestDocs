import type { OpenAPIV3 } from 'openapi-types';
import type { RouteDefinition } from '@company/api-sync-core';

/** Resolved auth config subset needed by SecurityBuilder. */
interface AuthConfig {
  readonly type: 'bearer' | 'apiKey' | 'both' | 'none';
  readonly apiKeyHeader: string;
}

/**
 * Builds OpenAPI security schemes and per-route security requirements
 * based on the application's auth configuration.
 */
export class SecurityBuilder {
  /**
   * Builds the securitySchemes object for the OpenAPI components section.
   * @param authConfig - The resolved auth configuration
   * @returns Map of scheme name to SecuritySchemeObject
   */
  public buildSecuritySchemes(
    authConfig: AuthConfig,
  ): Record<string, OpenAPIV3.SecuritySchemeObject> {
    const schemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {};

    if (authConfig.type === 'bearer' || authConfig.type === 'both') {
      schemes['BearerAuth'] = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      };
    }

    if (authConfig.type === 'apiKey' || authConfig.type === 'both') {
      schemes['ApiKeyAuth'] = {
        type: 'apiKey',
        in: 'header',
        name: authConfig.apiKeyHeader,
      };
    }

    return schemes;
  }

  /**
   * Builds the security requirement array for a specific route.
   * @param route - The route to build security for
   * @param authConfig - The resolved auth configuration
   * @returns Array of security requirement objects
   */
  public buildSecurityRequirement(
    route: RouteDefinition,
    authConfig: AuthConfig,
  ): OpenAPIV3.SecurityRequirementObject[] {
    if (!route.isAuthenticated) {
      return [];
    }

    const requirements: OpenAPIV3.SecurityRequirementObject[] = [];

    if (authConfig.type === 'bearer' || authConfig.type === 'both') {
      requirements.push({ BearerAuth: [] });
    }

    if (authConfig.type === 'apiKey' || authConfig.type === 'both') {
      requirements.push({ ApiKeyAuth: [] });
    }

    return requirements;
  }
}
