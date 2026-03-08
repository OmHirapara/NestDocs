import chokidar from 'chokidar';
import type { Logger } from '@company/api-sync-core';

/**
 * Watches source files for changes and triggers regeneration.
 * Used in --watch mode for development.
 */
export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  constructor(private readonly logger: Logger) {}

  /**
   * Starts watching a directory for file changes.
   * @param directory - The root directory to watch
   * @param exclude - Glob patterns to exclude from watching
   * @param onChange - Callback invoked when a file changes or is added
   */
  public watch(
    directory: string,
    exclude: readonly string[],
    onChange: (filePath: string) => Promise<void>,
  ): void {
    this.watcher = chokidar.watch(directory, {
      ignored: [...exclude, '**/node_modules/**', '**/dist/**'],
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', (filePath: string) => {
      this.logger.info(`File changed — regenerating: ${filePath}`);
      void onChange(filePath);
    });

    this.watcher.on('add', (filePath: string) => {
      this.logger.info(`File added — regenerating: ${filePath}`);
      void onChange(filePath);
    });
  }

  /**
   * Stops the file watcher.
   * @returns A promise that resolves when the watcher is closed
   */
  public stop(): Promise<void> {
    return this.watcher?.close() ?? Promise.resolve();
  }
}
