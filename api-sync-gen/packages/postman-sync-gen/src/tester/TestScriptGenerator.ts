import type { RouteDefinition, AiProvider, Logger } from '@company/api-sync-core';

/** Resolved test config subset. */
interface ResolvedTestConfig {
  readonly generateStatusTests: boolean;
  readonly generateSchemaTests: boolean;
  readonly generateResponseTimeTests: boolean;
}

/**
 * Generates Postman pm.test() scripts for each route.
 * Produces baseline tests automatically and optionally leverages AI for schema tests.
 */
export class TestScriptGenerator {
  constructor(
    private readonly aiProvider: AiProvider | null,
    private readonly config: ResolvedTestConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Generates test scripts for a route.
   * @param route - The route to generate tests for
   * @param schema - Optional JSON Schema for response validation
   * @returns A string of pm.test() JavaScript code
   */
  public async generateTests(
    route: RouteDefinition,
    schema: Record<string, unknown> | null,
  ): Promise<string> {
    const baseTests = this.generateBaseTests(route);

    if (this.aiProvider && this.config.generateSchemaTests && schema) {
      try {
        const aiTests = await this.aiProvider.generatePostmanTests(route, schema);
        return `${baseTests}\n\n${aiTests}`;
      } catch {
        this.logger.warn(`AI test generation failed for ${route.method} ${route.fullPath}`);
      }
    }

    return baseTests;
  }

  /**
   * Generates baseline status code and response time tests.
   */
  private generateBaseTests(route: RouteDefinition): string {
    const expectedStatus = route.expectedStatus;
    const parts: string[] = [];

    if (this.config.generateStatusTests) {
      parts.push(
        `pm.test("Status is ${String(expectedStatus)}", function() {`,
        `  pm.response.to.have.status(${String(expectedStatus)});`,
        `});`,
      );
    }

    if (this.config.generateResponseTimeTests) {
      parts.push(
        '',
        'pm.test("Response time is under 2000ms", function() {',
        '  pm.expect(pm.response.responseTime).to.be.below(2000);',
        '});',
      );
    }

    if (this.config.generateStatusTests && expectedStatus !== 204) {
      parts.push(
        '',
        'pm.test("Response is JSON", function() {',
        '  pm.response.to.be.json;',
        '});',
      );
    }

    return parts.join('\n');
  }
}
