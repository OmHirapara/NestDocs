import Ajv from 'ajv';

/**
 * Validates response payloads against JSON Schema using Ajv.
 * Used for generating Postman schema validation test scripts.
 */
export class SchemaValidator {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
  }

  /**
   * Validates data against a JSON Schema.
   * @param data - The data to validate
   * @param schema - The JSON Schema to validate against
   * @returns An object indicating whether validation passed and any error messages
   */
  public validate(
    data: unknown,
    schema: Record<string, unknown>,
  ): { readonly valid: boolean; readonly errors: readonly string[] } {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors = (validate.errors ?? []).map((err) => {
      const path = err.instancePath || '/';
      return `${path}: ${err.message ?? 'unknown error'}`;
    });

    return { valid: false, errors };
  }

  /**
   * Generates a Postman test script that validates the response against a JSON Schema.
   * @param schema - The JSON Schema to embed in the test
   * @returns JavaScript code using pm.test() and tv4 for schema validation
   */
  public generateSchemaTestScript(schema: Record<string, unknown>): string {
    const schemaStr = JSON.stringify(schema, null, 2);
    return [
      `pm.test("Response matches JSON schema", function() {`,
      `  const schema = ${schemaStr};`,
      `  const jsonData = pm.response.json();`,
      `  pm.expect(tv4.validate(jsonData, schema)).to.be.true;`,
      `});`,
    ].join('\n');
  }
}
