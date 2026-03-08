import { SpecValidator } from '../../src/validator/SpecValidator';
import type { OpenAPIV3 } from 'openapi-types';

describe('SpecValidator', () => {
  let validator: SpecValidator;

  beforeAll(() => {
    validator = new SpecValidator();
  });

  it('should validate a correct OpenAPI 3.0 document', async () => {
    const validSpec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    };

    const result = await validator.validate(validSpec);
    expect(result.ok).toBe(true);
  });

  it('should return SpecValidationError for missing required info fields', async () => {
    const invalidSpec = {
      openapi: '3.0.0',
      info: {},
      paths: {},
    } as unknown as OpenAPIV3.Document;

    const result = await validator.validate(invalidSpec);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('SpecValidationError');
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('should return error with helpful message for badly formed paths', async () => {
    const badSpec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        'no-leading-slash': {
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as unknown as OpenAPIV3.Document;

    const result = await validator.validate(badSpec);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors[0]).toBeTruthy();
    }
  });
});
