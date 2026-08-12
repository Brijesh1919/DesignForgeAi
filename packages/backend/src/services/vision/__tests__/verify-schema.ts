/**
 * Standalone verification script for the OpenRouter schema compatibility.
 */

import { getAnalysisResponseSchema, validateJSONSchemaKeywords } from "../openrouter-schema.js";

function runVerification() {
  console.log("[Verification] Generating OpenRouter response schema...");
  const schema = getAnalysisResponseSchema();
  
  if (!schema) {
    throw new Error("Schema is undefined");
  }
  
  if (schema.type !== "object") {
    throw new Error(`Expected root schema type to be 'object', got '${schema.type}'`);
  }

  console.log("[Verification] Running strict validateJSONSchemaKeywords check...");
  validateJSONSchemaKeywords(schema);

  console.log("[Verification] Checking for forbidden draft keywords in JSON representation...");
  const schemaStr = JSON.stringify(schema);
  
  const forbidden = [
    '"$ref"',
    '"const"',
    '"$defs"',
    '"definitions"',
    '"$id"',
    '"$schema"'
  ];

  for (const keyword of forbidden) {
    if (schemaStr.includes(keyword)) {
      throw new Error(`Forbidden keyword found: ${keyword}`);
    }
  }

  console.log("[Verification] ✅ OpenRouter Response Schema verification passed successfully! Zero occurrences of forbidden keywords.");
}

try {
  runVerification();
  process.exit(0);
} catch (err) {
  console.error("[Verification] ❌ Verification failed:", err);
  process.exit(1);
}
