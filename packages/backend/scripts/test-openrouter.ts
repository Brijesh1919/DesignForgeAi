import { OpenRouterVisionProvider } from "../src/services/vision/openrouter-provider.js";
import dotenv from "dotenv";

dotenv.config();

async function testModel(client: OpenRouterVisionProvider, modelName: string): Promise<boolean> {
  console.log(`\nTesting generateContent() with model "${modelName}"...`);
  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: "Hello, reply with only the word SUCCESS",
    });
    console.log(`✅ generateContent() succeeded! Response: "${response.text?.trim()}"`);
    return true;
  } catch (err: any) {
    console.error(`❌ generateContent() failed for model "${modelName}":`);
    console.error(`- Message: ${err.message}`);
    console.error(`- Status Code: ${err.status || err.statusCode || "unknown"}`);
    if (err.error) {
      console.error(`- Error details:`, JSON.stringify(err.error, null, 2));
    }
    if (err.cause) {
      console.error(`- Cause:`, err.cause);
    }
    return false;
  }
}

async function main() {
  console.log("==================================================");
  console.log("   DesignForge AI — OpenRouter Standalone Diagnostics");
  console.log("==================================================");
  console.log(`Configured Model (env):  ${process.env.OPENROUTER_MODEL || "not set"}`);
  console.log(`API Key (env):           ${process.env.OPENROUTER_API_KEY ? "PRESENT (hidden)" : "MISSING"}`);
  console.log(`AI Provider (env):       ${process.env.AI_PROVIDER || "not set"}`);
  console.log("==================================================");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: OPENROUTER_API_KEY is not defined in the environment.");
    process.exit(1);
  }

  // Initialize client
  console.log("Initializing OpenRouterVisionProvider client...");
  const client = new OpenRouterVisionProvider({ apiKey });

  // List available models
  console.log("\nListing available models from OpenRouter...");
  let availableModels: string[] = [];
  try {
    const response: any = await client.models.list();
    const rawList = response.models || response.pageInternal || [];
    availableModels = rawList.map((m: any) => m.name);
    console.log(`Found ${availableModels.length} models.`);
    console.log("First 15 models:");
    availableModels.slice(0, 15).forEach((m) => console.log(`- ${m}`));
  } catch (err: any) {
    console.error("❌ Failed to list models:", err.message);
  }

  // Check if configured model exists
  const configuredModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  const modelExists = availableModels.includes(configuredModel);
  if (modelExists) {
    console.log(`\n✓ Configured model "${configuredModel}" is present in available models list.`);
  } else {
    console.log(`\n⚠️ Warning: Configured model "${configuredModel}" was NOT found in available models list.`);
  }

  // Test generateContent for multiple models
  const testModels = [
    configuredModel,
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.2-11b-vision-instruct",
  ].filter((value, index, self) => self.indexOf(value) === index); // unique values

  const results: Record<string, boolean> = {};
  for (const model of testModels) {
    results[model] = await testModel(client, model);
    // Sleep 1 second
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n==================================================");
  console.log("               Diagnostic Summary");
  console.log("==================================================");
  console.log(`API key:      ${apiKey ? "Valid format" : "Invalid"}`);
  for (const model of testModels) {
    console.log(`Model "${model}": ${results[model] ? "✅ WORKING" : "❌ FAILED"}`);
  }
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Fatal diagnostic error:", err);
  process.exit(1);
});
