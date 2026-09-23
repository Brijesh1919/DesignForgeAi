import sys

file_path = "packages/plugin/src/plugin/controller.ts"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add import
import_target = 'import { generateCodeFromFigmaNode } from "./generators/figma-to-code";'
import_replacement = 'import { generateCodeFromFigmaNode } from "./generators/figma-to-code";\nimport { generateProductStoryLanding } from "./generators/product-story-landing";'

if import_target in text:
    text = text.replace(import_target, import_replacement, 1)
    print("IMPORT ADDED")
else:
    print("IMPORT TARGET NOT FOUND")

# 2. Add case to switch
case_target = """    case "EXECUTE_CREATE_CAROUSEL_COMPONENT":
      await handleCreateCarouselComponent(msg.payload);
      break;"""

case_replacement = """    case "EXECUTE_CREATE_CAROUSEL_COMPONENT":
      await handleCreateCarouselComponent(msg.payload);
      break;

    case "EXECUTE_CREATE_PRODUCT_LANDING_PAGE":
      await handleCreateProductLandingPage(msg.payload);
      break;"""

if case_target in text:
    text = text.replace(case_target, case_replacement, 1)
    print("CASE ADDED")
else:
    print("CASE TARGET NOT FOUND")

# 3. Add handler function before EOF
handler_code = """
async function handleCreateProductLandingPage(payload: any = {}): Promise<void> {
  try {
    const result = await generateProductStoryLanding({
      sourceNodeId: payload.nodeId,
      startX: payload.startX,
      startY: payload.startY,
    });
    figma.ui.postMessage({
      type: "PRODUCT_LANDING_PAGE_CREATED",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        framesCount: result.framesCount,
        rootFrameId: result.rootFrameId,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to create product landing page:", err);
    figma.ui.postMessage({
      type: "PRODUCT_LANDING_PAGE_CREATED",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to create product landing page",
      },
    });
  }
}
"""

text = text + handler_code

with open(file_path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("CONTROLLER UPDATED")
