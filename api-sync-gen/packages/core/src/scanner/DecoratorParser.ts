import type { SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { Logger } from '../logger/Logger.js';
import type {
  ControllerDefinition,
  RouteDefinition,
  HttpMethod,
  ParameterDefinition,
  ParameterLocation,
} from '../types/endpoint.types.js';

/**
 * Map of NestJS decorator names to their HTTP methods.
 */
const HTTP_METHOD_DECORATORS: Record<string, HttpMethod> = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
} as const;

/**
 * Map of NestJS parameter decorators to their location.
 */
const PARAM_DECORATORS: Record<string, ParameterLocation> = {
  Param: 'path',
  Query: 'query',
  Headers: 'header',
  Body: 'body',
} as const;

/**
 * Default HTTP status codes by method.
 */
const DEFAULT_STATUS_CODES: Record<HttpMethod, number> = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 200,
} as const;

/**
 * Parses NestJS decorators from source files to extract controller and route definitions.
 */
export class DecoratorParser {
  constructor(
    private readonly logger: Logger,
    private readonly globalPrefix: string = '',
  ) {}

  /**
   * Parses all controllers from a source file.
   * @param sourceFile - The ts-morph SourceFile to parse
   * @returns Array of ControllerDefinitions found in the file
   */
  public parseControllers(sourceFile: SourceFile): ControllerDefinition[] {
    const controllers: ControllerDefinition[] = [];
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      const controllerDecorator = cls.getDecorator('Controller');
      if (!controllerDecorator) {
        continue;
      }

      const prefix = this.extractDecoratorStringArg(controllerDecorator) ?? '';
      const controllerName = cls.getName() ?? 'UnnamedController';
      const filePath = sourceFile.getFilePath();

      this.logger.debug(`Parsing controller: ${controllerName} with prefix "${prefix}"`);

      const routes = this.parseRoutes(cls, prefix, controllerName);

      controllers.push({
        name: controllerName,
        prefix,
        filePath,
        routes,
      });
    }

    return controllers;
  }

  /**
   * Parses all route methods from a controller class.
   */
  private parseRoutes(
    cls: ReturnType<SourceFile['getClasses']>[number],
    controllerPrefix: string,
    controllerName: string,
  ): RouteDefinition[] {
    const routes: RouteDefinition[] = [];
    const methods = cls.getMethods();

    for (const method of methods) {
      const decorators = method.getDecorators();

      for (const decorator of decorators) {
        const decoratorName = decorator.getName();
        const httpMethod = HTTP_METHOD_DECORATORS[decoratorName];

        if (!httpMethod) {
          continue;
        }

        const routePath = this.extractDecoratorStringArg(decorator) ?? '';
        const normalizedPrefix = controllerPrefix.replace(/^\/|\/$/g, '');
        const normalizedPath = routePath.replace(/^\/|\/$/g, '');

        let fullPath: string;
        if (normalizedPrefix && normalizedPath) {
          fullPath = `/${normalizedPrefix}/${normalizedPath}`;
        } else if (normalizedPrefix) {
          fullPath = `/${normalizedPrefix}`;
        } else if (normalizedPath) {
          fullPath = `/${normalizedPath}`;
        } else {
          fullPath = '/';
        }

        if (this.globalPrefix) {
          const cleanGlobalPrefix = this.globalPrefix.replace(/^\/|\/$/g, '');
          fullPath = fullPath === '/' ? `/${cleanGlobalPrefix}` : `/${cleanGlobalPrefix}${fullPath}`;
        }

        const parameters = this.parseParameters(method);
        const bodyType = this.extractBodyType(method);
        const returnType = this.extractReturnType(method);
        const expectedStatus = this.extractHttpCode(method) ?? DEFAULT_STATUS_CODES[httpMethod] ?? 200;
        const isAuthenticated = this.hasGuard(method) || this.hasGuard(cls);
        const tags = this.extractApiTags(cls);
        const { summary, description } = this.extractApiOperation(method);

        const route: RouteDefinition = {
          method: httpMethod,
          path: routePath ? `/${normalizedPath}` : '/',
          fullPath,
          controllerName,
          methodName: method.getName(),
          parameters,
          expectedStatus,
          isAuthenticated,
          tags,
          ...(bodyType !== undefined ? { bodyType } : {}),
          ...(returnType !== undefined ? { returnType } : {}),
          ...(summary !== undefined ? { summary } : {}),
          ...(description !== undefined ? { description } : {}),
        };

        routes.push(route);
      }
    }

    return routes;
  }

  /**
   * Extracts parameters from a method's parameter decorators.
   */
  private parseParameters(
    method: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getMethods']>[number],
  ): ParameterDefinition[] {
    const params: ParameterDefinition[] = [];
    const methodParams = method.getParameters();

    for (const param of methodParams) {
      const decorators = param.getDecorators();

      for (const decorator of decorators) {
        const decoratorName = decorator.getName();
        const location = PARAM_DECORATORS[decoratorName];

        if (!location) {
          continue;
        }

        // Skip @Body — it's captured separately as bodyType
        if (location === 'body') {
          continue;
        }

        const paramName = this.extractDecoratorStringArg(decorator) ?? param.getName();
        const paramType = param.getType().getText() ?? 'string';
        const isOptional = param.hasQuestionToken() || param.hasInitializer();

        params.push({
          name: paramName,
          location,
          type: paramType,
          required: !isOptional,
        });
      }
    }

    return params;
  }

  /**
   * Extracts the body DTO type name from a method's @Body parameter.
   */
  private extractBodyType(
    method: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getMethods']>[number],
  ): string | undefined {
    const methodParams = method.getParameters();

    for (const param of methodParams) {
      const bodyDecorator = param.getDecorator('Body');
      if (bodyDecorator) {
        const typeNode = param.getTypeNode();
        if (typeNode) {
          return typeNode.getText();
        }
        // Fall back to inferred type
        const inferredType = param.getType().getText();
        // Strip import() wrapping if present
        const simpleMatch = /(\w+)$/.exec(inferredType);
        return simpleMatch?.[1] ?? inferredType;
      }
    }

    return undefined;
  }

  /**
   * Extracts the return type of a method as a string.
   */
  private extractReturnType(
    method: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getMethods']>[number],
  ): string | undefined {
    const returnTypeNode = method.getReturnTypeNode();
    if (returnTypeNode) {
      return returnTypeNode.getText();
    }

    // Fall back to inferred return type
    const returnType = method.getReturnType().getText();
    if (returnType && returnType !== 'void') {
      return returnType;
    }

    return undefined;
  }

  /**
   * Extracts the status code from @HttpCode(NNN).
   */
  private extractHttpCode(
    method: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getMethods']>[number],
  ): number | undefined {
    const httpCodeDecorator = method.getDecorator('HttpCode');
    if (!httpCodeDecorator) {
      return undefined;
    }

    const args = httpCodeDecorator.getArguments();
    if (args.length === 0) {
      return undefined;
    }

    const firstArg = args[0];
    if (firstArg) {
      const parsed = parseInt(firstArg.getText(), 10);
      return isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
  }

  /**
   * Checks whether a method or class has a @UseGuards() decorator.
   */
  private hasGuard(
    node: { getDecorator(name: string): { getName(): string } | undefined },
  ): boolean {
    return node.getDecorator('UseGuards') !== undefined;
  }

  /**
   * Extracts @ApiTags from a controller class.
   */
  private extractApiTags(
    cls: ReturnType<SourceFile['getClasses']>[number],
  ): string[] {
    const apiTagsDecorator = cls.getDecorator('ApiTags');
    if (!apiTagsDecorator) {
      return [];
    }

    return apiTagsDecorator.getArguments().map((arg) => {
      const text = arg.getText();
      // Remove quotes
      return text.replace(/^['"]|['"]$/g, '');
    });
  }

  /**
   * Extracts @ApiOperation summary and description from a method.
   */
  private extractApiOperation(
    method: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getMethods']>[number],
  ): { summary?: string; description?: string } {
    const apiOpDecorator = method.getDecorator('ApiOperation');
    if (!apiOpDecorator) {
      return {};
    }

    const args = apiOpDecorator.getArguments();
    if (args.length === 0) {
      return {};
    }

    const firstArg = args[0];
    if (!firstArg) {
      return {};
    }

    // The argument is expected to be an object literal
    if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const obj = firstArg.asKind(SyntaxKind.ObjectLiteralExpression);
      if (!obj) {
        return {};
      }

      const result: { summary?: string; description?: string } = {};

      for (const prop of obj.getProperties()) {
        if (prop.getKind() === SyntaxKind.PropertyAssignment) {
          const propAssignment = prop.asKind(SyntaxKind.PropertyAssignment);
          if (!propAssignment) continue;

          const propName = propAssignment.getName();
          const value = propAssignment.getInitializer()?.getText().replace(/^['"]|['"]$/g, '');

          if (propName === 'summary' && value !== undefined) {
            result.summary = value;
          } else if (propName === 'description' && value !== undefined) {
            result.description = value;
          }
        }
      }

      return result;
    }

    return {};
  }

  /**
   * Extracts the first string argument from a decorator, e.g. @Controller('tours') → 'tours'.
   */
  private extractDecoratorStringArg(
    decorator: ReturnType<ReturnType<SourceFile['getClasses']>[number]['getDecorators']>[number],
  ): string | undefined {
    const args = decorator.getArguments();
    if (args.length === 0) {
      return undefined;
    }

    const firstArg = args[0];
    if (!firstArg) {
      return undefined;
    }

    const text = firstArg.getText();
    // Remove surrounding quotes
    const unquoted = text.replace(/^['"`]|['"`]$/g, '');
    return unquoted === text ? undefined : unquoted;
  }
}
