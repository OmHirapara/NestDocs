import { writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Result } from '@company/api-sync-core';
import { FileWriterError } from '@company/api-sync-core';

/**
 * Writes JSON data to disk with support for backups and pretty-printing.
 */
export class FileWriter {
  /**
   * Writes data as JSON to the specified file path.
   * Creates parent directories if they don't exist.
   * @param filePath - Absolute or relative path to write
   * @param data - Data to serialize as JSON
   * @param options - Formatting and backup options
   * @returns A Result indicating success or a FileWriterError
   */
  public async writeJson(
    filePath: string,
    data: unknown,
    options: { readonly pretty?: boolean; readonly backup?: boolean },
  ): Promise<Result<void, FileWriterError>> {
    try {
      await mkdir(dirname(filePath), { recursive: true });

      if (options.backup) {
        await this.backupIfExists(filePath);
      }

      const content = JSON.stringify(data, null, options.pretty ? 2 : 0);
      await writeFile(filePath, content, 'utf-8');
      return { ok: true, value: undefined };
    } catch (cause: unknown) {
      return {
        ok: false,
        error: new FileWriterError(`Failed to write file: ${filePath}`, filePath, cause),
      };
    }
  }

  /**
   * Creates a .bak copy of an existing file before overwriting.
   */
  private async backupIfExists(filePath: string): Promise<void> {
    try {
      await access(filePath);
      await copyFile(filePath, `${filePath}.bak`);
    } catch {
      // File doesn't exist — nothing to backup
    }
  }
}
