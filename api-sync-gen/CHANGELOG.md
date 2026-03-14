# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-14

### Added

- **@company/api-sync-core** — AST scanner, decorator parser, DTO parser, entity parser
- **@company/api-sync-core** — AI providers (Claude, OpenAI) with factory pattern
- **@company/api-sync-core** — Config loader with validation (cosmiconfig + Zod)
- **@company/api-sync-core** — Logger, Result monad, custom error classes
- **@company/swagger-sync-gen** — OpenAPI 3.0 builder (schema, path, security)
- **@company/swagger-sync-gen** — Spec validator using swagger-parser
- **@company/swagger-sync-gen** — File writer with backup support
- **@company/swagger-sync-gen** — Swagger UI dev server with hot reload
- **@company/swagger-sync-gen** — AI enrichment for descriptions and examples
- **@company/postman-sync-gen** — Swagger to Postman Collection v2.1 converter
- **@company/postman-sync-gen** — Auto-generated test scripts (status, schema, timing)
- **@company/postman-sync-gen** — Postman workspace push with diff detection
- **@company/postman-sync-gen** — Newman integration for CI testing
- **api-sync CLI** — 9 commands: all, swagger, postman, push, watch, run, validate, init, diff
- **CI/CD** — GitHub Actions for testing, releasing, and syncing
- **Examples** — Sample NestJS app (TourMate) for integration testing
