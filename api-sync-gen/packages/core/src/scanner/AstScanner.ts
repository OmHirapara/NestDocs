import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { Logger } from '../logger/Logger.js';
import { AstScannerError } from '../errors.js';

/**
 * Scans a TypeScript project using ts-morph to discover controllers, DTOs, and entities.
 *
 * All file filtering respects the configured `exclude` patterns.
 */
export class AstScanner {
  private readonly project: Project;

  constructor(
    private readonly entry: string,
    private readonly exclude: readonly string[],
    private readonly logger: Logger,
  ) {
    const tsConfigPath = this.findTsConfig();

    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });

    this.logger.debug(`AstScanner initialised with tsconfig: ${tsConfigPath}`);
  }

  /**
   * Walks up from the entry directory to find the nearest `tsconfig.json`.
   * @throws AstScannerError if no tsconfig.json is found
   */
  private findTsConfig(): string {
    let dir = path.resolve(this.entry);

    // If entry points to a file, start from its directory
    if (fs.existsSync(dir) && fs.statSync(dir).isFile()) {
      dir = path.dirname(dir);
    }

    const root = path.parse(dir).root;

    while (dir !== root) {
      const candidate = path.join(dir, 'tsconfig.json');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      dir = path.dirname(dir);
    }

    throw new AstScannerError(
      'Could not find tsconfig.json walking up from entry directory.',
      this.entry,
    );
  }

  /**
   * Returns all source files in the project, excluding files that match
   * the configured `exclude` patterns as well as test files and node_modules.
   */
  public getSourceFiles(): SourceFile[] {
    const allFiles = this.project.getSourceFiles();

    return allFiles.filter((sf) => {
      const filePath = sf.getFilePath();
      return !this.isExcluded(filePath);
    });
  }

  /**
   * Finds all source files containing a `@Controller()` decorator.
   */
  public findControllerFiles(): SourceFile[] {
    const sources = this.getSourceFiles();

    return sources.filter((sf) => {
      const classes = sf.getClasses();
      return classes.some((cls) =>
        cls.getDecorators().some((d) => d.getName() === 'Controller'),
      );
    });
  }

  /**
   * Finds all source files containing DTO classes
   * (i.e. classes with class-validator decorators).
   */
  public findDtoFiles(): SourceFile[] {
    const sources = this.getSourceFiles();

    const classValidatorDecorators = new Set([
      'IsString',
      'IsNumber',
      'IsBoolean',
      'IsOptional',
      'IsNotEmpty',
      'IsEmail',
      'IsEnum',
      'IsArray',
      'IsDate',
      'IsInt',
      'IsPositive',
      'IsNegative',
      'MinLength',
      'MaxLength',
      'Min',
      'Max',
      'ValidateNested',
      'IsUUID',
      'IsUrl',
      'Matches',
    ] as const);

    return sources.filter((sf) => {
      const classes = sf.getClasses();
      return classes.some((cls) => {
        const props = cls.getProperties();
        return props.some((prop) =>
          prop.getDecorators().some((d) => classValidatorDecorators.has(d.getName() as never)),
        );
      });
    });
  }

  /**
   * Finds all source files containing TypeORM `@Entity` or Mongoose `@Schema` decorated classes.
   */
  public findEntityFiles(): SourceFile[] {
    const sources = this.getSourceFiles();

    return sources.filter((sf) => {
      const classes = sf.getClasses();
      return classes.some((cls) =>
        cls.getDecorators().some((d) => {
          const name = d.getName();
          return name === 'Entity' || name === 'Schema';
        }),
      );
    });
  }

  /**
   * Finds the source file containing a class with the given name.
   * Searches all non-excluded source files in the project.
   * @param className - The name of the class to find
   * @returns The SourceFile containing the class, or undefined if not found
   */
  public findClassSourceFile(className: string): SourceFile | undefined {
    const sources = this.getSourceFiles();

    return sources.find((sf) => {
      const classes = sf.getClasses();
      return classes.some((cls) => cls.getName() === className);
    });
  }

  /**
   * Checks whether a file path should be excluded based on the exclude patterns,
   * and always excludes node_modules, test files, and spec files.
   */
  private isExcluded(filePath: string): boolean {
    const normalised = filePath.replace(/\\/g, '/');

    // Always exclude
    if (normalised.includes('node_modules')) return true;
    if (normalised.includes('__tests__')) return true;
    if (normalised.endsWith('.test.ts')) return true;
    if (normalised.endsWith('.spec.ts')) return true;
    if (normalised.endsWith('.d.ts')) return true;

    for (const pattern of this.exclude) {
      if (normalised.includes(pattern)) {
        return true;
      }
    }

    return false;
  }
}
