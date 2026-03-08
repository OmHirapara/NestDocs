/**
 * Log severity levels ordered from most to least verbose.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface — all modules should depend on this, not on console directly.
 */
export interface Logger {
  /** Log debug-level messages (development only). */
  debug(message: string, ...args: unknown[]): void;
  /** Log informational messages. */
  info(message: string, ...args: unknown[]): void;
  /** Log warning messages. */
  warn(message: string, ...args: unknown[]): void;
  /** Log error messages with an optional cause for stack traces. */
  error(message: string, cause?: unknown): void;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
} as const;

const RESET = '\x1b[0m';

/**
 * Console-based Logger implementation with colored, timestamped output.
 */
export class ConsoleLogger implements Logger {
  private readonly minLevel: number;

  constructor(private readonly level: LogLevel) {
    const priority = LOG_LEVEL_PRIORITY[level];
    if (priority === undefined) {
      this.minLevel = LOG_LEVEL_PRIORITY.info;
    } else {
      this.minLevel = priority;
    }
  }

  /** @inheritdoc */
  public debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  /** @inheritdoc */
  public info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  /** @inheritdoc */
  public warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  /** @inheritdoc */
  public error(message: string, cause?: unknown): void {
    const priority = LOG_LEVEL_PRIORITY.error;
    if (priority === undefined || priority < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS.error;
    const prefix = `${RESET}${timestamp} ${color}[ERROR]${RESET}`;

    console.error(`${prefix} ${message}`);

    if (cause instanceof Error) {
      console.error(`${prefix} Caused by: ${cause.message}`);
      if (cause.stack) {
        console.error(cause.stack);
      }
    } else if (cause !== undefined) {
      console.error(`${prefix} Caused by:`, cause);
    }
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    const priority = LOG_LEVEL_PRIORITY[level];
    if (priority === undefined || priority < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS[level] ?? RESET;
    const tag = level.toUpperCase();
    const prefix = `${RESET}${timestamp} ${color}[${tag}]${RESET}`;

    if (args.length > 0) {
      console.error(`${prefix} ${message}`, ...args);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }
}

/**
 * Factory function to create a Logger instance.
 * @param level - Minimum log level to output
 * @returns A configured Logger instance
 */
export function createLogger(level: LogLevel): Logger {
  return new ConsoleLogger(level);
}
