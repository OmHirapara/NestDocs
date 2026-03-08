import { OpenApiBuilder } from '../../src/builder/OpenApiBuilder';
import { SchemaBuilder } from '../../src/builder/SchemaBuilder';
import { PathBuilder } from '../../src/builder/PathBuilder';
import { SecurityBuilder } from '../../src/builder/SecurityBuilder';
import { sampleEndpointMap, sampleSchemaMap } from '../fixtures/sample-endpoint-map';
import { createLogger } from '@company/api-sync-core';

describe('OpenApiBuilder', () => {
  let builder: OpenApiBuilder;

  beforeAll(() => {
    const logger = createLogger('error');
    const config = {
      title: 'Test API',
      description: 'Test description',
      version: '1.0.0',
      servers: [{ url: 'http://localhost:3000' }],
      auth: { type: 'bearer' as const, apiKeyHeader: 'X-API-Key' },
    };
    builder = new OpenApiBuilder(
      new SchemaBuilder(),
      new PathBuilder(),
      new SecurityBuilder(),
      config,
      logger,
    );
  });

  it('should produce a valid OpenAPI 3.0 document', () => {
    const doc = builder.build(sampleEndpointMap, sampleSchemaMap);
    expect(doc.openapi).toBe('3.0.0');
    expect(doc.info.title).toBe('Test API');
    expect(doc.info.version).toBe('1.0.0');
  });

  it('should include paths and components', () => {
    const doc = builder.build(sampleEndpointMap, sampleSchemaMap);
    expect(doc.paths).toBeDefined();
    expect(doc.components).toBeDefined();
    expect(doc.components!.schemas).toHaveProperty('CreateTourDto');
  });

  it('should include servers', () => {
    const doc = builder.build(sampleEndpointMap, sampleSchemaMap);
    expect(doc.servers).toHaveLength(1);
    expect(doc.servers![0]!.url).toBe('http://localhost:3000');
  });

  it('should include BearerAuth security scheme', () => {
    const doc = builder.build(sampleEndpointMap, sampleSchemaMap);
    const schemes = doc.components!.securitySchemes!;
    expect(schemes).toHaveProperty('BearerAuth');
  });
});
