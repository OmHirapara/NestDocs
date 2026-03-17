# TourMate NestJS Sample App

This is a sample NestJS application used to demonstrate the capabilities of the `api-sync-gen` package. It contains various controllers and DTOs that are scanned to generate Swagger and Postman documentation.

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in this directory and add your Postman credentials:

```bash
# Postman credentials (required for pushing to workspace)
POSTMAN_API_KEY=your_postman_api_key_here
POSTMAN_WORKSPACE_ID=your_workspace_id_here

# AI Provider (optional, for AI-powered description generation)
CLAUDE_API_KEY=your_optional_claude_key
```

### 2. Build the Monorepo

From the **root** of the project, run the build command to ensure all packages and the CLI are ready:

```bash
npm run build
```

### 3. Run the Generation Pipeline

From **this directory** (`examples/nestjs-sample-app`), run the `api-sync` CLI:

```bash
node ../../apps/cli/dist/index.js all
```

This command will:

1. Scan the NestJS code in `src/`.
2. Generate `docs/swagger.json`.
3. Serve Swagger UI at `http://localhost:3001/docs`.
4. Generate `docs/collection.json`.
5. Push the collection to your Postman Workspace (if API key is provided).

## Other Commands

- **Generate Swagger only**: `node ../../apps/cli/dist/index.js swagger`
- **Generate Postman only**: `node ../../apps/cli/dist/index.js postman`
- **Push to Postman**: `node ../../apps/cli/dist/index.js push`
