import axios from 'axios';
import type { AxiosError } from 'axios';
import type { Result } from '@company/api-sync-core';
import { PostmanApiError } from '../errors.js';
import type { PostmanCollection } from '../types.js';

/**
 * Full Postman REST API client for managing collections in a workspace.
 */
export class PostmanApiClient {
  private readonly baseUrl = 'https://api.getpostman.com';
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Retrieves a collection by its UID.
   * @param uid - The collection UID
   * @returns Result with the collection or a PostmanApiError
   */
  public async getCollection(uid: string): Promise<Result<PostmanCollection, PostmanApiError>> {
    try {
      const res = await axios.get<{ collection: PostmanCollection }>(
        `${this.baseUrl}/collections/${uid}`,
        { headers: this.headers },
      );
      return { ok: true, value: res.data.collection };
    } catch (cause: unknown) {
      const axiosErr = cause as AxiosError;
      if (axiosErr.response?.status === 404) {
        return { ok: false, error: new PostmanApiError('Collection not found', 404, cause) };
      }
      return { ok: false, error: new PostmanApiError('Failed to get collection', undefined, cause) };
    }
  }

  /**
   * Creates a new collection in a workspace.
   * @param workspaceId - The workspace to create the collection in
   * @param collection - The collection data
   * @returns Result with the new collection UID or a PostmanApiError
   */
  public async createCollection(
    workspaceId: string,
    collection: PostmanCollection,
  ): Promise<Result<string, PostmanApiError>> {
    try {
      const res = await axios.post<{ collection: { uid: string } }>(
        `${this.baseUrl}/collections`,
        { collection },
        { headers: this.headers, params: { workspace: workspaceId } },
      );
      return { ok: true, value: res.data.collection.uid };
    } catch (cause: unknown) {
      return { ok: false, error: new PostmanApiError('Failed to create collection', undefined, cause) };
    }
  }

  /**
   * Updates an existing collection.
   * @param uid - The collection UID to update
   * @param collection - The updated collection data
   * @returns Result indicating success or a PostmanApiError
   */
  public async updateCollection(
    uid: string,
    collection: PostmanCollection,
  ): Promise<Result<void, PostmanApiError>> {
    try {
      await axios.put(
        `${this.baseUrl}/collections/${uid}`,
        { collection },
        { headers: this.headers },
      );
      return { ok: true, value: undefined };
    } catch (cause: unknown) {
      return { ok: false, error: new PostmanApiError('Failed to update collection', undefined, cause) };
    }
  }
}
