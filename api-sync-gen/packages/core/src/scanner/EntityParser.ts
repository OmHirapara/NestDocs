import type { SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { Logger } from '../logger/Logger.js';
import type { DtoSchema, PropertyDefinition, PropertyType } from '../types/schema.types.js';

/**
 * Maximum depth for recursively resolving entity relations to prevent circular loops.
 */
const MAX_RELATION_DEPTH = 2;

/**
 * TypeORM column type to PropertyType mapping.
 */
const COLUMN_TYPE_MAP: Record<string, PropertyType> = {
  varchar: 'string',
  text: 'string',
  char: 'string',
  int: 'number',
  integer: 'number',
  float: 'number',
  double: 'number',
  decimal: 'number',
  bigint: 'number',
  smallint: 'number',
  boolean: 'boolean',
  bool: 'boolean',
  json: 'object',
  jsonb: 'object',
  enum: 'enum',
  'simple-array': 'array',
  'simple-json': 'object',
} as const;

/**
 * Parses TypeORM @Entity and Mongoose @Schema decorated classes,
 * extracting column/prop definitions into DtoSchema format.
 */
export class EntityParser {
  constructor(private readonly logger: Logger) {}

  /**
   * Parses all entity/schema classes from a source file.
   * @param sourceFile - The source file containing entity/schema classes
   * @returns Array of DtoSchema representing entity structures
   */
  public parseEntities(sourceFile: SourceFile): DtoSchema[] {
    const schemas: DtoSchema[] = [];
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      const isTypeOrmEntity = cls.getDecorator('Entity') !== undefined;
      const isMongooseSchema = cls.getDecorator('Schema') !== undefined;

      if (!isTypeOrmEntity && !isMongooseSchema) {
        continue;
      }

      const className = cls.getName();
      if (!className) {
        continue;
      }

      this.logger.debug(`Parsing entity: ${className} (${isTypeOrmEntity ? 'TypeORM' : 'Mongoose'})`);

      const properties = isTypeOrmEntity
        ? this.parseTypeOrmEntity(cls, sourceFile, 0)
        : this.parseMongooseSchema(cls, sourceFile);

      schemas.push({
        name: className,
        filePath: sourceFile.getFilePath(),
        properties,
        description: `Entity: ${className}`,
      });
    }

    return schemas;
  }

  /**
   * Parses a TypeORM entity class, extracting columns and relations.
   */
  private parseTypeOrmEntity(
    cls: ReturnType<SourceFile['getClasses']>[number],
    sourceFile: SourceFile,
    depth: number,
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const classProperties = cls.getProperties();

    for (const prop of classProperties) {
      const name = prop.getName();

      // Check for @PrimaryGeneratedColumn
      const primaryGenDecorator = prop.getDecorator('PrimaryGeneratedColumn');
      if (primaryGenDecorator) {
        properties.push({
          name,
          type: 'number',
          required: true,
          description: 'Primary auto-generated key',
        });
        continue;
      }

      // Check for @PrimaryColumn
      const primaryColDecorator = prop.getDecorator('PrimaryColumn');
      if (primaryColDecorator) {
        const colType = this.extractColumnType(primaryColDecorator);
        properties.push({
          name,
          type: colType,
          required: true,
          description: 'Primary key',
        });
        continue;
      }

      // Check for @Column
      const columnDecorator = prop.getDecorator('Column');
      if (columnDecorator) {
        const colType = this.extractColumnType(columnDecorator);
        const isNullable = this.extractColumnNullable(columnDecorator);
        const enumValues = colType === 'enum' ? this.extractColumnEnumValues(columnDecorator) : undefined;

        const colProp: PropertyDefinition = {
          name,
          type: colType,
          required: !isNullable,
          ...(enumValues !== undefined ? { enumValues } : {}),
        };

        properties.push(colProp);
        continue;
      }

      // Check for relation decorators — resolve if within depth limit
      const relationType = this.getRelationType(prop);
      if (relationType) {
        if (depth >= MAX_RELATION_DEPTH) {
          // Cut circular references
          properties.push({
            name,
            type: relationType === 'OneToMany' || relationType === 'ManyToMany' ? 'array' : 'object',
            required: false,
            description: `Relation (${relationType}) — circular reference cut at depth ${String(MAX_RELATION_DEPTH)}`,
          });
        } else {
          const relatedType = this.inferTypeFromTypeScript(prop);
          const relProp: PropertyDefinition = {
            name,
            type: relationType === 'OneToMany' || relationType === 'ManyToMany' ? 'array' : 'object',
            required: false,
            description: `Relation: ${relationType}`,
            ...(relatedType !== 'unknown' ? { nestedSchema: relatedType } : {}),
          };

          properties.push(relProp);
        }
        continue;
      }
    }

    return properties;
  }

  /**
   * Parses a Mongoose schema class, extracting @Prop decorators.
   */
  private parseMongooseSchema(
    cls: ReturnType<SourceFile['getClasses']>[number],
    _sourceFile: SourceFile,
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const classProperties = cls.getProperties();

    for (const prop of classProperties) {
      const propDecorator = prop.getDecorator('Prop');
      if (!propDecorator) {
        continue;
      }

      const name = prop.getName();
      let type: PropertyType = 'unknown';
      let required = false;
      let enumValues: string[] | undefined;

      const args = propDecorator.getArguments();
      if (args.length > 0 && args[0]) {
        const firstArg = args[0];
        if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
          if (obj) {
            for (const objProp of obj.getProperties()) {
              if (objProp.getKind() === SyntaxKind.PropertyAssignment) {
                const pa = objProp.asKind(SyntaxKind.PropertyAssignment);
                if (!pa) continue;
                const propName = pa.getName();
                const propValue = pa.getInitializer()?.getText();

                if (propName === 'required' && propValue === 'true') {
                  required = true;
                }
                if (propName === 'type' && propValue) {
                  type = this.mapMongooseTypeToPropertyType(propValue);
                }
                if (propName === 'enum' && propValue) {
                  type = 'enum';
                  // Try to parse array literal
                  const values = propValue.replace(/\[|\]/g, '').split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, ''));
                  enumValues = values.filter((v) => v.length > 0);
                }
              }
            }
          }
        }
      }

      // Infer from TypeScript if still unknown
      if (type === 'unknown') {
        const tsType = this.inferTypeStringFromTypeScript(prop);
        type = this.mapTsTypeToPropertyType(tsType);
      }

      const mongooseProp: PropertyDefinition = {
        name,
        type,
        required,
        ...(enumValues !== undefined ? { enumValues } : {}),
      };

      properties.push(mongooseProp);
    }

    return properties;
  }

  /**
   * Extracts the column type from a @Column decorator.
   */
  private extractColumnType(
    decorator: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number],
  ): PropertyType {
    const args = decorator.getArguments();
    if (args.length === 0) {
      return 'string';
    }

    const firstArg = args[0];
    if (!firstArg) {
      return 'string';
    }

    // @Column('varchar') — string argument
    if (firstArg.getKind() === SyntaxKind.StringLiteral) {
      const text = firstArg.getText().replace(/^['"]|['"]$/g, '');
      return COLUMN_TYPE_MAP[text] ?? 'string';
    }

    // @Column({ type: 'varchar', ... }) — object argument
    if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
      if (obj) {
        for (const prop of obj.getProperties()) {
          if (prop.getKind() === SyntaxKind.PropertyAssignment) {
            const pa = prop.asKind(SyntaxKind.PropertyAssignment);
            if (pa && pa.getName() === 'type') {
              const value = pa.getInitializer()?.getText().replace(/^['"]|['"]$/g, '');
              if (value) {
                return COLUMN_TYPE_MAP[value] ?? 'string';
              }
            }
          }
        }
      }
    }

    return 'string';
  }

  /**
   * Checks if a column is nullable based on the decorator options.
   */
  private extractColumnNullable(
    decorator: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number],
  ): boolean {
    const args = decorator.getArguments();
    if (args.length === 0) {
      return false;
    }

    const firstArg = args[0];
    if (!firstArg || firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      return false;
    }

    const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
    if (!obj) {
      return false;
    }

    for (const prop of obj.getProperties()) {
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const pa = prop.asKind(SyntaxKind.PropertyAssignment);
        if (pa && pa.getName() === 'nullable') {
          return pa.getInitializer()?.getText() === 'true';
        }
      }
    }

    return false;
  }

  /**
   * Extracts enum values from a @Column({ type: 'enum', enum: MyEnum }) decorator.
   */
  private extractColumnEnumValues(
    decorator: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number],
  ): string[] | undefined {
    const args = decorator.getArguments();
    if (args.length === 0 || !args[0]) {
      return undefined;
    }

    const firstArg = args[0];
    if (firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      return undefined;
    }

    const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
    if (!obj) {
      return undefined;
    }

    for (const prop of obj.getProperties()) {
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const pa = prop.asKind(SyntaxKind.PropertyAssignment);
        if (pa && pa.getName() === 'enum') {
          const initializer = pa.getInitializer();
          if (initializer) {
            // Try to resolve as an enum name
            const text = initializer.getText();
            // If it's an array literal, parse directly
            if (text.startsWith('[')) {
              return text
                .replace(/\[|\]/g, '')
                .split(',')
                .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
                .filter((v) => v.length > 0);
            }
            // Otherwise it's an enum reference — return the name
            return [text];
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Gets the relation decorator type from a property.
   */
  private getRelationType(
    prop: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getProperties']>[number],
  ): string | undefined {
    const relationDecorators = ['ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne'] as const;

    for (const relName of relationDecorators) {
      if (prop.getDecorator(relName)) {
        return relName;
      }
    }

    return undefined;
  }

  /**
   * Infers a type name from TypeScript type annotation as a string.
   */
  private inferTypeFromTypeScript(
    prop: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getProperties']>[number],
  ): string {
    const typeNode = prop.getTypeNode();
    if (typeNode) {
      return typeNode.getText();
    }
    return 'unknown';
  }

  /**
   * Infers TypeScript type string from the property.
   */
  private inferTypeStringFromTypeScript(
    prop: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getProperties']>[number],
  ): string {
    const typeNode = prop.getTypeNode();
    if (typeNode) {
      return typeNode.getText();
    }
    return prop.getType().getText();
  }

  /**
   * Maps a Mongoose type string to PropertyType.
   */
  private mapMongooseTypeToPropertyType(typeStr: string): PropertyType {
    const normalized = typeStr.trim();
    if (normalized === 'String') return 'string';
    if (normalized === 'Number') return 'number';
    if (normalized === 'Boolean') return 'boolean';
    if (normalized === 'Date') return 'string';
    if (normalized === 'Schema.Types.ObjectId') return 'string';
    if (normalized.startsWith('[')) return 'array';
    return 'object';
  }

  /**
   * Maps a TypeScript type string to PropertyType.
   */
  private mapTsTypeToPropertyType(tsType: string): PropertyType {
    const normalized = tsType.toLowerCase().trim();
    if (normalized === 'string') return 'string';
    if (normalized === 'number') return 'number';
    if (normalized === 'boolean') return 'boolean';
    if (normalized.endsWith('[]') || normalized.startsWith('array<')) return 'array';
    return 'unknown';
  }
}
