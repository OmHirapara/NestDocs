import type { PostmanAuth, PostmanAuthParam } from '../types.js';

type AuthType = 'bearer' | 'apiKey' | 'both' | 'none';

/**
 * Builds Postman authentication configurations from the application auth type.
 */
export class AuthBuilder {
  /**
   * Builds a PostmanAuth object for the given auth type.
   * @param authType - The type of authentication to configure
   * @returns Postman auth configuration
   */
  public buildAuth(authType: AuthType): PostmanAuth {
    if (authType === 'bearer') {
      return {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }],
      };
    }

    if (authType === 'apiKey') {
      return {
        type: 'apikey',
        apikey: [
          { key: 'key', value: '{{apiKeyHeader}}', type: 'string' },
          { key: 'value', value: '{{apiKey}}', type: 'string' },
          { key: 'in', value: 'header', type: 'string' },
        ],
      };
    }

    return { type: 'noauth' };
  }
}
