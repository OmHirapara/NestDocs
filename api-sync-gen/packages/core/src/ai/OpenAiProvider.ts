import OpenAI from 'openai';
import type { AiProvider } from './AiProvider.js';
import type { RouteDefinition } from '../types/endpoint.types.js';
import type { DtoSchema } from '../types/schema.types.js';
import { AiProviderError } from '../errors.js';

/**
 * Default model for OpenAI API calls.
 */
const DEFAULT_MODEL = 'gpt-4o';

/**
 * Default rate limit (requests per minute).
 */
const DEFAULT_RPM = 30;

/**
 * Default max retries on 429 rate limit errors.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * AI provider implementation using OpenAI's API.
 *
 * Uses `response_format: { type: 'json_object' }` for methods that return JSON.
 * Implements the same rate limiting and retry logic as ClaudeProvider.
 */
export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxRequestsPerMinute: number;
  private readonly maxRetries: number;
  private requestTimestamps: number[] = [];

  constructor(
    apiKey: string,
    model?: string,
    maxRequestsPerMinute?: number,
    maxRetries?: number,
  ) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
    this.maxRequestsPerMinute = maxRequestsPerMinute ?? DEFAULT_RPM;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /** @inheritdoc */
  public async describeEndpoint(route: RouteDefinition): Promise<string> {
    const params = route.parameters.map((p) => `${p.name} (${p.location})`).join(', ');
    const prompt = `You are an API documentation expert. Write a concise 1-2 sentence OpenAPI description for this endpoint. Return ONLY the description, no quotes, no explanation. Route: ${route.method} ${route.fullPath}. Method name: ${route.methodName}. Parameters: ${params || 'none'}.`;

    return this.sendMessage(prompt, false);
  }

  /** @inheritdoc */
  public async generateExample(dto: DtoSchema): Promise<Record<string, unknown>> {
    const fields = dto.properties
      .map((p) => `${p.name}: ${p.type}${p.required ? ' (required)' : ' (optional)'}${p.enumValues ? ` [${p.enumValues.join(', ')}]` : ''}`)
      .join(', ');

    const prompt = `Generate a realistic JSON example for this DTO. Return ONLY valid JSON, no markdown, no explanation. Fields: ${fields}`;

    const response = await this.sendMessage(prompt, true);
    return this.parseJson<Record<string, unknown>>(response);
  }

  /** @inheritdoc */
  public async generatePostmanTests(
    route: RouteDefinition,
    schema: Record<string, unknown>,
  ): Promise<string> {
    const prompt = `Write Postman test scripts in JavaScript using pm.test() syntax. Include: status code check (${String(route.expectedStatus)}), response time under 2000ms, JSON schema validation. Return ONLY JavaScript code. Schema: ${JSON.stringify(schema)}`;

    return this.sendMessage(prompt, false);
  }

  /** @inheritdoc */
  public async generatePreRequestScript(route: RouteDefinition): Promise<string> {
    const prompt = `Write a Postman pre-request script in JavaScript. Set Authorization header from pm.environment.get('authToken'). Return ONLY JavaScript code.`;

    return this.sendMessage(prompt, false);
  }

  /** @inheritdoc */
  public async inferReturnType(
    route: RouteDefinition,
    sourceCode: string,
  ): Promise<DtoSchema | null> {
    const prompt = `Based on this NestJS method code, what TypeScript type does it return? Describe it as JSON Schema properties. Return ONLY valid JSON with a "properties" key mapping property names to { "type": "string"|"number"|"boolean"|"object"|"array" }. If you cannot determine the return type, return {"properties":{}}. Code: ${sourceCode}`;

    const response = await this.sendMessage(prompt, true);

    try {
      const parsed = this.parseJson<{ properties: Record<string, { type: string }> }>(response);

      if (!parsed.properties || Object.keys(parsed.properties).length === 0) {
        return null;
      }

      const properties = Object.entries(parsed.properties).map(([name, def]) => ({
        name,
        type: (def.type ?? 'unknown') as import('../types/schema.types.js').PropertyType,
        required: true,
      }));

      return {
        name: `${route.methodName}Response`,
        filePath: '',
        properties,
        description: `Inferred return type for ${route.methodName}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Sends a message to OpenAI with rate limiting and retry logic.
   * @param prompt - The prompt to send
   * @param jsonMode - Whether to use JSON response format
   */
  private async sendMessage(prompt: string, jsonMode: boolean): Promise<string> {
    await this.waitForRateLimit();

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        this.recordRequest();

        const response = await this.client.chat.completions.create({
          model: this.model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
          ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
        });

        const choice = response.choices[0];
        if (choice?.message?.content) {
          return choice.message.content.trim();
        }

        throw new AiProviderError('OpenAI returned no content');
      } catch (error: unknown) {
        lastError = error;

        if (this.isRateLimitError(error) && attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await this.sleep(backoff);
          continue;
        }

        if (error instanceof AiProviderError) {
          throw error;
        }

        throw new AiProviderError(
          `OpenAI API call failed: ${error instanceof Error ? error.message : 'unknown error'}`,
          error,
        );
      }
    }

    throw new AiProviderError(
      `OpenAI API call failed after ${String(this.maxRetries)} retries`,
      lastError,
    );
  }

  /**
   * Waits if the rate limit would be exceeded.
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000;

    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestInWindow = this.requestTimestamps[0];
      if (oldestInWindow !== undefined) {
        const waitMs = oldestInWindow - windowStart + 100;
        if (waitMs > 0) {
          await this.sleep(waitMs);
        }
      }
    }
  }

  /**
   * Records a request timestamp for rate limiting.
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Checks if an error is a 429 rate limit error.
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error && 'status' in error) {
      return (error as Error & { status: number }).status === 429;
    }
    return false;
  }

  /**
   * Parses a JSON string, stripping markdown code fences if present.
   */
  private parseJson<T>(text: string): T {
    let cleaned = text.trim();

    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      lines.shift();
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop();
      }
      cleaned = lines.join('\n').trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (error: unknown) {
      throw new AiProviderError(
        `Failed to parse JSON from OpenAI response: ${cleaned.substring(0, 200)}`,
        error,
      );
    }
  }

  /**
   * Sleeps for the given number of milliseconds.
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
