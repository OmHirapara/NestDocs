import { z } from 'zod';

/**
 * Server definition for OpenAPI.
 */
export interface ServerDefinition {
  readonly url: string;
  readonly description?: string;
}

/**
 * Auth configuration for swagger documentation.
 */
export interface AuthConfig {
  readonly type: 'bearer' | 'apiKey' | 'both' | 'none';
  readonly apiKeyHeader?: string;
}

/**
 * Swagger UI configuration.
 */
export interface SwaggerUiConfig {
  readonly enabled?: boolean;
  readonly port?: number;
  readonly path?: string;
}

/**
 * Swagger documentation configuration.
 */
export interface SwaggerConfig {
  readonly output: string;
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
  readonly servers?: ServerDefinition[];
  readonly auth?: AuthConfig;
  readonly ui?: SwaggerUiConfig;
}

/**
 * Postman environment definition.
 */
export interface PostmanEnvironment {
  readonly baseUrl: string;
  readonly authToken?: string;
}

/**
 * Postman workspace sync configuration.
 */
export interface PostmanWorkspaceConfig {
  readonly apiKey: string;
  readonly workspaceId: string;
  readonly collectionUid?: string;
}

/**
 * Postman test generation configuration.
 */
export interface PostmanTestsConfig {
  readonly generateStatusTests?: boolean;
  readonly generateSchemaTests?: boolean;
  readonly generateResponseTimeTests?: boolean;
  readonly targetCoverage?: number;
}

/**
 * Postman output configuration.
 */
export interface PostmanConfig {
  readonly output: string;
  readonly collectionName?: string;
  readonly environments?: Record<string, PostmanEnvironment>;
  readonly workspace?: PostmanWorkspaceConfig;
  readonly tests?: PostmanTestsConfig;
}

/**
 * AI feature toggles.
 */
export interface AiFeaturesConfig {
  readonly autoDescribeEndpoints?: boolean;
  readonly autoGenerateExamples?: boolean;
  readonly autoGenerateTestScripts?: boolean;
  readonly autoGeneratePreRequest?: boolean;
  readonly inferReturnTypes?: boolean;
}

/**
 * AI rate limiting settings.
 */
export interface AiRateLimitConfig {
  readonly requestsPerMinute?: number;
  readonly retryOnRateLimit?: boolean;
  readonly maxRetries?: number;
}

/**
 * AI provider configuration.
 */
export interface AiConfig {
  readonly enabled?: boolean;
  readonly provider?: 'claude' | 'openai';
  readonly apiKey?: string;
  readonly model?: string;
  readonly features?: AiFeaturesConfig;
  readonly rateLimit?: AiRateLimitConfig;
}

/**
 * Output formatting configuration.
 */
export interface OutputConfig {
  readonly pretty?: boolean;
  readonly overwrite?: boolean;
  readonly backup?: boolean;
}

/**
 * Full user-facing configuration type. All optional fields may have defaults.
 */
export interface ApiSyncConfig {
  readonly entry: string;
  readonly globalPrefix?: string;
  readonly exclude?: string[];
  readonly swagger?: SwaggerConfig;
  readonly postman?: PostmanConfig;
  readonly ai?: AiConfig;
  readonly output?: OutputConfig;
}

/**
 * Resolved configuration with all defaults applied — no optional fields.
 */
export interface ResolvedApiSyncConfig {
  readonly entry: string;
  readonly globalPrefix: string;
  readonly exclude: readonly string[];
  readonly swagger: {
    readonly output: string;
    readonly title: string;
    readonly description: string;
    readonly version: string;
    readonly servers: readonly ServerDefinition[];
    readonly auth: {
      readonly type: 'bearer' | 'apiKey' | 'both' | 'none';
      readonly apiKeyHeader: string;
    };
    readonly ui: {
      readonly enabled: boolean;
      readonly port: number;
      readonly path: string;
    };
  };
  readonly postman: {
    readonly output: string;
    readonly collectionName: string;
    readonly environments: Record<string, PostmanEnvironment>;
    readonly workspace: {
      readonly apiKey: string;
      readonly workspaceId: string;
      readonly collectionUid: string;
    };
    readonly tests: {
      readonly generateStatusTests: boolean;
      readonly generateSchemaTests: boolean;
      readonly generateResponseTimeTests: boolean;
      readonly targetCoverage: number;
    };
  };
  readonly ai: {
    readonly enabled: boolean;
    readonly provider: 'claude' | 'openai';
    readonly apiKey: string;
    readonly model: string;
    readonly features: {
      readonly autoDescribeEndpoints: boolean;
      readonly autoGenerateExamples: boolean;
      readonly autoGenerateTestScripts: boolean;
      readonly autoGeneratePreRequest: boolean;
      readonly inferReturnTypes: boolean;
    };
    readonly rateLimit: {
      readonly requestsPerMinute: number;
      readonly retryOnRateLimit: boolean;
      readonly maxRetries: number;
    };
  };
  readonly output: {
    readonly pretty: boolean;
    readonly overwrite: boolean;
    readonly backup: boolean;
  };
}

/**
 * Zod schema for validating the ApiSyncConfig input.
 */
export const apiSyncConfigSchema = z.object({
  entry: z.string().min(1, 'entry path is required'),
  globalPrefix: z.string().optional(),
  exclude: z.array(z.string()).optional(),
  swagger: z
    .object({
      output: z.string().min(1, 'swagger.output is required when swagger is enabled'),
      title: z.string().optional(),
      description: z.string().optional(),
      version: z.string().optional(),
      servers: z
        .array(
          z.object({
            url: z.string(),
            description: z.string().optional(),
          }),
        )
        .optional(),
      auth: z
        .object({
          type: z.enum(['bearer', 'apiKey', 'both', 'none']),
          apiKeyHeader: z.string().optional(),
        })
        .optional(),
      ui: z
        .object({
          enabled: z.boolean().optional(),
          port: z.number().int().positive().optional(),
          path: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  postman: z
    .object({
      output: z.string().min(1, 'postman.output is required when postman is enabled'),
      collectionName: z.string().optional(),
      environments: z.record(
        z.object({
          baseUrl: z.string(),
          authToken: z.string().optional(),
        }),
      ).optional(),
      workspace: z
        .object({
          apiKey: z.string(),
          workspaceId: z.string(),
          collectionUid: z.string().optional(),
        })
        .optional(),
      tests: z
        .object({
          generateStatusTests: z.boolean().optional(),
          generateSchemaTests: z.boolean().optional(),
          generateResponseTimeTests: z.boolean().optional(),
          targetCoverage: z.number().min(0).max(100).optional(),
        })
        .optional(),
    })
    .optional(),
  ai: z
    .object({
      enabled: z.boolean().optional(),
      provider: z.enum(['claude', 'openai']).optional(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
      features: z
        .object({
          autoDescribeEndpoints: z.boolean().optional(),
          autoGenerateExamples: z.boolean().optional(),
          autoGenerateTestScripts: z.boolean().optional(),
          autoGeneratePreRequest: z.boolean().optional(),
          inferReturnTypes: z.boolean().optional(),
        })
        .optional(),
      rateLimit: z
        .object({
          requestsPerMinute: z.number().int().positive().optional(),
          retryOnRateLimit: z.boolean().optional(),
          maxRetries: z.number().int().nonnegative().optional(),
        })
        .optional(),
    })
    .optional(),
  output: z
    .object({
      pretty: z.boolean().optional(),
      overwrite: z.boolean().optional(),
      backup: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Resolves a validated ApiSyncConfig into a ResolvedApiSyncConfig by applying all defaults.
 * @param config - The validated user-supplied config
 * @returns A fully-resolved config with no optional fields
 */
export function resolveConfig(config: ApiSyncConfig): ResolvedApiSyncConfig {
  const aiApiKey = config.ai?.apiKey ?? '';
  const aiEnabled = config.ai?.enabled ?? (aiApiKey.length > 0);

  return {
    entry: config.entry,
    globalPrefix: config.globalPrefix ?? '',
    exclude: config.exclude ?? ['node_modules', 'dist', 'test', '__tests__'],
    swagger: {
      output: config.swagger?.output ?? './docs/swagger.json',
      title: config.swagger?.title ?? 'API Documentation',
      description: config.swagger?.description ?? '',
      version: config.swagger?.version ?? '1.0.0',
      servers: config.swagger?.servers ?? [],
      auth: {
        type: config.swagger?.auth?.type ?? 'bearer',
        apiKeyHeader: config.swagger?.auth?.apiKeyHeader ?? 'X-API-Key',
      },
      ui: {
        enabled: config.swagger?.ui?.enabled ?? false,
        port: config.swagger?.ui?.port ?? 3001,
        path: config.swagger?.ui?.path ?? '/docs',
      },
    },
    postman: {
      output: config.postman?.output ?? './docs/collection.json',
      collectionName: config.postman?.collectionName ?? 'API Collection',
      environments: config.postman?.environments ?? {},
      workspace: {
        apiKey: config.postman?.workspace?.apiKey ?? '',
        workspaceId: config.postman?.workspace?.workspaceId ?? '',
        collectionUid: config.postman?.workspace?.collectionUid ?? '',
      },
      tests: {
        generateStatusTests: config.postman?.tests?.generateStatusTests ?? true,
        generateSchemaTests: config.postman?.tests?.generateSchemaTests ?? true,
        generateResponseTimeTests: config.postman?.tests?.generateResponseTimeTests ?? true,
        targetCoverage: config.postman?.tests?.targetCoverage ?? 80,
      },
    },
    ai: {
      enabled: aiEnabled,
      provider: config.ai?.provider ?? 'claude',
      apiKey: aiApiKey,
      model: config.ai?.model ?? (config.ai?.provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620'),
      features: {
        autoDescribeEndpoints: config.ai?.features?.autoDescribeEndpoints ?? true,
        autoGenerateExamples: config.ai?.features?.autoGenerateExamples ?? true,
        autoGenerateTestScripts: config.ai?.features?.autoGenerateTestScripts ?? true,
        autoGeneratePreRequest: config.ai?.features?.autoGeneratePreRequest ?? true,
        inferReturnTypes: config.ai?.features?.inferReturnTypes ?? true,
      },
      rateLimit: {
        requestsPerMinute: config.ai?.rateLimit?.requestsPerMinute ?? 30,
        retryOnRateLimit: config.ai?.rateLimit?.retryOnRateLimit ?? true,
        maxRetries: config.ai?.rateLimit?.maxRetries ?? 3,
      },
    },
    output: {
      pretty: config.output?.pretty ?? true,
      overwrite: config.output?.overwrite ?? true,
      backup: config.output?.backup ?? true,
    },
  };
}
