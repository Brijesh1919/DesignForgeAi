file_path = "packages/plugin/src/shared/messages.ts"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

target1 = """  | {
      type: "EXECUTE_CREATE_CAROUSEL_COMPONENT";
      payload?: {
        requestId?: string;
        nodeId?: string;
        squareSize?: number;
      };
    };"""

replacement1 = """  | {
      type: "EXECUTE_CREATE_CAROUSEL_COMPONENT";
      payload?: {
        requestId?: string;
        nodeId?: string;
        squareSize?: number;
      };
    }
  | {
      type: "EXECUTE_CREATE_PRODUCT_LANDING_PAGE";
      payload?: {
        requestId?: string;
        nodeId?: string;
        startX?: number;
        startY?: number;
      };
    };"""

if target1 in text:
    text = text.replace(target1, replacement1, 1)
    print("UI MESSAGE ADDED")
else:
    print("TARGET 1 NOT FOUND")

target2 = """  | {
      type: "CREATE_CAROUSEL_COMPONENT_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        componentSetId?: string;
        instanceId?: string;
        squareSize?: number;
        slideCount?: number;
        details?: string[];
        error?: string;
      };
    }"""

replacement2 = """  | {
      type: "CREATE_CAROUSEL_COMPONENT_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        componentSetId?: string;
        instanceId?: string;
        squareSize?: number;
        slideCount?: number;
        details?: string[];
        error?: string;
      };
    }
  | {
      type: "PRODUCT_LANDING_PAGE_CREATED";
      payload: {
        requestId?: string;
        success: boolean;
        framesCount?: number;
        rootFrameId?: string;
        error?: string;
      };
    }"""

if target2 in text:
    text = text.replace(target2, replacement2, 1)
    print("PLUGIN MESSAGE ADDED")
else:
    print("TARGET 2 NOT FOUND")

with open(file_path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("MESSAGES UPDATED")
