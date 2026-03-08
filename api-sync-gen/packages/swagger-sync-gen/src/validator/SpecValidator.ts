import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import type { Result } from '@company/api-sync-core';
import { SpecValidationError } from '../errors.js';

/**
 * Validates generated OpenAPI specifications using the official swagger-parser.
 */
export class SpecValidator {
  /**
   * Validates an OpenAPI 3.0 document against the specification.
   * @param spec - The OpenAPI document to validate
   * @returns A Result containing the validated spec or a SpecValidationError
   */
  public async validate(spec: OpenAPIV3.Document): Promise<Result<OpenAPIV3.Document, SpecValidationError>> {
    try {
      const validated = await SwaggerParser.validate(spec as never);
      return { ok: true, value: validated as unknown as OpenAPIV3.Document };
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : String(cause);
      return {
        ok: false,
        error: new SpecValidationError(
          `Generated OpenAPI spec is invalid: ${message}`,
          [message],
          cause,
        ),
      };
    }
  }
}
