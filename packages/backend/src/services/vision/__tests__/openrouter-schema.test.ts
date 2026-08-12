/**
 * Automated Unit Tests for Zod → OpenRouter Schema conversion pipeline.
 * Runs using NodeJS built-in assert module.
 */

import assert from "assert";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  transformSchema,
  cleanRequiredProperties,
  validateSchemaStructure,
  validateJSONSchemaKeywords,
  stripValidationKeywords,
} from "../openrouter-schema.js";

// Helper to run pipeline: zod -> json -> transform -> clean -> strip -> validate
function processZod(zodSchema: z.ZodType<any>, depthLimit = 4): any {
  const raw = zodToJsonSchema(zodSchema);
  const transformed = transformSchema(raw, raw, {}, depthLimit);
  const cleaned = cleanRequiredProperties(transformed);
  const stripped = stripValidationKeywords(cleaned);
  
  // Validate schema structure and forbidden keywords
  validateJSONSchemaKeywords(stripped);
  const errors = validateSchemaStructure(stripped);
  if (errors.length > 0) {
    throw new Error(`Schema validation failed: ${JSON.stringify(errors)}`);
  }
  return stripped;
}

function testNestedArrays() {
  console.log("  - Running: nested arrays...");
  const schema = z.object({
    matrix: z.array(z.array(z.number())),
  });

  const result = processZod(schema);
  assert.strictEqual(result.properties.matrix.type, "array");
  assert.strictEqual(result.properties.matrix.items.type, "array");
  assert.strictEqual(result.properties.matrix.items.items.type, "number");
}

function testNestedObjects() {
  console.log("  - Running: nested objects...");
  const schema = z.object({
    user: z.object({
      profile: z.object({
        age: z.number(),
      }),
    }),
  });

  const result = processZod(schema);
  assert.strictEqual(result.properties.user.type, "object");
  assert.strictEqual(result.properties.user.properties.profile.type, "object");
  assert.strictEqual(result.properties.user.properties.profile.properties.age.type, "number");
}

function testOptionalFields() {
  console.log("  - Running: optional fields...");
  const schema = z.object({
    requiredField: z.string(),
    optionalField: z.string().optional(),
  });

  const result = processZod(schema);
  assert.ok(result.required.includes("requiredField"));
  assert.ok(!result.required.includes("optionalField"));
}

function testRequiredFields() {
  console.log("  - Running: required fields...");
  const schema = z.object({
    id: z.string(),
    name: z.string(),
  });

  const result = processZod(schema);
  assert.deepStrictEqual(result.required, ["id", "name"]);
}

function testArraysOfObjects() {
  console.log("  - Running: arrays of objects...");
  const schema = z.object({
    users: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    ),
  });

  const result = processZod(schema);
  assert.strictEqual(result.properties.users.type, "array");
  assert.strictEqual(result.properties.users.items.type, "object");
  assert.ok(result.properties.users.items.required.includes("id"));
  assert.ok(result.properties.users.items.required.includes("name"));
}

function testRecursiveStructures() {
  console.log("  - Running: recursive structures...");
  interface Node {
    name: string;
    children?: Node[];
  }
  const NodeSchema: z.ZodType<Node> = z.lazy(() =>
    z.object({
      name: z.string(),
      children: z.array(NodeSchema).optional(),
    })
  );

  // Process with a small depth limit to make assertions simple
  const result = processZod(NodeSchema, 2);

  // Verify that recursion is cut off without leaving forbidden keywords or required inconsistencies
  assert.strictEqual(result.type, "object");
  assert.strictEqual(result.properties.name.type, "string");
  assert.strictEqual(result.properties.children.type, "array");
  
  // Depth 1 children items:
  const depth1 = result.properties.children.items;
  assert.strictEqual(depth1.type, "object");
  assert.strictEqual(depth1.properties.name.type, "string");
  assert.strictEqual(depth1.properties.children.type, "array");

  // Depth 2 children items:
  const depth2 = depth1.properties.children.items;
  assert.strictEqual(depth2.type, "object");
  assert.strictEqual(depth2.properties.name.type, "string");
  assert.strictEqual(depth2.properties.children.type, "array");

  // Depth 3 children items should be cut off/leaf:
  const depth3 = depth2.properties.children.items;
  assert.strictEqual(depth3.type, "object");
  assert.strictEqual(depth3.properties.name.type, "string");
  assert.strictEqual(depth3.properties.children, undefined, "Recursive field should be omitted at limit");
  
  // The required list for leaf should be undefined since no required list is emitted on recursive limit cutoff
  assert.strictEqual(depth3.required, undefined, "Leaf node required field list should be undefined");
}

function testValidationKeywordsStripped() {
  console.log("  - Running: validation keywords stripped...");
  const schema = z.object({
    padding: z.number().min(0).max(100).default(10),
    color: z.string().regex(/^#([0-9a-fA-F]{3,8})$/).default("#ffffff"),
  });

  const result = processZod(schema);
  
  // Verify basic structure is intact
  assert.strictEqual(result.properties.padding.type, "number");
  assert.strictEqual(result.properties.color.type, "string");
  
  // Verify disallowed validation/metadata keywords are completely removed
  assert.strictEqual(result.properties.padding.minimum, undefined);
  assert.strictEqual(result.properties.padding.maximum, undefined);
  assert.strictEqual(result.properties.padding.default, undefined);
  
  assert.strictEqual(result.properties.color.pattern, undefined);
  assert.strictEqual(result.properties.color.default, undefined);
  assert.strictEqual(result.additionalProperties, undefined);
}

function runAllTests() {
  console.log("=== Starting OpenRouter Schema Pipeline Tests ===");
  try {
    testNestedArrays();
    testNestedObjects();
    testOptionalFields();
    testRequiredFields();
    testArraysOfObjects();
    testRecursiveStructures();
    testValidationKeywordsStripped();
    console.log("=== All OpenRouter Schema Tests Passed Successfully! ===");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test execution failed:", err);
    process.exit(1);
  }
}

runAllTests();
