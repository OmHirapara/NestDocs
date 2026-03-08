/**
 * Primitive types for DTO properties.
 */
export type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum' | 'unknown';

/**
 * Complete definition of a single property on a DTO/schema class.
 */
export interface PropertyDefinition {
  /** Property name */
  readonly name: string;
  /** Resolved property type */
  readonly type: PropertyType;
  /** Whether the property is required (not marked @IsOptional) */
  readonly required: boolean;
  /** Human-readable description */
  readonly description?: string;
  /** Example value for documentation */
  readonly example?: unknown;
  /** Enum values when type is 'enum' */
  readonly enumValues?: readonly string[];
  /** Item type when type is 'array' */
  readonly arrayItemType?: PropertyType;
  /** Nested schema name when type is 'object' */
  readonly nestedSchema?: string;
  /** Minimum length constraint (strings) */
  readonly minLength?: number;
  /** Maximum length constraint (strings) */
  readonly maxLength?: number;
  /** Minimum value constraint (numbers) */
  readonly min?: number;
  /** Maximum value constraint (numbers) */
  readonly max?: number;
  /** Whether the property is an email address */
  readonly isEmail?: boolean;
}

/**
 * Schema representation of a DTO class, containing all extracted properties.
 */
export interface DtoSchema {
  /** Class name of the DTO */
  readonly name: string;
  /** Absolute path to the source file */
  readonly filePath: string;
  /** All properties declared on the DTO */
  readonly properties: readonly PropertyDefinition[];
  /** Description of the DTO's purpose */
  readonly description?: string;
}

/**
 * Map of DTO class names to their schemas.
 */
export type SchemaMap = Record<string, DtoSchema>;
