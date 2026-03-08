import { RequestBuilder } from '../../src/converter/RequestBuilder';
import type { RouteDefinition } from '@company/api-sync-core';

describe('RequestBuilder', () => {
  let builder: RequestBuilder;

  beforeAll(() => {
    builder = new RequestBuilder();
  });

  const makeRoute = (overrides: Partial<RouteDefinition> = {}): RouteDefinition => ({
    method: 'GET',
    path: '/tours',
    fullPath: '/tours',
    controllerName: 'ToursController',
    methodName: 'findAll',
    parameters: [],
    expectedStatus: 200,
    isAuthenticated: false,
    tags: [],
    ...overrides,
  });

  it('should produce a correct Postman request for GET /tours', () => {
    const item = builder.buildRequest(makeRoute());
    expect(item.request.method).toBe('GET');
    expect(item.request.url.raw).toBe('{{baseUrl}}/tours');
    expect(item.request.url.host).toEqual(['{{baseUrl}}']);
  });

  it('should include path variable for :id param', () => {
    const item = builder.buildRequest(makeRoute({
      method: 'GET',
      path: '/:id',
      fullPath: '/tours/:id',
      methodName: 'findOne',
      parameters: [
        { name: 'id', location: 'path', type: 'string', required: true },
      ],
    }));

    expect(item.request.url.variable).toBeDefined();
    expect(item.request.url.variable!.length).toBe(1);
    expect(item.request.url.variable![0]!.key).toBe('id');
  });

  it('should add query params with disabled: true', () => {
    const item = builder.buildRequest(makeRoute({
      parameters: [
        { name: 'page', location: 'query', type: 'string', required: false },
        { name: 'limit', location: 'query', type: 'string', required: false },
      ],
    }));

    expect(item.request.url.query).toHaveLength(2);
    expect(item.request.url.query![0]!.disabled).toBe(true);
    expect(item.request.url.query![0]!.key).toBe('page');
  });

  it('should include Content-Type header for POST requests', () => {
    const item = builder.buildRequest(makeRoute({
      method: 'POST',
      methodName: 'create',
      bodyType: 'CreateTourDto',
      expectedStatus: 201,
    }));

    const contentType = item.request.header?.find((h) => h.key === 'Content-Type');
    expect(contentType).toBeDefined();
    expect(contentType!.value).toBe('application/json');
  });

  it('should include Authorization header for authenticated routes', () => {
    const item = builder.buildRequest(makeRoute({
      method: 'POST',
      methodName: 'create',
      bodyType: 'CreateTourDto',
      isAuthenticated: true,
      expectedStatus: 201,
    }));

    const authHeader = item.request.header?.find((h) => h.key === 'Authorization');
    expect(authHeader).toBeDefined();
    expect(authHeader!.value).toBe('Bearer {{authToken}}');
  });

  it('should include request body for POST with bodyType', () => {
    const item = builder.buildRequest(makeRoute({
      method: 'POST',
      methodName: 'create',
      bodyType: 'CreateTourDto',
      expectedStatus: 201,
    }));

    expect(item.request.body).toBeDefined();
    expect(item.request.body!.mode).toBe('raw');
    expect(item.request.body!.options?.raw?.language).toBe('json');
  });
});
