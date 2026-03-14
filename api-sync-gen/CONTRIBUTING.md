# Contributing to api-sync-gen

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/company/api-sync-gen.git
cd api-sync-gen

# 2. Install dependencies
npm install

# 3. Build all packages
npm run build

# 4. Run tests
npm run test
```

## Development Workflow

### Building

```bash
npm run build           # Build all packages
npm run dev             # Watch mode for all packages
```

### Testing

```bash
npm run test            # Run all tests
npm run test:coverage   # Run tests with coverage
```

### Linting

```bash
npm run lint            # Check for lint errors
npm run lint:fix        # Auto-fix lint errors
npm run format          # Format with Prettier
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/). All commit messages must follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, no code change                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `chore`    | Maintenance tasks                                       |
| `ci`       | CI/CD changes                                           |

### Scopes

- `core` — packages/core
- `swagger` — packages/swagger-sync-gen
- `postman` — packages/postman-sync-gen
- `cli` — apps/cli

### Examples

```
feat(swagger): add support for @ApiTags decorator
fix(postman): handle empty query parameters correctly
docs: update README with new CLI commands
test(core): add unit tests for DtoParser
```

## Opening a Pull Request

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/my-feature`
3. **Make changes** and write tests
4. **Ensure all checks pass**: `npm run build && npm run test && npm run lint`
5. **Commit** using conventional commits
6. **Push** and open a PR against `main`

## Code Style

- **TypeScript strict mode** — no `any`, no implicit returns
- **ESLint + Prettier** — enforced via CI
- **Result monad** — use `Result<T, E>` instead of try/catch for public APIs
- **JSDoc comments** — all public methods must have JSDoc
- **Tests** — minimum 80% coverage for new code

## Package Architecture

Each package follows the same structure:

```
packages/<name>/
├── src/          # Source code
├── __tests__/    # Unit tests
├── dist/         # Build output (gitignored)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── jest.config.js
```

## Questions?

Open an issue or start a discussion on GitHub.
