import type { OpenAPIV3 } from 'openapi-types';
import { SchemaBuilder } from '../../src/builder/SchemaBuilder';
import { sampleSchemaMap } from '../fixtures/sample-endpoint-map';
import type { DtoSchema, PropertyDefinition } from '@company/api-sync-core';

describe('SchemaBuilder', () => {
  let builder: SchemaBuilder;

  beforeAll(() => {
    builder = new SchemaBuilder();
  });

  describe('buildComponents', () => {
    it('should build components from schema map', () => {
      const components = builder.buildComponents(sampleSchemaMap);
      expect(components).toHaveProperty('CreateTourDto');
      expect(components['CreateTourDto']!.type).toBe('object');
    });
  });

  describe('buildSchema', () => {
    it('should produce type "string" with minLength 3 for @IsString + @MinLength(3)', () => {
      const schema = builder.buildSchema(sampleSchemaMap['CreateTourDto']!);
      const nameProps = schema.properties!['name'] as OpenAPIV3.SchemaObject;
      expect(nameProps.type).toBe('string');
      expect(nameProps.minLength).toBe(3);
      expect(nameProps.maxLength).toBe(100);
    });

    it('should exclude optional fields from required array', () => {
      const schema = builder.buildSchema(sampleSchemaMap['CreateTourDto']!);
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('price');
      expect(schema.required).not.toContain('description');
      expect(schema.required).not.toContain('email');
    });

    it('should produce enum values array for @IsEnum', () => {
      const schema = builder.buildSchema(sampleSchemaMap['CreateTourDto']!);
      const categoryProps = schema.properties!['category'] as OpenAPIV3.SchemaObject;
      expect(categoryProps.type).toBe('string');
      expect(categoryProps.enum).toEqual(['adventure', 'cultural', 'wildlife']);
    });

    it('should produce $ref for @ValidateNested', () => {
      const dtoWithNested: DtoSchema = {
        name: 'ParentDto',
        filePath: '/test.ts',
        properties: [
          { name: 'child', type: 'object', required: true, nestedSchema: 'ChildDto' },
        ],
      };
      const schema = builder.buildSchema(dtoWithNested);
      const childProps = schema.properties!['child'] as OpenAPIV3.ReferenceObject;
      expect(childProps.$ref).toBe('#/components/schemas/ChildDto');
    });

    it('should produce format "email" for @IsEmail', () => {
      const schema = builder.buildSchema(sampleSchemaMap['CreateTourDto']!);
      const emailProps = schema.properties!['email'] as OpenAPIV3.SchemaObject;
      expect(emailProps.type).toBe('string');
      expect(emailProps.format).toBe('email');
    });

    it('should produce number constraints for @Min/@Max', () => {
      const schema = builder.buildSchema(sampleSchemaMap['CreateTourDto']!);
      const priceProps = schema.properties!['price'] as OpenAPIV3.SchemaObject;
      expect(priceProps.type).toBe('number');
      expect(priceProps.minimum).toBe(0);
      expect(priceProps.maximum).toBe(999999);
    });
  });
});
