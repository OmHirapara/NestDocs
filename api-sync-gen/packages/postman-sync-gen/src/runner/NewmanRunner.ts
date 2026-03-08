import type { Logger, Result } from '@company/api-sync-core';
import { NewmanRunError } from '../errors.js';
import type { NewmanRunSummary } from '../types.js';

/** Newman run options (minimal type to avoid dependency on newman types). */
interface NewmanRunOptions {
  collection: string;
  environment?: string;
  reporters?: readonly string[];
}

/** Newman callback summary (minimal type). */
interface NewmanCallbackSummary {
  run: {
    stats: {
      requests: { total: number; failed: number };
      assertions: { total: number; failed: number };
    };
    failures: readonly unknown[];
  };
}

/**
 * Runs Postman collections using Newman for automated API testing.
 */
export class NewmanRunner {
  constructor(private readonly logger: Logger) {}

  /**
   * Runs a Postman collection file with Newman.
   * @param collectionPath - Path to the collection JSON file
   * @param environmentPath - Optional path to an environment JSON file
   * @param reporter - Reporter type (cli, html, json)
   * @returns Result with run summary or a NewmanRunError
   */
  public run(
    collectionPath: string,
    environmentPath?: string,
    reporter: 'cli' | 'html' | 'json' = 'cli',
  ): Promise<Result<NewmanRunSummary, NewmanRunError>> {
    return new Promise((resolve) => {
      this.logger.info('Running Postman collection with Newman...');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const newmanModule = require('newman') as {
        run: (
          options: NewmanRunOptions,
          callback: (err: Error | null, summary: NewmanCallbackSummary) => void,
        ) => void;
      };

      const options: NewmanRunOptions = {
        collection: collectionPath,
        reporters: [reporter],
      };

      if (environmentPath) {
        options.environment = environmentPath;
      }

      newmanModule.run(options, (err: Error | null, summary: NewmanCallbackSummary) => {
        if (err) {
          resolve({ ok: false, error: new NewmanRunError(err.message, 0, err) });
          return;
        }

        const failures = summary.run.failures.length;
        if (failures > 0) {
          this.logger.warn(`Newman run completed with ${String(failures)} failures`);
          resolve({
            ok: false,
            error: new NewmanRunError(`${String(failures)} tests failed`, failures),
          });
          return;
        }

        this.logger.info('✓ All Newman tests passed');
        const result: NewmanRunSummary = {
          run: {
            stats: {
              requests: {
                total: summary.run.stats.requests.total,
                failed: summary.run.stats.requests.failed,
              },
              assertions: {
                total: summary.run.stats.assertions.total,
                failed: summary.run.stats.assertions.failed,
              },
            },
            failures: [...summary.run.failures],
          },
        };
        resolve({ ok: true, value: result });
      });
    });
  }
}
