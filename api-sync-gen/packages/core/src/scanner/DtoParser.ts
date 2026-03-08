import type { SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { Logger } from '../logger/Logger.js';
import type { DtoSchema, PropertyDefinition, PropertyType } from '../types/schema.types.js';
import { DtoParseError } from '../errors.js';

/**
 * Maps class-validator decorator names to PropertyType values.
 */
const VALIDATOR_TYPE_MAP: Record<string, PropertyType> = {
  IsString: 'string',
  IsNumber: 'number',
  IsInt: 'number',
  IsBoolean: 'boolean',
  IsEmail: 'string',
  IsEnum: 'enum',
  IsArray: 'array',
  IsDate: 'string',
  IsUUID: 'string',
  IsUrl: 'string',
} as const;

/**
 * Parses DTO classes from source files, extracting property definitions
 * from class-validator decorators and TypeScript type information.
 */
export class DtoParser {
  constructor(private readonly logger: Logger) {}

  /**
   * Parses all DTO classes in a source file.
   * @param sourceFile - The ts-morph SourceFile containing DTO classes
   * @returns Array of DtoSchema objects
   */
  public parseDtos(sourceFile: SourceFile): DtoSchema[] {
    const schemas: DtoSchema[] = [];
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      const className = cls.getName();
      if (!className) {
        continue;
      }

      try {
        const properties = this.parseProperties(cls);

        if (properties.length === 0) {
          continue;
        }

        // Try to extract description from @ApiProperty on the class or JSDoc
        const jsDoc = cls.getJsDocs();
        const description = jsDoc.length > 0 ? jsDoc[0]?.getDescription().trim() : undefined;

        const schema: DtoSchema = {
          name: className,
          filePath: sourceFile.getFilePath(),
          properties,
          ...(description !== undefined ? { description } : {}),
        };

        schemas.push(schema);

        this.logger.debug(`Parsed DTO: ${className} with ${String(properties.length)} properties`);
      } catch (error: unknown) {
        throw new DtoParseError(
          `Failed to parse DTO class: ${className}`,
          className,
          error,
        );
      }
    }

    return schemas;
  }

  /**
   * Parses all properties from a class, extracting types and constraints
   * from class-validator decorators.
   */
  private parseProperties(
    cls: ReturnType<SourceFile['getClasses']>[number],
  ): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const classProperties = cls.getProperties();

    for (const prop of classProperties) {
      const name = prop.getName();
      const decorators = prop.getDecorators();

      let type: PropertyType = 'unknown';
      let required = true;
      let description: string | undefined;
      let example: unknown;
      let enumValues: string[] | undefined;
      let arrayItemType: PropertyType | undefined;
      let nestedSchema: string | undefined;
      let minLength: number | undefined;
      let maxLength: number | undefined;
      let min: number | undefined;
      let max: number | undefined;
      let isEmail = false;

      for (const decorator of decorators) {
        const decoratorName = decorator.getName();
        const args = decorator.getArguments();

        // Type mapping from class-validator
        const mappedType = VALIDATOR_TYPE_MAP[decoratorName];
        if (mappedType !== undefined) {
          type = mappedType;
        }

        switch (decoratorName) {
          case 'IsOptional':
            required = false;
            break;

          case 'IsNotEmpty':
            required = true;
            break;

          case 'IsEmail':
            isEmail = true;
            type = 'string';
            break;

          case 'MinLength':
            if (args[0]) {
              minLength = this.parseNumberArg(args[0]);
            }
            break;

          case 'MaxLength':
            if (args[0]) {
              maxLength = this.parseNumberArg(args[0]);
            }
            break;

          case 'Min':
            if (args[0]) {
              min = this.parseNumberArg(args[0]);
            }
            break;

          case 'Max':
            if (args[0]) {
              max = this.parseNumberArg(args[0]);
            }
            break;

          case 'IsEnum':
            type = 'enum';
            if (args[0]) {
              enumValues = this.extractEnumValues(args[0], cls.getSourceFile());
            }
            break;

          case 'IsArray':
            type = 'array';
            break;

          case 'ValidateNested':
            type = 'object';
            break;

          case 'Type': {
            // Extract the nested schema name from @Type(() => SubDto)
            if (args[0]) {
              const typeText = args[0].getText();
              const match = /=>\s*(\w+)/.exec(typeText);
              if (match?.[1]) {
                nestedSchema = match[1];
              }
            }
            break;
          }

          case 'ApiProperty': {
            // Extract description and example from @ApiProperty({ description, example })
            if (args[0] && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
              const obj = args[0].asKind(SyntaxKind.ObjectLiteralExpression);
              if (obj) {
                for (const objProp of obj.getProperties()) {
                  if (objProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const pa = objProp.asKind(SyntaxKind.PropertyAssignment);
                    if (!pa) continue;
                    const propName = pa.getName();
                    const propValue = pa.getInitializer()?.getText();
                    if (propName === 'description' && propValue) {
                      description = propValue.replace(/^['"]|['"]$/g, '');
                    } else if (propName === 'example' && propValue) {
                      example = propValue.replace(/^['"]|['"]$/g, '');
                    }
                  }
                }
              }
            }
            break;
          }

          default:
            break;
        }
      }

      // If no type was resolved from decorators, try to infer from TypeScript type
      if (type === 'unknown') {
        type = this.inferTypeFromTypeScript(prop);
      }

      // Determine array item type from TypeScript type if it's an array
      if (type === 'array' && !arrayItemType) {
        arrayItemType = this.inferArrayItemType(prop);
      }

      const propDef: PropertyDefinition = {
        name,
        type,
        required,
        isEmail,
        ...(description !== undefined ? { description } : {}),
        ...(example !== undefined ? { example } : {}),
        ...(enumValues !== undefined ? { enumValues } : {}),
        ...(arrayItemType !== undefined ? { arrayItemType } : {}),
        ...(nestedSchema !== undefined ? { nestedSchema } : {}),
        ...(minLength !== undefined ? { minLength } : {}),
        ...(maxLength !== undefined ? { maxLength } : {}),
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
      };

      properties.push(propDef);
    }

    return properties;
  }

  /**
   * Infers the PropertyType from a TypeScript type annotation.
   */
  private inferTypeFromTypeScript(
    prop: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getProperties']>[number],
  ): PropertyType {
    const typeNode = prop.getTypeNode();
    if (!typeNode) {
      const tsType = prop.getType().getText();
      return this.mapTsTypeToPropertyType(tsType);
    }

    const typeText = typeNode.getText();
    return this.mapTsTypeToPropertyType(typeText);
  }

  /**
   * Maps a TypeScript type string to a PropertyType.
   */
  private mapTsTypeToPropertyType(tsType: string): PropertyType {
    const normalized = tsType.toLowerCase().trim();

    if (normalized === 'string') return 'string';
    if (normalized === 'number') return 'number';
    if (normalized === 'boolean') return 'boolean';
    if (normalized.endsWith('[]') || normalized.startsWith('array<')) return 'array';

    return 'unknown';
  }

  /**
   * Infers the item type of an array from the TypeScript type annotation.
   */
  private inferArrayItemType(
    prop: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getProperties']>[number],
  ): PropertyType | undefined {
    const tsType = prop.getType().getText();

    const arrayMatch = /^(\w+)\[\]$/.exec(tsType);
    if (arrayMatch?.[1]) {
      return this.mapTsTypeToPropertyType(arrayMatch[1]);
    }

    const genericMatch = /^Array<(\w+)>$/.exec(tsType);
    if (genericMatch?.[1]) {
      return this.mapTsTypeToPropertyType(genericMatch[1]);
    }

    return undefined;
  }

  /**
   * Extracts enum member values from an enum reference in a decorator argument.
   */
  private extractEnumValues(
    arg: ReturnType<ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number]['getArguments']>[number],
    sourceFile: SourceFile,
  ): string[] {
    const enumName = arg.getText();

    // Try to find the enum in the same file
    const enumDecl = sourceFile.getEnum(enumName);
    if (enumDecl) {
      return enumDecl.getMembers().map((m) => {
        const value = m.getValue();
        return value !== undefined ? String(value) : m.getName();
      });
    }

    // Try to resolve from imports
    const importDecls = sourceFile.getImportDeclarations();
    for (const imp of importDecls) {
      const namedImports = imp.getNamedImports();
      const matchingImport = namedImports.find((n) => n.getName() === enumName);
      if (matchingImport) {
        const symbol = matchingImport.getNameNode().getSymbol();
        if (symbol) {
          const declarations = symbol.getDeclarations();
          for (const decl of declarations) {
            if (decl.getKind() === SyntaxKind.EnumDeclaration) {
              const enumNode = decl.asKind(SyntaxKind.EnumDeclaration);
              if (enumNode) {
                return enumNode.getMembers().map((m) => {
                  const value = m.getValue();
                  return value !== undefined ? String(value) : m.getName();
                });
              }
            }
          }
        }
      }
    }

    this.logger.warn(`Could not resolve enum values for: ${enumName}`);
    return [];
  }

  /**
   * Parses the first argument of a decorator as a number.
   */
  private parseNumberArg(
    arg: ReturnType<ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number]['getArguments']>[number],
  ): number | undefined {
    const text = arg.getText();
    const num = parseFloat(text);
    return isNaN(num) ? undefined : num;
  }
}
