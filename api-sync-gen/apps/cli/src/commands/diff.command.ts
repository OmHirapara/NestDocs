import type { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { cliLogger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff <file1> <file2>')
    .description('Compare two swagger.json or collection.json files and show differences')
    .action(async (file1: string, file2: string) => {
      try {
        const content1 = await readFile(file1, 'utf-8');
        const content2 = await readFile(file2, 'utf-8');

        const json1 = JSON.parse(content1) as Record<string, unknown>;
        const json2 = JSON.parse(content2) as Record<string, unknown>;

        const diffs = findDiffs(json1, json2, '');

        if (diffs.length === 0) {
          cliLogger.success('Files are identical');
        } else {
          cliLogger.info(`Found ${String(diffs.length)} difference(s):\n`);
          for (const diff of diffs) {
            console.info(diff);
          }
        }
      } catch (err: unknown) {
        handleError(err, 'Diff');
      }
    });
}

function findDiffs(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  path: string,
): string[] {
  const diffs: string[] = [];
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (!(key in obj1)) {
      diffs.push(`+ ${fullPath} (added)`);
    } else if (!(key in obj2)) {
      diffs.push(`- ${fullPath} (removed)`);
    } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      diffs.push(...findDiffs(val1 as Record<string, unknown>, val2 as Record<string, unknown>, fullPath));
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      diffs.push(`~ ${fullPath}: ${JSON.stringify(val1)} → ${JSON.stringify(val2)}`);
    }
  }

  return diffs;
}
