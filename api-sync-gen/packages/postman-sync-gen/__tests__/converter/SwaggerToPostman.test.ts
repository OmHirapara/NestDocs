import type { OpenAPIV3 } from 'openapi-types';
import { SwaggerToPostman } from '../../src/converter/SwaggerToPostman';
import { RequestBuilder } from '../../src/converter/RequestBuilder';
import { AuthBuilder } from '../../src/converter/AuthBuilder';
import { createLogger } from '@company/api-sync-core';
import * as sampleSwagger from '../fixtures/sample-swagger.json';

describe('SwaggerToPostman', () => {
  let converter: SwaggerToPostman;

  beforeAll(() => {
    const logger = createLogger('error');
    converter = new SwaggerToPostman(
      new RequestBuilder(),
      new AuthBuilder(),
      { collectionName: 'Test Collection', authType: 'bearer' },
      logger,
    );
  });

  it('should convert swagger to a Postman collection', () => {
    const collection = converter.convert(sampleSwagger as unknown as OpenAPIV3.Document);
    expect(collection.info.name).toBe('Test Collection');
    expect(collection.info.schema).toContain('v2.1.0');
  });

  it('should group requests by tag into folders', () => {
    const collection = converter.convert(sampleSwagger as unknown as OpenAPIV3.Document);
    expect(collection.item.length).toBeGreaterThan(0);
    expect(collection.item[0]!.name).toBe('Tours');
  });

  it('should include all routes from the swagger spec', () => {
    const collection = converter.convert(sampleSwagger as unknown as OpenAPIV3.Document);
    const totalItems = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);
    expect(totalItems).toBe(4); // GET, POST, GET/:id, DELETE/:id
  });

  it('should include baseUrl variable', () => {
    const collection = converter.convert(sampleSwagger as unknown as OpenAPIV3.Document);
    expect(collection.variable).toBeDefined();
    expect(collection.variable![0]!.key).toBe('baseUrl');
  });

  it('should set bearer auth on the collection', () => {
    const collection = converter.convert(sampleSwagger as unknown as OpenAPIV3.Document);
    expect(collection.auth).toBeDefined();
    expect(collection.auth!.type).toBe('bearer');
  });
});
