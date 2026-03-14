# api-sync-gen

[![npm version](https://img.shields.io/npm/v/@company/api-sync-core.svg)](https://www.npmjs.com/package/@company/api-sync-core)
[![Build Status](https://img.shields.io/github/actions/workflow/status/company/api-sync-gen/ci.yml?branch=main)](https://github.com/company/api-sync-gen/actions)
[![Coverage](https://img.shields.io/codecov/c/github/company/api-sync-gen)](https://codecov.io/gh/company/api-sync-gen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **One command** to auto-generate Swagger docs + Postman collections from your NestJS source code — with optional AI enrichment.

```bash
$ npx api-sync all

ℹ api-sync — Starting full generation pipeline
──────────────────────────────────────────────────
[1/5] Loading configuration...
[2/5] Generating swagger.json...
✓ swagger.json → ./docs/swagger.json
[3/5] Starting Swagger UI...
✓ Swagger UI → http://localhost:3001/docs
[4/5] Generating Postman collection...
✓ collection.json → ./docs/collection.json
[5/5] Pushing to Postman Team Workspace...
✓ Postman Team Workspace updated
──────────────────────────────────────────────────
✓ Generation complete!
```

---

## What is this?

**api-sync-gen** solves a painful problem in NestJS development: keeping your API documentation and Postman collections in sync with your actual code. Every time you add an endpoint, change a DTO field, or update validation rules, you have to manually update swagger decorators, re-export the spec, re-import into Postman, and update test scripts. This is tedious, error-prone, and usually falls out of date.

With api-sync-gen, you write **zero swagger decorators**. The tool scans your NestJS controllers and DTOs directly using the TypeScript AST, extracts routes and schemas from existing decorators (`@Controller`, `@Get`, `@Body`, `@IsString`, etc.), and generates a complete OpenAPI 3.0 spec and Postman Collection v2.1 — with AI-enhanced descriptions, examples, and test scripts if you want them.

### Before vs After

| Manual Workflow                         | With api-sync-gen                                 |
| --------------------------------------- | ------------------------------------------------- |
| Add `@ApiProperty()` to every DTO field | Already done — reads `class-validator` decorators |
| Add `@ApiOperation()` to every route    | AI generates descriptions automatically           |
| Copy swagger.json, import into Postman  | One command generates both                        |
| Manually write Postman test scripts     | AI generates status, schema, and timing tests     |
| Update Postman workspace by hand        | Auto-pushes to Team Workspace on every merge      |

---

## Installation

```bash
npm install --save-dev @company/swagger-sync-gen @company/postman-sync-gen
```

Or use the CLI directly:

```bash
npx api-sync init
```

---

## Quick Start

### Step 1: Create `.env`

```env
# Optional — enables AI-enhanced descriptions and examples
CLAUDE_API_KEY=sk-ant-...

# Optional — enables auto-push to Postman Team Workspace
POSTMAN_API_KEY=PMAK-...
POSTMAN_WORKSPACE_ID=your-workspace-id
```

### Step 2: Initialize config

```bash
npx api-sync init
```

This creates `api-sync.config.ts` in your project root.

### Step 3: Generate everything

```bash
npx api-sync all
```

This will:

1. Scan your NestJS controllers and DTOs
2. Generate `swagger.json`
3. Start Swagger UI at `http://localhost:3001/docs`
4. Generate Postman `collection.json`
5. Push to your Postman Team Workspace (if configured)

---

## Configuration Reference

All configuration is in `api-sync.config.ts`:

### Root Options

| Field     | Type       | Default            | Description                         |
| --------- | ---------- | ------------------ | ----------------------------------- |
| `entry`   | `string`   | `'./src'`          | Path to scan for NestJS controllers |
| `exclude` | `string[]` | `['**/*.spec.ts']` | Glob patterns to exclude            |

### Swagger Options (`swagger.*`)

| Field         | Type                              | Default                            | Description                    |
| ------------- | --------------------------------- | ---------------------------------- | ------------------------------ |
| `output`      | `string`                          | `'./docs/swagger.json'`            | Output path for generated spec |
| `title`       | `string`                          | `'API'`                            | API title in OpenAPI info      |
| `description` | `string`                          | `''`                               | API description                |
| `version`     | `string`                          | `'1.0.0'`                          | API version                    |
| `servers`     | `Server[]`                        | `[{url: 'http://localhost:3000'}]` | Server URLs                    |
| `auth.type`   | `'bearer' \| 'apiKey' \| 'basic'` | `'bearer'`                         | Authentication scheme          |
| `ui.enabled`  | `boolean`                         | `true`                             | Enable Swagger UI server       |
| `ui.port`     | `number`                          | `3001`                             | Swagger UI port                |
| `ui.path`     | `string`                          | `'/docs'`                          | Swagger UI URL path            |

### Postman Options (`postman.*`)

| Field                             | Type                  | Default                    | Description                |
| --------------------------------- | --------------------- | -------------------------- | -------------------------- |
| `output`                          | `string`              | `'./docs/collection.json'` | Output path                |
| `collectionName`                  | `string`              | `'API'`                    | Postman collection name    |
| `environments`                    | `Record<string, Env>` | `{}`                       | Named environments         |
| `workspace.apiKey`                | `string`              | `''`                       | Postman API key            |
| `workspace.workspaceId`           | `string`              | `''`                       | Target workspace ID        |
| `tests.generateStatusTests`       | `boolean`             | `true`                     | Auto-generate status tests |
| `tests.generateSchemaTests`       | `boolean`             | `false`                    | Auto-generate schema tests |
| `tests.generateResponseTimeTests` | `boolean`             | `true`                     | Auto-generate timing tests |

### AI Options (`ai.*`)

| Field                              | Type                   | Default    | Description                            |
| ---------------------------------- | ---------------------- | ---------- | -------------------------------------- |
| `enabled`                          | `boolean`              | `false`    | Enable AI enrichment                   |
| `provider`                         | `'claude' \| 'openai'` | `'claude'` | AI provider                            |
| `apiKey`                           | `string`               | `''`       | Provider API key                       |
| `features.autoDescribeEndpoints`   | `boolean`              | `true`     | AI-generated endpoint descriptions     |
| `features.autoGenerateExamples`    | `boolean`              | `true`     | AI-generated request/response examples |
| `features.autoGenerateTestScripts` | `boolean`              | `true`     | AI-generated Postman test scripts      |

### Output Options (`output.*`)

| Field       | Type      | Default | Description                           |
| ----------- | --------- | ------- | ------------------------------------- |
| `pretty`    | `boolean` | `true`  | Pretty-print JSON output              |
| `overwrite` | `boolean` | `true`  | Overwrite existing files              |
| `backup`    | `boolean` | `true`  | Create `.bak` backup before overwrite |

---

## CLI Commands Reference

### `api-sync all`

Generate swagger.json + collection.json and push to Postman.

```bash
npx api-sync all                    # Full pipeline
npx api-sync all --no-push          # Skip Postman push
npx api-sync all --no-serve         # Skip Swagger UI
```

### `api-sync swagger`

Generate swagger.json only.

```bash
npx api-sync swagger                # One-time generation
npx api-sync swagger --watch        # Watch mode with live reload
npx api-sync swagger --serve        # Start Swagger UI after generation
```

### `api-sync postman`

Generate Postman collection from swagger.json.

```bash
npx api-sync postman
npx api-sync postman --swagger-path ./custom/swagger.json
```

### `api-sync push`

Push collection to Postman Team Workspace.

```bash
npx api-sync push
npx api-sync push --env staging
```

### `api-sync watch`

Watch source files and regenerate on changes.

```bash
npx api-sync watch
```

### `api-sync run`

Run Postman collection tests with Newman.

```bash
npx api-sync run
npx api-sync run --collection ./docs/collection.json --reporter html
npx api-sync run --env ./docs/env.local.json
```

### `api-sync validate`

Validate an existing swagger.json.

```bash
npx api-sync validate ./docs/swagger.json
```

### `api-sync init`

Create api-sync.config.ts in current directory.

```bash
npx api-sync init
npx api-sync init --force           # Overwrite existing
```

### `api-sync diff`

Compare two JSON files and show differences.

```bash
npx api-sync diff ./docs/swagger.json ./docs/swagger.backup.json
```

---

## AI Provider Setup

### Claude (Anthropic)

1. Get an API key at [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env`: `CLAUDE_API_KEY=sk-ant-...`
3. Set `ai.provider: 'claude'` in config

### OpenAI

1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Set `ai.provider: 'openai'` in config

### Cost Estimate

- **Per run**: ~$0.01–$0.05 depending on number of endpoints
- **Claude Haiku**: cheapest option for descriptions
- **Disable AI**: set `ai.enabled: false` for zero cost

---

## CI/CD Integration

### GitHub Actions Setup

Add these secrets to your repository:

| Secret                 | Required    | Description          |
| ---------------------- | ----------- | -------------------- |
| `CODECOV_TOKEN`        | Optional    | Codecov upload token |
| `NPM_TOKEN`            | For publish | npm auth token       |
| `CLAUDE_API_KEY`       | Optional    | AI enrichment key    |
| `POSTMAN_API_KEY`      | Optional    | Postman API key      |
| `POSTMAN_WORKSPACE_ID` | Optional    | Postman workspace ID |

### What Happens on Merge to Main

1. **CI Pipeline** runs tests on Node 18, 20, and 22
2. **Release Pipeline** publishes to npm via changesets
3. **Sync Pipeline** regenerates docs and pushes to Postman workspace
4. **Auto-commit** updates `swagger.json` and `collection.json` in the repo

Copy `.github/workflows/ci.yml` and `.github/workflows/release.yml` from this repo.

---

## Supported NestJS Decorators

| Decorator                                              | Maps To                 | Notes                    |
| ------------------------------------------------------ | ----------------------- | ------------------------ |
| `@Controller('path')`                                  | OpenAPI tag + base path | Groups all routes        |
| `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()` | HTTP method + path      | Full operation           |
| `@Param('name')`                                       | Path parameter          | `{name}` in URL          |
| `@Query('name')`                                       | Query parameter         | `?name=value`            |
| `@Body()`                                              | Request body            | References DTO schema    |
| `@HttpCode(201)`                                       | Response status         | Default varies by method |
| `@UseGuards()`                                         | Security requirement    | Marks as authenticated   |
| `@IsString()`                                          | `type: string`          | From class-validator     |
| `@IsNumber()`                                          | `type: number`          | From class-validator     |
| `@IsBoolean()`                                         | `type: boolean`         | From class-validator     |
| `@IsEmail()`                                           | `format: email`         | String constraint        |
| `@IsEnum(Enum)`                                        | `enum: [...]`           | Enum values              |
| `@IsOptional()`                                        | Not in `required`       | Optional field           |
| `@MinLength(n)`                                        | `minLength: n`          | String constraint        |
| `@MaxLength(n)`                                        | `maxLength: n`          | String constraint        |
| `@Min(n)`                                              | `minimum: n`            | Number constraint        |
| `@Max(n)`                                              | `maximum: n`            | Number constraint        |
| `@IsArray()`                                           | `type: array`           | Array field              |
| `@ValidateNested()`                                    | `$ref`                  | Nested object reference  |

---

## Troubleshooting

### 1. "No api-sync.config.ts found"

```bash
npx api-sync init
```

### 2. "Cannot find tsconfig.json"

Ensure `tsconfig.json` exists in your project root. The scanner walks up directories from `entry` to find it.

### 3. "Postman API key invalid"

Check `POSTMAN_API_KEY` in your `.env` file. Get a new key from [Postman Settings → API Keys](https://web.postman.co/settings/me/api-keys).

### 4. "swagger.json validation failed"

Run the validator to see specific errors:

```bash
npx api-sync validate ./docs/swagger.json
```

### 5. "AI provider error"

- Verify your `CLAUDE_API_KEY` or `OPENAI_API_KEY` is valid
- Or disable AI: set `ai.enabled: false` in your config
- The tool works perfectly fine without AI — it just won't auto-generate descriptions

---

## Project Structure

```
api-sync-gen/
├── packages/
│   ├── core/           → @company/api-sync-core
│   ├── swagger-sync-gen/ → @company/swagger-sync-gen
│   └── postman-sync-gen/ → @company/postman-sync-gen
├── apps/
│   └── cli/            → api-sync (npx api-sync)
├── examples/
│   └── nestjs-sample-app/
└── .github/workflows/
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

---

## License

MIT © Company
