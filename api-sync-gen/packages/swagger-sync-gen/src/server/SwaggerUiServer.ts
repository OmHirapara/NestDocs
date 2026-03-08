import express from 'express';
import swaggerUi from 'swagger-ui-express';
import type { OpenAPIV3 } from 'openapi-types';
import type { Logger } from '@company/api-sync-core';
import type { Server } from 'node:http';

/**
 * Serves the Swagger UI for browsing the generated OpenAPI spec.
 * Supports hot-reloading in watch mode.
 */
export class SwaggerUiServer {
  private readonly app: express.Application;
  private server: Server | null = null;

  constructor(private readonly logger: Logger) {
    this.app = express();
  }

  /**
   * Starts the Swagger UI development server.
   * @param spec - The OpenAPI document to serve
   * @param port - Port to listen on
   * @param path - URL path to serve the UI at
   */
  public start(spec: OpenAPIV3.Document, port: number, path: string): void {
    this.app.use(path, swaggerUi.serve, swaggerUi.setup(spec as unknown as Record<string, unknown>));

    this.server = this.app.listen(port, () => {
      this.logger.info(`Swagger UI running at http://localhost:${String(port)}${path}`);
    });
  }

  /**
   * Updates the served spec without restarting the server (for watch mode).
   * @param spec - The updated OpenAPI document
   * @param path - URL path where the UI is served
   */
  public updateSpec(spec: OpenAPIV3.Document, path: string): void {
    this.app.use(path, swaggerUi.serve, swaggerUi.setup(spec as unknown as Record<string, unknown>));
    this.logger.info('Swagger UI spec updated');
  }

  /**
   * Stops the Swagger UI server.
   */
  public stop(): void {
    this.server?.close();
    this.server = null;
  }
}
