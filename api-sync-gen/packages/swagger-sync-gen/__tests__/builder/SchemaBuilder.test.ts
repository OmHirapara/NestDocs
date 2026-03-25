import type { OpenAPIV3 } from 'openapi-types';
import { SchemaBuilder } from '../../src/builder/SchemaBuilder';
import { sampleSchemaMap } from '../fixtures/sample-endpoint-map';
import type { DtoSchema } from '@company/api-sync-core';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safe in tests with known fixtures
const createTourDto = sampleSchemaMap['CreateTourDto']!;

describe('SchemaBuilder', () => {
  let builder: SchemaBuilder;

  beforeAll(() => {
    builder = new SchemaBuilder();
  });

  describe('buildComponents', () => {
    it('should build components from schema map', () => {
      const components = builder.buildComponents(sampleSchemaMap);
      expect(components).toHaveProperty('CreateTourDto');
      expect(components['CreateTourDto']).toBeDefined();
      expect(components['CreateTourDto']?.type).toBe('object');
    });
  });

  describe('buildSchema', () => {
    it('should produce type "string" with minLength 3 for @IsString + @MinLength(3)', () => {
      const schema = builder.buildSchema(createTourDto);
      const nameProps = (schema.properties ?? {})['name'] as OpenAPIV3.SchemaObject;
      expect(nameProps.type).toBe('string');
      expect(nameProps.minLength).toBe(3);
      expect(nameProps.maxLength).toBe(100);
    });

    it('should exclude optional fields from required array', () => {
      const schema = builder.buildSchema(createTourDto);
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('price');
      expect(schema.required).not.toContain('description');
      expect(schema.required).not.toContain('email');
    });

    it('should produce enum values array for @IsEnum', () => {
      const schema = builder.buildSchema(createTourDto);
      const categoryProps = (schema.properties ?? {})['category'] as OpenAPIV3.SchemaObject;
      expect(categoryProps.type).toBe('string');
      expect(categoryProps.enum).toEqual(['adventure', 'cultural', 'wildlife']);
    });

    it('should produce $ref for @ValidateNested', () => {
      const dtoWithNested: DtoSchema = {
        name: 'ParentDto',
        filePath: '/test.ts',
        properties: [{ name: 'child', type: 'object', required: true, nestedSchema: 'ChildDto' }],
      };
      const schema = builder.buildSchema(dtoWithNested);
      const childProps = (schema.properties ?? {})['child'] as OpenAPIV3.ReferenceObject;
      expect(childProps.$ref).toBe('#/components/schemas/ChildDto');
    });

    it('should produce format "email" for @IsEmail', () => {
      const schema = builder.buildSchema(createTourDto);
      const emailProps = (schema.properties ?? {})['email'] as OpenAPIV3.SchemaObject;
      expect(emailProps.type).toBe('string');
      expect(emailProps.format).toBe('email');
    });

    it('should produce number constraints for @Min/@Max', () => {
      const schema = builder.buildSchema(createTourDto);
      const priceProps = (schema.properties ?? {})['price'] as OpenAPIV3.SchemaObject;
      expect(priceProps.type).toBe('number');
      expect(priceProps.minimum).toBe(0);
      expect(priceProps.maximum).toBe(999999);
    });
  });

  describe('example generation', () => {
    it('should generate example for string properties', () => {
      const schema = builder.buildSchema(createTourDto);
      const nameProps = (schema.properties ?? {})['name'] as OpenAPIV3.SchemaObject;
      expect(nameProps.example).toBeDefined();
      expect(typeof nameProps.example).toBe('string');
    });

    it('should generate example for number properties using midpoint of min/max', () => {
      const schema = builder.buildSchema(createTourDto);
      const priceProps = (schema.properties ?? {})['price'] as OpenAPIV3.SchemaObject;
      expect(priceProps.example).toBeDefined();
      expect(typeof priceProps.example).toBe('number');
      // midpoint of 0 and 999999
      expect(priceProps.example).toBe(500000);
    });

    it('should generate "user@example.com" for email properties', () => {
      const schema = builder.buildSchema(createTourDto);
      const emailProps = (schema.properties ?? {})['email'] as OpenAPIV3.SchemaObject;
      expect(emailProps.example).toBe('user@example.com');
    });

    it('should generate first enum value as example for enum properties', () => {
      const schema = builder.buildSchema(createTourDto);
      const categoryProps = (schema.properties ?? {})['category'] as OpenAPIV3.SchemaObject;
      expect(categoryProps.example).toBe('adventure');
    });

    it('should generate a schema-level example object', () => {
      const schema = builder.buildSchema(createTourDto);
      expect(schema.example).toBeDefined();
      expect(typeof schema.example).toBe('object');
      expect(schema.example).toHaveProperty('name');
      expect(schema.example).toHaveProperty('price');
      expect(schema.example).toHaveProperty('category');
    });

    it('should use AI-provided example when available', () => {
      const dtoWithExample: DtoSchema = {
        name: 'TestDto',
        filePath: '/test.ts',
        properties: [{ name: 'title', type: 'string', required: true, example: 'My Custom Title' }],
      };
      const schema = builder.buildSchema(dtoWithExample);
      const titleProps = (schema.properties ?? {})['title'] as OpenAPIV3.SchemaObject;
      expect(titleProps.example).toBe('My Custom Title');
    });
  });
});
