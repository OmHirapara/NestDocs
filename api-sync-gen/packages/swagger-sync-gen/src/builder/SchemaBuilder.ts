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
    if (prop.example !== undefined) {
      schema.example = prop.example;
    }

    return schema;
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
