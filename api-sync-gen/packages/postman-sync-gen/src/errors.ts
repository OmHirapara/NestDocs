/**
 * Error thrown when converting from Swagger to Postman collection fails.
 */
export class PostmanConversionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PostmanConversionError';
  }
}

/**
 * Error thrown when a Postman API call fails.
 */
export class PostmanApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PostmanApiError';
  }
}

/**
 * Error thrown when a Newman test run has failures.
 */
export class NewmanRunError extends Error {
  constructor(
    message: string,
    public readonly failures: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NewmanRunError';
  }
}
