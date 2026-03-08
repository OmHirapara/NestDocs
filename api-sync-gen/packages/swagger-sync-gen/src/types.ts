import type { OpenAPIV3 } from 'openapi-types';

/**
 * Output produced by the swagger generation pipeline.
 */
export interface SwaggerOutput {
  /** The generated and validated OpenAPI specification */
  readonly spec: OpenAPIV3.Document;
  /** Path where the spec was written to disk */
  readonly outputPath: string;
}
