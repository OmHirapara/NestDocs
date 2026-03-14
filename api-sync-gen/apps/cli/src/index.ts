import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { registerAllCommand } from './commands/all.command.js';
import { registerSwaggerCommand } from './commands/swagger.command.js';
import { registerPostmanCommand } from './commands/postman.command.js';
import { registerPushCommand } from './commands/push.command.js';
import { registerWatchCommand } from './commands/watch.command.js';
import { registerRunCommand } from './commands/run.command.js';
import { registerInitCommand } from './commands/init.command.js';
import { registerValidateCommand } from './commands/validate.command.js';
import { registerDiffCommand } from './commands/diff.command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as { version: string };

const program = new Command();

program
  .name('api-sync')
  .description('Auto-generate Swagger + Postman from NestJS/TypeScript code')
  .version(pkg.version);

// Register all commands
registerAllCommand(program);
registerSwaggerCommand(program);
registerPostmanCommand(program);
registerPushCommand(program);
registerWatchCommand(program);
registerRunCommand(program);
registerInitCommand(program);
registerValidateCommand(program);
registerDiffCommand(program);

// Default action — show help if no command given
program.action(() => {
  program.outputHelp();
});

program.parse(process.argv);
