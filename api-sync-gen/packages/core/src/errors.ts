/**
 * Custom error for configuration validation failures.
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly details: string[],
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Custom error for AST scanning failures.
 */
export class AstScannerError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AstScannerError';
  }
}

/**
 * Custom error for DTO parsing failures.
 */
export class DtoParseError extends Error {
  constructor(
    message: string,
    public readonly className: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DtoParseError';
  }
}

/**
 * Custom error for AI provider failures.
 */
export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

/**
 * Custom error for file write operations.
 */
export class FileWriterError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'FileWriterError';
  }
}
