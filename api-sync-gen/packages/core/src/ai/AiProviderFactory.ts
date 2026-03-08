import type { AiProvider } from './AiProvider.js';
import type { ResolvedApiSyncConfig } from '../config/types.js';
import { ClaudeProvider } from './ClaudeProvider.js';
import { OpenAiProvider } from './OpenAiProvider.js';
import { AiProviderError } from '../errors.js';

/**
 * Factory function that creates the appropriate AI provider based on config,
 * or returns null if AI is disabled.
 *
 * @param config - The fully-resolved application config
 * @returns An AiProvider instance, or null if AI features are disabled
 * @throws AiProviderError if the provider name is unknown
 */
export function createAiProvider(config: ResolvedApiSyncConfig): AiProvider | null {
  if (!config.ai.enabled || !config.ai.apiKey) {
    return null;
  }

  const { provider, apiKey, model, rateLimit } = config.ai;

  if (provider === 'claude') {
    return new ClaudeProvider(
      apiKey,
      model,
      rateLimit.requestsPerMinute,
      rateLimit.maxRetries,
    );
  }

  if (provider === 'openai') {
    return new OpenAiProvider(
      apiKey,
      model,
      rateLimit.requestsPerMinute,
      rateLimit.maxRetries,
    );
  }

  throw new AiProviderError(`Unknown AI provider: ${String(provider)}`);
}
