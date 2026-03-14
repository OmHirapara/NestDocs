import { Project } from 'ts-morph';
import * as path from 'node:path';
import { DecoratorParser } from '../../src/scanner/DecoratorParser';
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

describe('DecoratorParser', () => {
  let parser: DecoratorParser;

  beforeAll(() => {
    parser = new DecoratorParser(logger);
  });

  describe('parseControllers', () => {
    it('should extract controller prefix "tours"', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      expect(sourceFile).toBeDefined();
      const controllers = parser.parseControllers(sourceFile!);

      expect(controllers).toHaveLength(1);
      expect(controllers[0]?.prefix).toBe('tours');
      expect(controllers[0]?.name).toBe('ToursController');
    });

    it('should extract 5 routes', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const routes = controllers[0]?.routes;

      expect(routes).toHaveLength(5);
    });

    it('should extract correct HTTP methods', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const routes = controllers[0]?.routes ?? [];

      const methods = routes.map((r) => r.method);
      expect(methods).toEqual(['GET', 'GET', 'POST', 'PUT', 'DELETE']);
    });

    it('should set POST route expectedStatus to 201 from @HttpCode', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const postRoute = controllers[0]?.routes.find((r) => r.method === 'POST');

      expect(postRoute).toBeDefined();
      expect(postRoute?.expectedStatus).toBe(201);
    });

    it('should set DELETE route expectedStatus to 204 from @HttpCode', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const deleteRoute = controllers[0]?.routes.find((r) => r.method === 'DELETE');

      expect(deleteRoute).toBeDefined();
      expect(deleteRoute?.expectedStatus).toBe(204);
    });

    it('should mark POST route as authenticated from @UseGuards', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const postRoute = controllers[0]?.routes.find((r) => r.method === 'POST');

      expect(postRoute?.isAuthenticated).toBe(true);
    });

    it('should extract query params "page" and "limit" for GET /', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const findAllRoute = controllers[0]?.routes.find(
        (r) => r.method === 'GET' && r.methodName === 'findAll',
      );

      expect(findAllRoute).toBeDefined();
      expect(findAllRoute?.parameters).toHaveLength(2);

      const pageParam = findAllRoute?.parameters.find((p) => p.name === 'page');
      expect(pageParam).toBeDefined();
      expect(pageParam?.location).toBe('query');
      expect(pageParam?.required).toBe(false);

      const limitParam = findAllRoute?.parameters.find((p) => p.name === 'limit');
      expect(limitParam).toBeDefined();
      expect(limitParam?.location).toBe('query');
      expect(limitParam?.required).toBe(false);
    });

    it('should extract body type "CreateTourDto" for POST route', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const postRoute = controllers[0]?.routes.find((r) => r.method === 'POST');

      expect(postRoute?.bodyType).toBe('CreateTourDto');
    });

    it('should build correct full paths', () => {
      const project = createProjectWithFixture('sample-controller.ts');
      const sourceFile = project.getSourceFiles()[0];
      const controllers = parser.parseControllers(sourceFile!);
      const routes = controllers[0]?.routes ?? [];

      const fullPaths = routes.map((r) => r.fullPath);
      expect(fullPaths).toContain('/tours');
      expect(fullPaths).toContain('/tours/:id');
    });
  });
});
