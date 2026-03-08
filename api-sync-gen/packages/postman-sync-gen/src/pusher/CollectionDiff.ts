import type { PostmanCollection } from '../types.js';

/**
 * Compares two Postman collections to determine if meaningful changes exist.
 * Strips volatile fields (timestamps, IDs) before comparison.
 */
export class CollectionDiff {
  /**
   * Returns true if the collections are meaningfully different.
   * @param oldCollection - The existing collection
   * @param newCollection - The newly generated collection
   * @returns Whether the collections have differences
   */
  public hasDiff(oldCollection: PostmanCollection, newCollection: PostmanCollection): boolean {
    const oldNorm = this.normalize(oldCollection);
    const newNorm = this.normalize(newCollection);
    return JSON.stringify(oldNorm) !== JSON.stringify(newNorm);
  }

  /**
   * Returns a human-readable summary of what changed between collections.
   * @param oldCollection - The existing collection
   * @param newCollection - The newly generated collection
   * @returns A string summarizing the changes
   */
  public summarizeDiff(
    oldCollection: PostmanCollection,
    newCollection: PostmanCollection,
  ): string {
    const oldItems = this.countItems(oldCollection);
    const newItems = this.countItems(newCollection);
    const oldFolders = oldCollection.item.length;
    const newFolders = newCollection.item.length;

    const parts: string[] = [];

    if (newFolders !== oldFolders) {
      parts.push(`Folders: ${String(oldFolders)} → ${String(newFolders)}`);
    }
    if (newItems !== oldItems) {
      parts.push(`Requests: ${String(oldItems)} → ${String(newItems)}`);
    }

    if (parts.length === 0) {
      return 'Content changed (same structure)';
    }

    return parts.join(', ');
  }

  /**
   * Strips volatile fields before comparing.
   */
  private normalize(collection: PostmanCollection): unknown {
    const clone = JSON.parse(JSON.stringify(collection)) as Record<string, unknown>;
    delete clone['_postman_id'];
    delete clone['updatedAt'];
    return clone;
  }

  /**
   * Counts total request items across all folders.
   */
  private countItems(collection: PostmanCollection): number {
    return collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
  }
}
