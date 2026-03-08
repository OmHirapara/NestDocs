import type { RouteDefinition, AiProvider } from '@company/api-sync-core';

/**
 * Generates Postman pre-request scripts for authenticated routes.
 * Ensures auth tokens are set before requests execute.
 */
export class PreRequestGenerator {
  constructor(private readonly aiProvider: AiProvider | null) {}

  /**
   * Generates a pre-request script for a route.
   * @param route - The route needing pre-request setup
   * @returns JavaScript code for the pre-request script, or empty string if not needed
   */
  public async generatePreRequest(route: RouteDefinition): Promise<string> {
    if (!route.isAuthenticated) {
      return '';
    }

    const baseScript = [
      'const token = pm.environment.get("authToken");',
      'if (!token) {',
      '  throw new Error("authToken is not set in environment. Please set it before running this request.");',
      '}',
      'pm.request.headers.add({',
      '  key: "Authorization",',
      '  value: "Bearer " + token',
      '});',
    ].join('\n');

    if (this.aiProvider) {
      try {
        const aiScript = await this.aiProvider.generatePreRequestScript(route);
        return aiScript || baseScript;
      } catch {
        return baseScript;
      }
    }

    return baseScript;
  }
}
