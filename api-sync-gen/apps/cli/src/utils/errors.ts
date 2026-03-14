export function handleError(error: unknown, context: string): never {
  if (error instanceof Error) {
    console.error(`\n${context}: ${error.message}`);
    if (process.env['DEBUG']) {
      console.error(error.stack);
    }
  } else {
    console.error(`\n${context}: Unknown error`);
  }
  process.exit(1);
}
