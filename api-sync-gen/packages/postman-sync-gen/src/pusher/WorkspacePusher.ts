import type { Result, Logger } from '@company/api-sync-core';
import type { PostmanApiClient } from './PostmanApiClient.js';
import type { CollectionDiff } from './CollectionDiff.js';
import type { PostmanCollection } from '../types.js';
import type { PostmanApiError } from '../errors.js';

/** Resolved workspace config subset. */
interface ResolvedWorkspaceConfig {
  readonly apiKey: string;
  readonly workspaceId: string;
  readonly collectionUid: string;
}

/**
 * Pushes collections to a Postman workspace, with diff-based skip logic.
 * Creates new collections or updates existing ones as appropriate.
 */
export class WorkspacePusher {
  constructor(
    private readonly client: PostmanApiClient,
    private readonly diff: CollectionDiff,
    private readonly config: ResolvedWorkspaceConfig,
    private readonly logger: Logger,
  ) {}

  /**
   * Pushes a collection to the configured Postman workspace.
   * If a collectionUid is configured, attempts to update; otherwise creates new.
   * Skips push if the collection hasn't changed.
   * @param collection - The collection to push
   * @returns Result indicating success or a PostmanApiError
   */
  public async push(collection: PostmanCollection): Promise<Result<void, PostmanApiError>> {
    this.logger.info('Pushing collection to Postman Workspace...');

    if (this.config.collectionUid) {
      const existing = await this.client.getCollection(this.config.collectionUid);

      if (existing.ok) {
        if (!this.diff.hasDiff(existing.value, collection)) {
          this.logger.info('Collection unchanged — skipping push');
          return { ok: true, value: undefined };
        }

        const summary = this.diff.summarizeDiff(existing.value, collection);
        this.logger.info(`Collection changed: ${summary}`);

        const result = await this.client.updateCollection(this.config.collectionUid, collection);
        if (result.ok) {
          this.logger.info('✓ Collection updated in Postman Workspace');
        }
        return result;
      }
    }

    const result = await this.client.createCollection(this.config.workspaceId, collection);
    if (result.ok) {
      this.logger.info(`✓ Collection created in Postman Workspace (uid: ${result.value})`);
    }
    return result.ok ? { ok: true, value: undefined } : result;
  }
}
