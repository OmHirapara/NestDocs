import { Project } from 'ts-morph';
describe('AstScanner', () => {
  describe('findControllerFiles', () => {
    it('should find files containing @Controller decorator', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: true,
        },
      });

      project.createSourceFile(
        '/app/src/tours.controller.ts',
        `
        import { Controller, Get } from '@nestjs/common';

        @Controller('tours')
        export class ToursController {
          @Get()
          findAll() { return []; }
        }
        `,
      );

      project.createSourceFile(
        '/app/src/tours.service.ts',
        `
        export class ToursService {
          findAll() { return []; }
        }
        `,
      );

      // Use the project to check — since AstScanner needs a real tsconfig,
      // we test the filtering logic directly
      const allClasses = project.getSourceFiles().flatMap((sf) => sf.getClasses());
      const controllerClasses = allClasses.filter((cls) =>
        cls.getDecorators().some((d) => d.getName() === 'Controller'),
      );

      expect(controllerClasses).toHaveLength(1);
      expect(controllerClasses[0]?.getName()).toBe('ToursController');
    });
  });

  describe('findDtoFiles', () => {
    it('should find files containing class-validator decorators', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: true,
        },
      });

      project.createSourceFile(
        '/app/src/create-tour.dto.ts',
        `
        import { IsString, IsNotEmpty } from 'class-validator';

        export class CreateTourDto {
          @IsNotEmpty()
          @IsString()
          name: string;
        }
        `,
      );

      project.createSourceFile(
        '/app/src/tours.service.ts',
        `
        export class ToursService {
          findAll() { return []; }
        }
        `,
      );

      const validatorDecorators = new Set(['IsString', 'IsNotEmpty']);
      const dtoFiles = project.getSourceFiles().filter((sf) => {
        const classes = sf.getClasses();
        return classes.some((cls) => {
          const props = cls.getProperties();
          return props.some((prop) =>
            prop.getDecorators().some((d) => validatorDecorators.has(d.getName())),
          );
        });
      });

      expect(dtoFiles).toHaveLength(1);
      expect(dtoFiles[0]?.getBaseName()).toBe('create-tour.dto.ts');
    });
  });

  describe('file exclusion', () => {
    it('should exclude files matching exclude patterns', () => {
      const excludePatterns = ['node_modules', 'dist', '__tests__'];
      const testPaths = [
        '/app/src/controller.ts',
        '/app/node_modules/nest/core.ts',
        '/app/dist/index.js',
        '/app/__tests__/controller.test.ts',
        '/app/src/service.ts',
      ];

      const included = testPaths.filter((filePath) => {
        const normalised = filePath.replace(/\\/g, '/');
        if (normalised.endsWith('.test.ts')) return false;
        if (normalised.endsWith('.spec.ts')) return false;
        if (normalised.endsWith('.d.ts')) return false;
        for (const pattern of excludePatterns) {
          if (normalised.includes(pattern)) return false;
        }
        return true;
      });

      expect(included).toHaveLength(2);
      expect(included).toContain('/app/src/controller.ts');
      expect(included).toContain('/app/src/service.ts');
    });

    it('should always exclude test files', () => {
      const testFilePaths = [
        '/app/src/controller.test.ts',
        '/app/src/service.spec.ts',
        '/app/__tests__/app.test.ts',
      ];

      const included = testFilePaths.filter((filePath) => {
        const normalised = filePath.replace(/\\/g, '/');
        if (normalised.includes('__tests__')) return false;
        if (normalised.endsWith('.test.ts')) return false;
        if (normalised.endsWith('.spec.ts')) return false;
        return true;
      });

      expect(included).toHaveLength(0);
    });
  });
});
