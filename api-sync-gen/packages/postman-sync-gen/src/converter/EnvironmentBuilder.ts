import type { PostmanEnvironment } from '../types.js';

/**
 * Builds Postman Environment files from application config.
 */
export class EnvironmentBuilder {
  /**
   * Builds a single Postman environment.
   * @param name - Environment name (e.g., "local", "staging")
   * @param envConfig - Base URL and optional auth token
   * @returns A Postman environment object
   */
  public buildEnvironment(
    name: string,
    envConfig: { readonly baseUrl: string; readonly authToken?: string },
  ): PostmanEnvironment {
    return {
      name,
      values: [
        { key: 'baseUrl', value: envConfig.baseUrl, enabled: true },
        { key: 'authToken', value: envConfig.authToken ?? '', enabled: true },
        { key: 'apiKey', value: '', enabled: true },
      ],
    };
  }

  /**
   * Builds environment files for all configured environments.
   * @param environments - Map of environment name to config
   * @returns Array of Postman environment objects
   */
  public buildAllEnvironments(
    environments: Record<string, { readonly baseUrl: string; readonly authToken?: string }>,
  ): PostmanEnvironment[] {
    return Object.entries(environments).map(([name, config]) =>
      this.buildEnvironment(name, config),
    );
  }
}
