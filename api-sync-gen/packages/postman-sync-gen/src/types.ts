import type { OpenAPIV3 } from 'openapi-types';

/**
 * Postman Collection v2.1 types.
 * Subset of the full Postman Collection schema, covering what we generate.
 */

export interface PostmanCollection {
  readonly info: PostmanCollectionInfo;
  readonly auth?: PostmanAuth;
  readonly item: readonly PostmanFolder[];
  readonly variable?: readonly PostmanVariable[];
}

export interface PostmanCollectionInfo {
  readonly name: string;
  readonly schema: string;
  readonly description?: string;
}

export interface PostmanFolder {
  readonly name: string;
  readonly item: readonly PostmanItem[];
}

export interface PostmanItem {
  readonly name: string;
  readonly request: PostmanRequest;
  readonly event?: readonly PostmanEvent[];
}

export interface PostmanRequest {
  readonly method: string;
  readonly url: PostmanUrl;
  readonly header?: readonly PostmanHeader[];
  readonly body?: PostmanBody;
  readonly description?: string;
  readonly auth?: PostmanAuth;
}

export interface PostmanUrl {
  readonly raw: string;
  readonly host: readonly string[];
  readonly path: readonly string[];
  readonly query?: readonly PostmanQueryParam[];
  readonly variable?: readonly PostmanVariable[];
}

export interface PostmanQueryParam {
  readonly key: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly description?: string;
}

export interface PostmanVariable {
  readonly key: string;
  readonly value: string;
  readonly description?: string;
}

export interface PostmanHeader {
  readonly key: string;
  readonly value: string;
  readonly type?: string;
}

export interface PostmanBody {
  readonly mode: 'raw' | 'formdata' | 'urlencoded';
  readonly raw?: string;
  readonly options?: {
    readonly raw?: { readonly language: 'json' | 'text' | 'xml' };
  };
}

export interface PostmanAuth {
  readonly type: 'bearer' | 'apikey' | 'noauth';
  readonly bearer?: readonly PostmanAuthParam[];
  readonly apikey?: readonly PostmanAuthParam[];
}

export interface PostmanAuthParam {
  readonly key: string;
  readonly value: string;
  readonly type: string;
}

export interface PostmanEvent {
  readonly listen: 'test' | 'prerequest';
  readonly script: {
    readonly type: 'text/javascript';
    readonly exec: readonly string[];
  };
}

export interface PostmanEnvironment {
  readonly name: string;
  readonly values: readonly PostmanEnvValue[];
}

export interface PostmanEnvValue {
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
}

/**
 * Output produced by the Postman generation pipeline.
 */
export interface PostmanOutput {
  readonly collection: PostmanCollection;
  readonly outputPath: string;
}

/**
 * Newman run summary (simplified).
 */
export interface NewmanRunSummary {
  readonly run: {
    readonly stats: {
      readonly requests: { readonly total: number; readonly failed: number };
      readonly assertions: { readonly total: number; readonly failed: number };
    };
    readonly failures: readonly unknown[];
  };
}
