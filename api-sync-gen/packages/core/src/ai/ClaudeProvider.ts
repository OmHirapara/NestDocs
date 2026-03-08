import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider } from './AiProvider.js';
import type { RouteDefinition } from '../types/endpoint.types.js';
import type { DtoSchema } from '../types/schema.types.js';
import { AiProviderError } from '../errors.js';

/**
 * Default model for Claude API calls.
 */
const DEFAULT_MODEL = 'claude-sonnet-4-5';

/**
 * Default rate limit (requests per minute).
 */
const DEFAULT_RPM = 30;

/**
 * Default max retries on 429 rate limit errors.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * AI provider implementation using Anthropic's Claude API.
 *
 * Implements rate limiting by queuing requests and retrying on 429 errors
 * with exponential backoff.
 */
export class ClaudeProvider implements AiProvider {
  private readonly client: Anthropic;
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
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
    this.maxRequestsPerMinute = maxRequestsPerMinute ?? DEFAULT_RPM;
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /** @inheritdoc */
  public async describeEndpoint(route: RouteDefinition): Promise<string> {
    const params = route.parameters.map((p) => `${p.name} (${p.location})`).join(', ');
    const prompt = `You are an API documentation expert. Write a concise 1-2 sentence OpenAPI description for this endpoint. Return ONLY the description, no quotes, no explanation. Route: ${route.method} ${route.fullPath}. Method name: ${route.methodName}. Parameters: ${params || 'none'}.`;

    return this.sendMessage(prompt);
  }

  /** @inheritdoc */
  public async generateExample(dto: DtoSchema): Promise<Record<string, unknown>> {
    const fields = dto.properties
      .map((p) => `${p.name}: ${p.type}${p.required ? ' (required)' : ' (optional)'}${p.enumValues ? ` [${p.enumValues.join(', ')}]` : ''}`)
      .join(', ');

    const prompt = `Generate a realistic JSON example for this DTO. Return ONLY valid JSON, no markdown, no explanation. Fields: ${fields}`;

    const response = await this.sendMessage(prompt);
    return this.parseJson<Record<string, unknown>>(response);
  }

  /** @inheritdoc */
  public async generatePostmanTests(
    route: RouteDefinition,
    schema: Record<string, unknown>,
  ): Promise<string> {
    const prompt = `Write Postman test scripts in JavaScript using pm.test() syntax. Include: status code check (${String(route.expectedStatus)}), response time under 2000ms, JSON schema validation. Return ONLY JavaScript code. Schema: ${JSON.stringify(schema)}`;

    return this.sendMessage(prompt);
  }

  /** @inheritdoc */
  public async generatePreRequestScript(route: RouteDefinition): Promise<string> {
    const prompt = `Write a Postman pre-request script in JavaScript. Set Authorization header from pm.environment.get('authToken'). Return ONLY JavaScript code.`;

    return this.sendMessage(prompt);
  }

  /** @inheritdoc */
  public async inferReturnType(
    route: RouteDefinition,
    sourceCode: string,
  ): Promise<DtoSchema | null> {
    const prompt = `Based on this NestJS method code, what TypeScript type does it return? Describe it as JSON Schema properties. Return ONLY valid JSON with a "properties" key mapping property names to { "type": "string"|"number"|"boolean"|"object"|"array" }. If you cannot determine the return type, return {"properties":{}}. Code: ${sourceCode}`;

    const response = await this.sendMessage(prompt);

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
   * Sends a message to Claude with rate limiting and retry logic.
   */
  private async sendMessage(prompt: string): Promise<string> {
    await this.waitForRateLimit();

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        this.recordRequest();

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        });

        const firstBlock = response.content[0];
        if (firstBlock && firstBlock.type === 'text') {
          return firstBlock.text.trim();
        }

        throw new AiProviderError('Claude returned no text content');
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
          `Claude API call failed: ${error instanceof Error ? error.message : 'unknown error'}`,
          error,
        );
      }
    }

    throw new AiProviderError(
      `Claude API call failed after ${String(this.maxRetries)} retries`,
      lastError,
    );
  }

  /**
   * Waits if the rate limit would be exceeded.
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000;

    // Remove timestamps older than 1 minute
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

    // Strip markdown code fences
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      lines.shift(); // Remove opening fence
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop(); // Remove closing fence
      }
      cleaned = lines.join('\n').trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (error: unknown) {
      throw new AiProviderError(
        `Failed to parse JSON from Claude response: ${cleaned.substring(0, 200)}`,
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
