import type { OpenAPIV3 } from 'openapi-types';
import type { DtoSchema, PropertyDefinition, SchemaMap } from '@company/api-sync-core';

/**
 * Converts DtoSchema objects into OpenAPI 3.0 Schema Objects
 * for the components/schemas section of the specification.
 */
export class SchemaBuilder {
  /**
   * Converts all schemas in a SchemaMap to OpenAPI component schemas.
   * @param schemas - Map of DTO names to their schema definitions
   * @returns Record of schema name to OpenAPI SchemaObject
   */
  public buildComponents(schemas: SchemaMap): Record<string, OpenAPIV3.SchemaObject> {
    const components: Record<string, OpenAPIV3.SchemaObject> = {};

    for (const [name, dto] of Object.entries(schemas)) {
      components[name] = this.buildSchema(dto);
    }

    return components;
  }

  /**
   * Converts a single DtoSchema to an OpenAPI SchemaObject.
   * @param dto - The DTO schema to convert
   * @returns An OpenAPI SchemaObject
   */
  public buildSchema(dto: DtoSchema): OpenAPIV3.SchemaObject {
    const properties: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject> = {};
    const requiredFields: string[] = [];

    for (const prop of dto.properties) {
      properties[prop.name] = this.buildProperty(prop);
      if (prop.required) {
        requiredFields.push(prop.name);
      }
    }

    const schema: OpenAPIV3.SchemaObject = {
      type: 'object' as const,
      properties,
    };

    if (requiredFields.length > 0) {
      schema.required = requiredFields;
    }

    if (dto.description) {
      schema.description = dto.description;
    }

    // Build a schema-level example from all properties
    const schemaExample = this.buildSchemaExample(dto.properties);
    if (Object.keys(schemaExample).length > 0) {
      schema.example = schemaExample;
    }

    return schema;
  }

  /**
   * Converts a single PropertyDefinition to an OpenAPI property.
   */
  private buildProperty(prop: PropertyDefinition): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
    // Handle nested object references
    if (prop.type === 'object' && prop.nestedSchema) {
      return this.buildNestedRef(prop.nestedSchema);
    }

    // Handle enum type
    if (prop.type === 'enum') {
      return this.buildEnum(prop);
    }

    // Handle array type
    if (prop.type === 'array') {
      return this.buildArray(prop);
    }

    // Handle primitive types
    const schema: OpenAPIV3.SchemaObject = {
      type: this.mapPrimitiveType(prop.type),
    };

    // Apply string constraints
    if (prop.isEmail) {
      schema.format = 'email';
    }
    if (prop.minLength !== undefined) {
      schema.minLength = prop.minLength;
    }
    if (prop.maxLength !== undefined) {
      schema.maxLength = prop.maxLength;
    }

    // Apply number constraints
    if (prop.min !== undefined) {
      schema.minimum = prop.min;
    }
    if (prop.max !== undefined) {
      schema.maximum = prop.max;
    }

    // Apply description and example
    if (prop.description) {
      schema.description = prop.description;
    }

    // Use existing example if available, otherwise generate one deterministically
    if (prop.example !== undefined) {
      schema.example = prop.example;
    } else {
      schema.example = this.generateExample(prop);
    }

    return schema;
  }

  /**
   * Generates a deterministic example value for a property based on its type,
   * constraints, and metadata. Used as a fallback when AI enrichment is disabled.
   */
  private generateExample(prop: PropertyDefinition): unknown {
    // Email format
    if (prop.isEmail) {
      return 'user@example.com';
    }

    switch (prop.type) {
      case 'string': {
        // Use property name to generate a contextual example
        const name = prop.name.toLowerCase();
        if (name.includes('email')) return 'user@example.com';
        if (name.includes('password')) return 'P@ssw0rd123';
        if (name.includes('phone')) return '+1234567890';
        if (name.includes('url') || name.includes('link') || name.includes('website'))
          return 'https://example.com';
        if (name.includes('name') && name.includes('first')) return 'John';
        if (name.includes('name') && name.includes('last')) return 'Doe';
        if (name.includes('name')) return 'Sample Name';
        if (name.includes('date') || name.includes('time')) return '2025-01-15T00:00:00.000Z';
        if (name.includes('description')) return 'A detailed description of the resource.';
        if (name.includes('title')) return 'Sample Title';
        if (name.includes('id')) return '550e8400-e29b-41d4-a716-446655440000';
        if (name.includes('address')) return '123 Main Street';
        if (name.includes('city')) return 'New York';
        if (name.includes('country')) return 'US';
        if (name.includes('location')) return 'Downtown';
        if (name.includes('color') || name.includes('colour')) return '#FF5733';
        if (name.includes('image') || name.includes('avatar') || name.includes('photo'))
          return 'https://example.com/image.jpg';

        // Use minLength to generate a plausible string
        if (prop.minLength && prop.minLength > 0) {
          const base = `sample ${prop.name}`;
          return base.length >= prop.minLength
            ? base
            : base + ' '.repeat(prop.minLength - base.length);
        }
        return 'string';
      }

      case 'number': {
        if (prop.min !== undefined && prop.max !== undefined) {
          return Math.round((prop.min + prop.max) / 2);
        }
        if (prop.min !== undefined) return prop.min;
        if (prop.max !== undefined) return prop.max;
        return 0;
      }

      case 'boolean':
        return true;

      case 'enum':
        return prop.enumValues && prop.enumValues.length > 0 ? prop.enumValues[0] : 'value';

      case 'array': {
        if (prop.arrayItemType === 'string') return ['string'];
        if (prop.arrayItemType === 'number') return [0];
        if (prop.arrayItemType === 'boolean') return [true];
        return ['item'];
      }

      case 'object':
        return {};

      default:
        return 'string';
    }
  }

  /**
   * Builds a complete example object for a schema by combining
   * generated examples from all its properties.
   */
  private buildSchemaExample(
    properties: readonly PropertyDefinition[],
  ): Record<string, unknown> {
    const example: Record<string, unknown> = {};

    for (const prop of properties) {
      if (prop.type === 'object' && prop.nestedSchema) {
        // Skip nested $ref objects — Swagger UI resolves them automatically
        continue;
      }
      if (prop.example !== undefined) {
        example[prop.name] = prop.example;
      } else {
        example[prop.name] = this.generateExample(prop);
      }
    }

    return example;
  }

  /**
   * Creates a $ref reference to a nested DTO schema.
   */
  private buildNestedRef(dtoName: string): OpenAPIV3.ReferenceObject {
    return { $ref: `#/components/schemas/${dtoName}` };
  }

  /**
   * Builds an enum schema from a property definition.
   */
  private buildEnum(prop: PropertyDefinition): OpenAPIV3.SchemaObject {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'string' as const,
    };

    if (prop.enumValues && prop.enumValues.length > 0) {
      schema.enum = [...prop.enumValues];
      // Use first enum value as example
      schema.example = prop.enumValues[0];
    }

    if (prop.description) {
      schema.description = prop.description;
    }

    return schema;
  }

  /**
   * Builds an array schema from a property definition.
   */
  private buildArray(prop: PropertyDefinition): OpenAPIV3.SchemaObject {
    let items: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

    if (prop.nestedSchema) {
      items = this.buildNestedRef(prop.nestedSchema);
    } else if (prop.arrayItemType && prop.arrayItemType !== 'unknown') {
      items = { type: this.mapPrimitiveType(prop.arrayItemType) };
    } else {
      items = { type: 'string' as const };
    }

    const schema: OpenAPIV3.SchemaObject = {
      type: 'array' as const,
      items,
    };

    if (prop.description) {
      schema.description = prop.description;
    }

    return schema;
  }

  /**
   * Maps a PropertyType to a non-array OpenAPI type string.
   */
  private mapPrimitiveType(type: string): 'string' | 'number' | 'integer' | 'boolean' | 'object' {
    switch (type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'object';
      default: return 'string';
    }
  }
}
