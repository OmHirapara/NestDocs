import ora, { type Ora } from 'ora';

export class Spinner {
  private instance: Ora;

  constructor(text: string) {
    this.instance = ora({ text, color: 'cyan' });
  }

  start(text?: string): void {
    if (text) this.instance.text = text;
    this.instance.start();
  }

  succeed(text: string): void {
    this.instance.succeed(text);
  }

  fail(text: string): void {
    this.instance.fail(text);
  }

  update(text: string): void {
    this.instance.text = text;
  }

  stop(): void {
    this.instance.stop();
  }
}
