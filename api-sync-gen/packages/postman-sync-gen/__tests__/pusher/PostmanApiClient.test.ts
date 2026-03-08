import nock from 'nock';
import { PostmanApiClient } from '../../src/pusher/PostmanApiClient';

describe('PostmanApiClient', () => {
  const apiKey = 'test-api-key';
  let client: PostmanApiClient;

  beforeAll(() => {
    client = new PostmanApiClient(apiKey);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getCollection', () => {
    it('should return collection on 200', async () => {
      const mockCollection = {
        info: { name: 'Test', schema: 'v2.1.0' },
        item: [],
      };

      nock('https://api.getpostman.com')
        .get('/collections/test-uid')
        .reply(200, { collection: mockCollection });

      const result = await client.getCollection('test-uid');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.info.name).toBe('Test');
      }
    });

    it('should return PostmanApiError on 404', async () => {
      nock('https://api.getpostman.com')
        .get('/collections/missing-uid')
        .reply(404, { error: { name: 'notFound' } });

      const result = await client.getCollection('missing-uid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.statusCode).toBe(404);
        expect(result.error.name).toBe('PostmanApiError');
      }
    });
  });

  describe('createCollection', () => {
    it('should send correct payload and return uid', async () => {
      const mockCollection = {
        info: { name: 'New', schema: 'v2.1.0' },
        item: [],
      };

      nock('https://api.getpostman.com')
        .post('/collections')
        .query({ workspace: 'ws-123' })
        .reply(200, { collection: { uid: 'new-uid-123' } });

      const result = await client.createCollection('ws-123', mockCollection as never);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('new-uid-123');
      }
    });
  });

  describe('updateCollection', () => {
    it('should send PUT with correct UID', async () => {
      const mockCollection = {
        info: { name: 'Updated', schema: 'v2.1.0' },
        item: [],
      };

      nock('https://api.getpostman.com')
        .put('/collections/existing-uid')
        .reply(200, { collection: { uid: 'existing-uid' } });

      const result = await client.updateCollection('existing-uid', mockCollection as never);
      expect(result.ok).toBe(true);
    });
  });
});
