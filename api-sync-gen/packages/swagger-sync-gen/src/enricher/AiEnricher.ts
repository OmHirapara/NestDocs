import type { EndpointMap, ControllerDefinition, SchemaMap, DtoSchema, AiProvider, Logger } from '@company/api-sync-core';

/**
 * Enriches endpoints and schemas with AI-generated descriptions and examples.
 * Gracefully skips enrichment when no AI provider is configured.
 */
export class AiEnricher {
  constructor(
    private readonly aiProvider: AiProvider | null,
    private readonly logger: Logger,
  ) {}

  /**
   * Enriches all routes in the endpoint map with AI-generated descriptions.
   * @param endpointMap - The scanned endpoint map
   * @returns The enriched endpoint map (or original if AI is disabled)
   */
  public async enrichEndpoints(endpointMap: EndpointMap): Promise<ControllerDefinition[]> {
    if (!this.aiProvider) {
      this.logger.info('AI enrichment disabled — skipping endpoint descriptions');
      return [...endpointMap];
    }

    const totalRoutes = this.countRoutes(endpointMap);
    this.logger.info(`Enriching endpoints with AI descriptions (${String(totalRoutes)} routes)`);

    const enriched: ControllerDefinition[] = [];
    let processed = 0;

    for (const controller of endpointMap) {
      const enrichedRoutes = [];

      for (const route of controller.routes) {
        try {
          const description = await this.aiProvider.describeEndpoint(route);
          enrichedRoutes.push({
            ...route,
            ...(description ? { description } : {}),
          });
        } catch {
          this.logger.warn(`Failed to enrich route: ${route.method} ${route.fullPath}`);
          enrichedRoutes.push({ ...route });
        }

        processed++;
        if (processed % 5 === 0) {
          this.logger.info(`Enriching ${String(processed)}/${String(totalRoutes)}...`);
        }
      }

      enriched.push({
        ...controller,
        routes: enrichedRoutes,
      });
    }

    this.logger.info('AI endpoint enrichment complete');
    return enriched;
  }

  /**
   * Enriches DTO schemas with AI-generated realistic examples.
   * @param schemaMap - The parsed schema map
   * @returns The enriched schema map (or original if AI is disabled)
   */
  public async enrichSchemas(schemaMap: SchemaMap): Promise<SchemaMap> {
    if (!this.aiProvider) {
      this.logger.info('AI enrichment disabled — skipping schema examples');
      return { ...schemaMap };
    }

    const schemaNames = Object.keys(schemaMap);
    this.logger.info(`Enriching ${String(schemaNames.length)} schemas with AI examples`);

    const enriched: SchemaMap = {};

    for (const [name, dto] of Object.entries(schemaMap)) {
      try {
        const exampleValues = await this.aiProvider.generateExample(dto);
        const enrichedProperties = dto.properties.map((prop) => {
          const exampleValue = exampleValues[prop.name];
          if (exampleValue !== undefined) {
            return { ...prop, example: exampleValue };
          }
          return prop;
        });

        const enrichedDto: DtoSchema = {
          ...dto,
          properties: enrichedProperties,
        };

        enriched[name] = enrichedDto;
      } catch {
        this.logger.warn(`Failed to enrich schema: ${name}`);
        enriched[name] = dto;
      }
    }

    this.logger.info('AI schema enrichment complete');
    return enriched;
  }

  /**
   * Counts the total number of routes across all controllers.
   */
  private countRoutes(endpointMap: EndpointMap): number {
    return endpointMap.reduce((sum, ctrl) => sum + ctrl.routes.length, 0);
  }
}
