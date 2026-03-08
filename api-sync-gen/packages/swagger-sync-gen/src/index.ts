// ─── Main ─────────────────────────────────────────────────────────────────────
export { SwaggerSyncGen } from './SwaggerSyncGen.js';
export { createSwaggerSyncGen } from './factory.js';

// ─── Types ────────────────────────────────────────────────────────────────────
export type { SwaggerOutput } from './types.js';

// ─── Builders (for advanced usage) ────────────────────────────────────────────
export { OpenApiBuilder } from './builder/OpenApiBuilder.js';
export { SchemaBuilder } from './builder/SchemaBuilder.js';
export { PathBuilder } from './builder/PathBuilder.js';
export { SecurityBuilder } from './builder/SecurityBuilder.js';

// ─── Errors ───────────────────────────────────────────────────────────────────
export { OpenApiBuilderError, SpecValidationError, SwaggerUiServerError } from './errors.js';
