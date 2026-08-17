DESIGNFORGE AI — PROTECTED DEVELOPMENT INSTRUCTIONS

IMPORTANT:
The existing DesignForge AI project contains working functionality that must NOT be unnecessarily modified.

GENERAL RULE:
Only change the specific functionality explicitly requested in my latest prompt.

DO NOT refactor, rewrite, replace, optimize, rename, restructure, or redesign unrelated working code.

PROTECTED AUTO LAYOUT FUNCTIONALITY:
The current "Auto Layout OFF / not selected" behavior is already working correctly.

When Auto Layout is NOT selected:
- Do not change its layout generation logic.
- Do not change its positioning logic.
- Do not change its sizing behavior.
- Do not change its existing Figma hierarchy behavior.
- Do not apply any new Auto Layout rules to this mode.
- Do not share new Auto Layout logic with this mode if it can change its current output.

This behavior must remain exactly as it currently works.

AUTO LAYOUT SELECTED MODE:
When I specifically ask to modify the Auto Layout functionality, ONLY modify the Auto Layout-selected path.

The Auto Layout-selected path should:
- Process the entire generated page recursively.
- Apply Auto Layout to all meaningful content/layout containers.
- Keep fixed visual elements fixed.
- Preserve pixel-perfect dimensions.
- Avoid unnecessary wrapper frames.
- Avoid repetitive/nested structures.
- Maintain a clean and simple Figma hierarchy.

IMPORTANT:
The "Auto Layout selected" and "Auto Layout not selected" paths must remain isolated.

Conceptually:

HTML/CSS
   ↓
Layout generation
   ├── Auto Layout OFF → EXISTING WORKING LOGIC (PROTECTED)
   │
   └── Auto Layout ON → MODIFIABLE AUTO LAYOUT LOGIC

Do NOT create changes that unintentionally affect the Auto Layout OFF path.

WHEN I REQUEST ANOTHER FEATURE:
If I ask for a feature unrelated to Auto Layout, do not modify the Auto Layout implementation unless technically required.

WHEN MODIFYING CODE:
1. Inspect the existing implementation first.
2. Identify the smallest files/functions that need modification.
3. Make the minimum necessary changes.
4. Preserve all existing working behavior.
5. Do not rewrite entire files unnecessarily.
6. Do not introduce duplicate layout systems.
7. Do not change UI unless explicitly requested.
8. Do not change API/provider architecture unless explicitly requested.
9. Do not change HTML/CSS parsing unless explicitly requested.
10. Do not change the Auto Layout OFF behavior.

REGRESSION PROTECTION:
Before finishing any change, verify that:
- Auto Layout OFF still behaves exactly as before.
- Existing HTML/CSS → Figma generation still works.
- Existing image → HTML/CSS → Figma generation still works.
- The requested change works only where intended.

If a requested change could affect protected functionality, STOP and clearly explain which existing code would be affected before making that change.

DO NOT ASSUME:
Do not assume that a cleaner architecture requires rewriting existing code.
Do not assume that existing working code needs refactoring.
Do not "improve" unrelated functionality without my request.

PRIORITY:
1. My latest explicit request
2. Preserve existing working functionality
3. Minimum code changes
4. No regressions