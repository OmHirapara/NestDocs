import { TestScriptGenerator } from '../../src/tester/TestScriptGenerator';
import { createLogger } from '@company/api-sync-core';
import type { RouteDefinition } from '@company/api-sync-core';

describe('TestScriptGenerator', () => {
  const logger = createLogger('error');
  const config = {
    generateStatusTests: true,
    generateSchemaTests: false,
    generateResponseTimeTests: true,
  };

  let generator: TestScriptGenerator;

  beforeAll(() => {
    generator = new TestScriptGenerator(null, config, logger);
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

  it('should generate status code test', async () => {
    const script = await generator.generateTests(makeRoute(), null);
    expect(script).toContain('pm.test("Status is 200"');
    expect(script).toContain('pm.response.to.have.status(200)');
  });

  it('should generate response time test', async () => {
    const script = await generator.generateTests(makeRoute(), null);
    expect(script).toContain('pm.response.responseTime');
    expect(script).toContain('2000');
  });

  it('should generate JSON response test for non-204 routes', async () => {
    const script = await generator.generateTests(makeRoute(), null);
    expect(script).toContain('pm.response.to.be.json');
  });

  it('should not generate JSON test for 204 responses', async () => {
    const script = await generator.generateTests(
      makeRoute({ expectedStatus: 204 }),
      null,
    );
    expect(script).toContain('Status is 204');
    expect(script).not.toContain('pm.response.to.be.json');
  });

  it('should use correct status code from route', async () => {
    const script = await generator.generateTests(
      makeRoute({ expectedStatus: 201 }),
      null,
    );
    expect(script).toContain('pm.response.to.have.status(201)');
  });
});
