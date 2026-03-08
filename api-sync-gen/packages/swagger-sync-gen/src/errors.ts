/**
 * Error thrown when building the OpenAPI specification fails.
 */
export class OpenApiBuilderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'OpenApiBuilderError';
  }
}

/**
 * Error thrown when the generated OpenAPI spec fails validation.
 */
export class SpecValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: readonly string[],
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SpecValidationError';
  }
}

/**
 * Error thrown when the Swagger UI development server fails.
 */
export class SwaggerUiServerError extends Error {
  constructor(message: string, public readonly port: number, public readonly cause?: unknown) {
    super(message);
    this.name = 'SwaggerUiServerError';
  }
}
