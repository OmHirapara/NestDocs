import type { Logger, Result } from '@company/api-sync-core';
import { NewmanRunError } from '../errors.js';
import type { NewmanRunSummary } from '../types.js';

/** Newman run options (minimal type to avoid dependency on newman types). */
interface NewmanRunOptions {
  collection: string;
  environment?: string;
  reporters?: string[];
}

import type { NewmanRunSummary as NewmanImportRunSummary } from 'newman';

// We will use import('newman').NewmanRunSummary directly rather than duplicating the type.

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

      // Dynamically import newman to avoid bundling/typing issues
      import('newman').then((newmanModule) => {

      const options: NewmanRunOptions = {
        collection: collectionPath,
        reporters: [reporter],
      };

      if (environmentPath) {
        options.environment = environmentPath;
      }

      newmanModule.run(options, (err: Error | null, summary: NewmanImportRunSummary) => {
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
                total: summary.run.stats.requests.total ?? 0,
                failed: summary.run.stats.requests.failed ?? 0,
              },
              assertions: {
                total: summary.run.stats.assertions.total ?? 0,
                failed: summary.run.stats.assertions.failed ?? 0,
              },
            },
            failures: [...summary.run.failures],
          },
        };
        resolve({ ok: true, value: result });
        });
      }).catch((err: Error) => {
        this.logger.error(`Failed to load newman: ${err.message}`);
        resolve({ ok: false, error: new NewmanRunError('Failed to load newman package', 0, err) });
      });
    });
  }
}
