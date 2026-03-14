import chalk from 'chalk';

export const cliLogger = {
  info: (msg: string): void => { console.info(chalk.cyan('ℹ'), msg); },
  success: (msg: string): void => { console.info(chalk.green('✓'), msg); },
  warn: (msg: string): void => { console.warn(chalk.yellow('⚠'), msg); },
  error: (msg: string, err?: unknown): void => {
    console.error(chalk.red('✗'), msg);
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
      if (err.stack && process.env['DEBUG']) {
        console.error(chalk.dim(err.stack));
      }
    }
  },
  step: (step: number, total: number, msg: string): void => {
    console.info(chalk.dim(`[${String(step)}/${String(total)}]`), msg);
  },
  divider: (): void => { console.info(chalk.dim('─'.repeat(50))); },
  blank: (): void => { console.info(''); },
};
