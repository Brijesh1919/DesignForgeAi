/**
 * DesignForge AI — OpenRouter JSON Schema Utility
 *
 * Transforms standard Zod/JSON Schemas into clean, flat, and consistent Schemas,
 * resolving recursive references, cleaning up drafts metadata, transforming consts,
 * flattening unions, and validating structural properties mismatch.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { DesignAnalysisSchema } from "@designforge/shared";

// List of forbidden draft/metadata keywords in standard LLM JSON Schema integrations
const FORBIDDEN_KEYWORDS = [
  "$ref",
  "const",
  "$defs",
  "definitions",
  "id",
  "$id",
  "$schema",
];

/**
 * Resolves a JSON reference path against the root schema.
 * Example: "#/properties/rootFrame/properties/children/items"
 */
function resolvePath(root: any, ref: string): any {
  if (ref === "#") {
    return root;
  }
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported ref format: ${ref}`);
  }
  const parts = ref.substring(2).split("/");
  let current = root;
  for (const part of parts) {
    if (current === undefined || current === null) {
      throw new Error(`Could not resolve ref path: ${ref} at part ${part}`);
    }
    const key = decodeURIComponent(part.replace(/~1/g, "/").replace(/~0/g, "~"));
    current = current[key];
  }
  return current;
}

/**
 * Combines two subschema properties when merging objects (e.g. for type enums or objects).
 */
function mergePropertySchemas(schemaA: any, schemaB: any): any {
  const enumA = schemaA.enum || (schemaA.const !== undefined ? [schemaA.const] : undefined);
  const enumB = schemaB.enum || (schemaB.const !== undefined ? [schemaB.const] : undefined);

  if (enumA && enumB) {
    return {
      type: schemaA.type || "string",
      enum: Array.from(new Set([...enumA, ...enumB])),
    };
  }
  if (enumA) {
    return { ...schemaA, enum: enumA };
  }
  if (enumB) {
    return { ...schemaB, enum: enumB };
  }
  if (schemaA.type === "object" && schemaB.type === "object") {
    return mergeSchemas([schemaA, schemaB]);
  }
  return schemaA;
}

/**
 * Flattens and merges multiple object or primitive schemas into a single schema.
 */
function mergeSchemas(schemas: any[]): any {
  const objects = schemas.filter(
    (s) => s.type === "object" || s.properties !== undefined
  );

  if (objects.length > 0) {
    const mergedProps: Record<string, any> = {};
    const allRequired: string[][] = [];

    for (const obj of objects) {
      if (obj.properties) {
        for (const [key, prop] of Object.entries(obj.properties)) {
          if (mergedProps[key]) {
            mergedProps[key] = mergePropertySchemas(mergedProps[key], prop);
          } else {
            mergedProps[key] = prop;
          }
        }
      }
      if (Array.isArray(obj.required)) {
        allRequired.push(obj.required);
      }
    }

    // A field is required only if it is required by ALL subschemas of the union
    let required: string[] = [];
    if (allRequired.length === objects.length && allRequired.length > 0) {
      const firstRequired = allRequired[0] || [];
      required = firstRequired.filter((field) =>
        allRequired.every((reqList) => reqList.includes(field))
      );
    }

    const result: any = {
      type: "object",
      properties: mergedProps,
      additionalProperties: false,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  const primitives = schemas.filter((s) => s.type && s.type !== "null");
  if (primitives.length > 0) {
    return primitives[0];
  }

  return schemas[0] || { type: "object" };
}

/**
 * Recursively processes the JSON Schema to inline refs, convert const to enum,
 * flatten anyOf/oneOf/allOf unions, and remove draft/unsupported fields.
 */
export function transformSchema(
  schema: any,
  root: any,
  activeRefs: Record<string, number> = {},
  depthLimit = 4,
  isPropertiesMap = false
): any {
  if (schema === null || typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) =>
      transformSchema(item, root, { ...activeRefs }, depthLimit, isPropertiesMap)
    );
  }

  // 1. Handle $ref (inline definitions and handle circular reference recursion limits)
  if (schema.$ref !== undefined) {
    const ref = schema.$ref;
    const currentCount = activeRefs[ref] || 0;
    if (currentCount >= depthLimit) {
      // Cut off recursion: return a leaf UINode schema without children property
      return {
        type: "object",
        description: "Recursive limit reached",
        properties: {
          type: { type: "string" },
          name: { type: "string" },
        },
      };
    }

    const resolved = resolvePath(root, ref);
    const nextActiveRefs = { ...activeRefs, [ref]: currentCount + 1 };
    const inlined = transformSchema(resolved, root, nextActiveRefs, depthLimit, isPropertiesMap);
    const { $ref, ...rest } = schema;
    
    // Process the merged result recursively to resolve any internal nested refs/consts
    return transformSchema(
      { ...inlined, ...rest },
      root,
      nextActiveRefs,
      depthLimit,
      isPropertiesMap
    );
  }

  // 2. Convert const value to single-item enum
  if (schema.const !== undefined) {
    const val = schema.const;
    const { const: _, ...rest } = schema;
    return {
      ...rest,
      enum: [val],
    };
  }

  // 3. Handle anyOf / oneOf / allOf unions by merging them into flat schemas
  if (schema.anyOf !== undefined || schema.oneOf !== undefined) {
    const union = schema.anyOf || schema.oneOf;
    const transformedUnion = union.map((s: any) =>
      transformSchema(s, root, { ...activeRefs }, depthLimit, isPropertiesMap)
    );
    const { anyOf, oneOf, ...rest } = schema;
    const merged = mergeSchemas(transformedUnion);
    return transformSchema(
      { ...merged, ...rest },
      root,
      { ...activeRefs },
      depthLimit,
      isPropertiesMap
    );
  }

  if (schema.allOf !== undefined) {
    const union = schema.allOf;
    const transformedUnion = union.map((s: any) =>
      transformSchema(s, root, { ...activeRefs }, depthLimit, isPropertiesMap)
    );
    const { allOf, ...rest } = schema;
    const merged = mergeSchemas(transformedUnion);
    return transformSchema(
      { ...merged, ...rest },
      root,
      { ...activeRefs },
      depthLimit,
      isPropertiesMap
    );
  }

  // 4. Recurse into standard property blocks
  const result: any = {};
  for (const [key, value] of Object.entries(schema)) {
    if (FORBIDDEN_KEYWORDS.includes(key) && !isPropertiesMap) {
      continue;
    }
    result[key] = transformSchema(
      value,
      root,
      { ...activeRefs },
      depthLimit,
      key === "properties"
    );
  }

  return result;
}

interface ValidationError {
  path: string;
  required: string[];
  properties: string[];
  missing: string[];
}

/**
 * Traverses the schema and syncs required arrays with actual properties.
 */
export function cleanRequiredProperties(schema: any): any {
  if (schema === null || typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(cleanRequiredProperties);
  }

  const result: any = {};
  for (const [key, val] of Object.entries(schema)) {
    result[key] = cleanRequiredProperties(val);
  }

  if (result.properties !== undefined && result.required !== undefined) {
    const propKeys = Object.keys(result.properties);
    if (Array.isArray(result.required)) {
      result.required = result.required.filter((k: string) => propKeys.includes(k));
      if (result.required.length === 0) {
        delete result.required;
      }
    }
  }

  return result;
}

/**
 * Recursively validates that all required property fields actually exist inside properties definitions.
 */
export function validateSchemaStructure(
  schema: any,
  pathStr = "root",
  errors: ValidationError[] = []
): ValidationError[] {
  if (schema === null || typeof schema !== "object") {
    return errors;
  }

  for (const key of Object.keys(schema)) {
    if (key !== "properties" && key !== "required" && key !== "items") {
      validateSchemaStructure(schema[key], `${pathStr}.${key}`, errors);
    }
  }

  if (schema.type === "array" && schema.items) {
    validateSchemaStructure(schema.items, `${pathStr}.items`, errors);
  }

  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      errors.push({
        path: pathStr,
        required: [String(schema.required)],
        properties: schema.properties ? Object.keys(schema.properties) : [],
        missing: ["required is not an array"],
      });
    } else {
      const propKeys = schema.properties ? Object.keys(schema.properties) : [];
      const missing = schema.required.filter((k: string) => !propKeys.includes(k));
      
      if (missing.length > 0) {
        errors.push({
          path: pathStr,
          required: schema.required,
          properties: propKeys,
          missing: missing,
        });
      }
    }
  }

  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      validateSchemaStructure(prop, `${pathStr}.properties.${key}`, errors);
    }
  }

  return errors;
}

/**
 * Validates that the generated schema contains zero occurrences of forbidden draft/metadata keywords.
 */
export function validateJSONSchemaKeywords(schema: any, pathStr = "root", isPropertiesMap = false): void {
  if (schema === null || typeof schema !== "object") {
    return;
  }

  for (const key of Object.keys(schema)) {
    if (!isPropertiesMap && FORBIDDEN_KEYWORDS.includes(key)) {
      throw new Error(
        `JSON schema validation failed: Forbidden keyword "${key}" found at path "${pathStr}/${key}"`
      );
    }
    validateJSONSchemaKeywords(schema[key], `${pathStr}/${key}`, key === "properties");
  }
}

/**
 * Recursively removes all validation keywords that OpenRouter's model schema validators might reject.
 */
export function stripValidationKeywords(schema: any): any {
  if (schema === null || typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(stripValidationKeywords);
  }

  const forbidden = [
    "default",
    "minimum",
    "maximum",
    "pattern",
    "format",
    "minLength",
    "maxLength",
    "additionalProperties"
  ];

  const result: any = {};
  for (const key of Object.keys(schema)) {
    if (forbidden.includes(key)) {
      continue;
    }
    result[key] = stripValidationKeywords(schema[key]);
  }

  return result;
}

/**
 * Generates the clean response schema for the DesignAnalysis Zod Schema.
 */
export function getAnalysisResponseSchema(): any {
  const rawSchema = zodToJsonSchema(DesignAnalysisSchema) as any;
  const transformed = transformSchema(rawSchema, rawSchema);
  
  // Clean up required properties mismatch
  const processed = cleanRequiredProperties(transformed);

  // Strip validation keywords that cause compatibility issues
  const cleanSchema = stripValidationKeywords(processed);
  
  // Run verification checks
  validateJSONSchemaKeywords(cleanSchema);

  const structuralErrors = validateSchemaStructure(cleanSchema);
  if (structuralErrors.length > 0) {
    const errorMsg = structuralErrors.map(e => 
      `Path: ${e.path}\nRequired: ${JSON.stringify(e.required)}\nProperties: ${JSON.stringify(e.properties)}\nMissing: ${e.missing.join(", ")}`
    ).join("\n\n");
    throw new Error(`Schema validation failed:\n\n${errorMsg}`);
  }
  
  return cleanSchema;
}
