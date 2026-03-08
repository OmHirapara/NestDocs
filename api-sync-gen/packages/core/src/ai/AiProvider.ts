import type { RouteDefinition } from '../types/endpoint.types.js';
import type { DtoSchema } from '../types/schema.types.js';

/**
 * Interface that all AI providers must implement.
 * Provides methods for generating documentation, examples, and test scripts.
 */
export interface AiProvider {
  /**
   * Generates a concise OpenAPI description for an endpoint.
   * @param route - The route definition to describe
   * @returns A 1-2 sentence description string
   */
  describeEndpoint(route: RouteDefinition): Promise<string>;

  /**
   * Generates a realistic JSON example for a DTO schema.
   * @param dto - The DTO schema to generate an example for
   * @returns A JSON object with realistic example values
   */
  generateExample(dto: DtoSchema): Promise<Record<string, unknown>>;

  /**
   * Generates Postman test scripts for an endpoint.
   * @param route - The route definition to test
   * @param schema - A JSON Schema object describing the response
   * @returns JavaScript code using pm.test() syntax
   */
  generatePostmanTests(route: RouteDefinition, schema: Record<string, unknown>): Promise<string>;

  /**
   * Generates a Postman pre-request script for an endpoint.
   * @param route - The route definition needing pre-request setup
   * @returns JavaScript code for the pre-request script
   */
  generatePreRequestScript(route: RouteDefinition): Promise<string>;

  /**
   * Infers the return type of a route from its source code.
   * @param route - The route definition
   * @param sourceCode - The raw source code of the handler method
   * @returns A DtoSchema describing the inferred return type, or null if unknown
   */
  inferReturnType(route: RouteDefinition, sourceCode: string): Promise<DtoSchema | null>;
}
