import { Project } from 'ts-morph';
import * as path from 'node:path';
import { DtoParser } from '../../src/scanner/DtoParser';
import { createLogger } from '../../src/logger/Logger';

const logger = createLogger('error');
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

function createProjectWithFixture(fixtureName: string): Project {
  const project = new Project({
    useInMemoryFileSystem: false,
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      strict: true,
    },
  });

  project.addSourceFilesAtPaths(path.join(fixturesDir, fixtureName));
  return project;
}

describe('DtoParser', () => {
  let parser: DtoParser;

  beforeAll(() => {
    parser = new DtoParser(logger);
  });

  describe('parseDtos', () => {
    it('should extract CreateTourDto with 5 properties', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);

      expect(schemas).toHaveLength(1);
      expect(schemas[0]?.name).toBe('CreateTourDto');
      expect(schemas[0]?.properties).toHaveLength(5);
    });

    it('should parse "name" as string, required, minLength 3, maxLength 100', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);
      const nameProperty = schemas[0]?.properties.find((p) => p.name === 'name');

      expect(nameProperty).toBeDefined();
      expect(nameProperty?.type).toBe('string');
      expect(nameProperty?.required).toBe(true);
      expect(nameProperty?.minLength).toBe(3);
      expect(nameProperty?.maxLength).toBe(100);
    });

    it('should parse "price" as number, required, min 0, max 999999', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);
      const priceProperty = schemas[0]?.properties.find((p) => p.name === 'price');

      expect(priceProperty).toBeDefined();
      expect(priceProperty?.type).toBe('number');
      expect(priceProperty?.required).toBe(true);
      expect(priceProperty?.min).toBe(0);
      expect(priceProperty?.max).toBe(999999);
    });

    it('should parse "duration" as number, required, min 1', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);
      const durationProperty = schemas[0]?.properties.find((p) => p.name === 'duration');

      expect(durationProperty).toBeDefined();
      expect(durationProperty?.type).toBe('number');
      expect(durationProperty?.required).toBe(true);
      expect(durationProperty?.min).toBe(1);
    });

    it('should parse "category" as enum with 3 values', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);
      const categoryProperty = schemas[0]?.properties.find((p) => p.name === 'category');

      expect(categoryProperty).toBeDefined();
      expect(categoryProperty?.type).toBe('enum');
      expect(categoryProperty?.enumValues).toBeDefined();
      expect(categoryProperty?.enumValues).toHaveLength(3);
      expect(categoryProperty?.enumValues).toContain('adventure');
      expect(categoryProperty?.enumValues).toContain('cultural');
      expect(categoryProperty?.enumValues).toContain('wildlife');
    });

    it('should parse "description" as string, NOT required (IsOptional)', () => {
      const project = createProjectWithFixture('sample-dto.ts');
      const sourceFile = project.getSourceFiles()[0];
      if (!sourceFile) throw new Error('Source file not found');
      const schemas = parser.parseDtos(sourceFile);
      const descProperty = schemas[0]?.properties.find((p) => p.name === 'description');

      expect(descProperty).toBeDefined();
      expect(descProperty?.type).toBe('string');
      expect(descProperty?.required).toBe(false);
    });
  });
});
