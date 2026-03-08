/**
 * Result type for representing success or failure outcomes.
 * Used throughout the codebase to avoid throwing exceptions from public methods.
 */
export type Result<T, E extends Error = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Creates a successful Result wrapping the given value.
 * @param value - The success value to wrap
 * @returns A Result indicating success
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result wrapping the given error.
 * @param error - The error to wrap
 * @returns A Result indicating failure
 */
export function err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard that checks if a Result is successful.
 * @param result - The Result to check
 * @returns True if the Result is ok
 */
export function isOk<T, E extends Error>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard that checks if a Result is a failure.
 * @param result - The Result to check
 * @returns True if the Result is an error
 */
export function isErr<T, E extends Error>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return !result.ok;
}
