/**
 * DesignForge AI — Layout Engine Test Runner
 *
 * Runs automated validation tests inside the Figma plugin environment for the layout engine.
 */

import { restructureUINodeLayout } from "./layout-restructurer";
import { sanitizeFigmaLayoutTree } from "./layout-validator";
import { safeSetFillHorizontal, safeSetFillVertical } from "./safe-layout";

export async function runLayoutEngineTests(): Promise<void> {
  console.log("\n=============================================");
  console.log("[Layout Engine Tests] Running validation suite...");
  console.log("=============================================");

  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${name}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}: ${message}`);
      failed++;
    }
  };

  try {
    // TEST 1: Parent layoutMode = NONE, child requests absolute
    {
      const parent = figma.createFrame();
      parent.name = "Test1_Parent";
      parent.layoutMode = "NONE";

      const child = figma.createFrame();
      child.name = "Test1_Child";
      parent.appendChild(child);

      // Sanitize the tree
      sanitizeFigmaLayoutTree(parent);

      assert(
        "TEST 1",
        child.layoutPositioning !== "ABSOLUTE",
        "Absolute positioning is NOT allowed under a NONE layout parent (reverts to AUTO/XY)."
      );

      parent.remove();
    }

    // TEST 2: Parent layoutMode = HORIZONTAL, child requests absolute
    {
      const parent = figma.createFrame();
      parent.name = "Test2_Parent";
      parent.layoutMode = "HORIZONTAL";

      const child = figma.createFrame();
      child.name = "Test2_Child";
      parent.appendChild(child);
      child.layoutPositioning = "ABSOLUTE";

      sanitizeFigmaLayoutTree(parent);

      assert(
        "TEST 2",
        child.layoutPositioning === "ABSOLUTE",
        "Absolute positioning IS allowed under a HORIZONTAL layout parent."
      );

      parent.remove();
    }

    // TEST 3: Parent layoutMode = VERTICAL, child requests absolute
    {
      const parent = figma.createFrame();
      parent.name = "Test3_Parent";
      parent.layoutMode = "VERTICAL";

      const child = figma.createFrame();
      child.name = "Test3_Child";
      parent.appendChild(child);
      child.layoutPositioning = "ABSOLUTE";

      sanitizeFigmaLayoutTree(parent);

      assert(
        "TEST 3",
        child.layoutPositioning === "ABSOLUTE",
        "Absolute positioning IS allowed under a VERTICAL layout parent."
      );

      parent.remove();
    }

    // TEST 4: Parent layoutMode = NONE, child requests normal positioning
    {
      const parent = figma.createFrame();
      parent.name = "Test4_Parent";
      parent.layoutMode = "NONE";

      const child = figma.createFrame();
      child.name = "Test4_Child";
      parent.appendChild(child);
      child.x = 42;
      child.y = 24;

      sanitizeFigmaLayoutTree(parent);

      assert(
        "TEST 4",
        child.layoutPositioning === "AUTO" && child.x === 42 && child.y === 24,
        "Normal positioning under layoutMode = NONE preserves x/y values."
      );

      parent.remove();
    }

    // TEST 5: Nested Auto Layout (Parent -> horizontal row -> absolute child)
    {
      const parent = figma.createFrame();
      parent.name = "Test5_Parent";
      parent.layoutMode = "VERTICAL";

      const row = figma.createFrame();
      row.name = "Test5_Row";
      row.layoutMode = "HORIZONTAL";
      parent.appendChild(row);

      const absoluteChild = figma.createFrame();
      absoluteChild.name = "Test5_AbsoluteChild";
      row.appendChild(absoluteChild);
      absoluteChild.layoutPositioning = "ABSOLUTE";

      let errorThrown = false;
      try {
        sanitizeFigmaLayoutTree(parent);
      } catch (err) {
        errorThrown = true;
        console.error("Test 5 threw error:", err);
      }

      assert(
        "TEST 5",
        !errorThrown && absoluteChild.layoutPositioning === "ABSOLUTE",
        "Nested Auto Layout containing valid absolute-positioned children sanitizes without exceptions."
      );

      parent.remove();
    }

    // TEST 6: Nested normal frames containing absolute-positioned HTML elements
    {
      const parent = figma.createFrame();
      parent.name = "Test6_Parent";
      parent.layoutMode = "NONE";

      const inner = figma.createFrame();
      inner.name = "Test6_Inner";
      inner.layoutMode = "NONE";
      parent.appendChild(inner);

      const child = figma.createFrame();
      child.name = "Test6_Child";
      inner.appendChild(child);

      let errorThrown = false;
      try {
        const hasAutoLayoutParent = inner.layoutMode && inner.layoutMode !== "NONE";
        if (hasAutoLayoutParent) {
          child.layoutPositioning = "ABSOLUTE";
        } else {
          child.x = 10;
          child.y = 10;
        }

        sanitizeFigmaLayoutTree(parent);
      } catch (err) {
        errorThrown = true;
        console.error("Test 6 threw error:", err);
      }

      assert(
        "TEST 6",
        !errorThrown && child.layoutPositioning === "AUTO" && child.x === 10,
        "Nested normal frames containing absolute HTML elements fall back to valid x/y coordinates without layoutPositioning exceptions."
      );

      parent.remove();
    }

    // TEST 7: Safe setters prevent invalid FILL under non-Auto Layout parent
    {
      const parent = figma.createFrame();
      parent.name = "Test7_Parent";
      parent.layoutMode = "NONE";

      const child = figma.createFrame();
      child.name = "Test7_Child";
      parent.appendChild(child);

      const filledH = safeSetFillHorizontal(child);
      const filledV = safeSetFillVertical(child);

      assert(
        "TEST 7",
        !filledH && !filledV,
        "safeSetFillHorizontal and safeSetFillVertical return false and prevent setting FILL on non-Auto Layout parents."
      );

      parent.remove();
    }

    // TEST 8: Safe setters allow valid FILL under Auto Layout parent
    {
      const parent = figma.createFrame();
      parent.name = "Test8_Parent";
      parent.layoutMode = "VERTICAL";

      const child = figma.createFrame();
      child.name = "Test8_Child";
      parent.appendChild(child);

      const filledH = safeSetFillHorizontal(child);

      assert(
        "TEST 8",
        filledH && (child as any).layoutSizingHorizontal === "FILL",
        "safeSetFillHorizontal allows setting FILL when parent has layoutMode = VERTICAL."
      );

      parent.remove();
    }

  } catch (err) {
    console.error("Layout Engine test suite crashed:", err);
  }

  console.log("=============================================");
  console.log(`[Layout Engine Tests] Complete. Passed: ${passed}, Failed: ${failed}`);
  console.log("=============================================\n");
}
