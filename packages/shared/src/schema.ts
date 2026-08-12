/**
 * DesignForge AI — Master UI Analysis Schema
 *
 * This is the single source of truth for the structured JSON
 * that the Vision AI must output and the Figma plugin must consume.
 * Every UI element, layout property, style, and token is defined here.
 */

import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────

export const ColorSchema = z.object({
  r: z.number().min(0).max(1).describe("Red channel 0-1"),
  g: z.number().min(0).max(1).describe("Green channel 0-1"),
  b: z.number().min(0).max(1).describe("Blue channel 0-1"),
  a: z.number().min(0).max(1).default(1).describe("Alpha channel 0-1"),
});

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6,8}$/)
  .describe("Hex color string e.g. #FF5733 or #FF573380");

export const BoundingBoxSchema = z.object({
  x: z.number().describe("X position in pixels from parent origin"),
  y: z.number().describe("Y position in pixels from parent origin"),
  width: z.number().min(0).describe("Width in pixels"),
  height: z.number().min(0).describe("Height in pixels"),
});

// ─── Layout ──────────────────────────────────────────────────

export const LayoutDirectionSchema = z.enum(["HORIZONTAL", "VERTICAL", "NONE"]);

export const SizingModeSchema = z.enum(["FIXED", "HUG", "FILL"]);

export const AlignmentSchema = z.enum([
  "TOP_LEFT",
  "TOP_CENTER",
  "TOP_RIGHT",
  "CENTER_LEFT",
  "CENTER",
  "CENTER_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_CENTER",
  "BOTTOM_RIGHT",
]);

export const LayoutPropsSchema = z.object({
  direction: LayoutDirectionSchema.describe(
    "Auto layout direction. HORIZONTAL = row, VERTICAL = column, NONE = absolute"
  ),
  primaryAxisSizing: SizingModeSchema.default("HUG").describe(
    "How the frame sizes along its primary axis"
  ),
  counterAxisSizing: SizingModeSchema.default("HUG").describe(
    "How the frame sizes along its counter axis"
  ),
  paddingTop: z.number().min(0).default(0),
  paddingRight: z.number().min(0).default(0),
  paddingBottom: z.number().min(0).default(0),
  paddingLeft: z.number().min(0).default(0),
  itemSpacing: z.number().min(0).default(0).describe("Gap between children"),
  alignment: AlignmentSchema.default("TOP_LEFT").describe(
    "Alignment of children within the frame"
  ),
  wrap: z.boolean().default(false).describe("Whether items wrap"),
});

export const ConstraintsSchema = z.object({
  horizontal: z
    .enum(["LEFT", "RIGHT", "LEFT_RIGHT", "CENTER", "SCALE"])
    .default("LEFT"),
  vertical: z
    .enum(["TOP", "BOTTOM", "TOP_BOTTOM", "CENTER", "SCALE"])
    .default("TOP"),
});

export const ChildLayoutSchema = z.object({
  layoutAlign: z
    .enum(["INHERIT", "STRETCH", "MIN", "CENTER", "MAX"])
    .default("INHERIT")
    .describe("How this child aligns in the parent auto layout cross axis"),
  layoutGrow: z
    .number()
    .min(0)
    .max(1)
    .default(0)
    .describe("0 = fixed/hug, 1 = fill container"),
});

// ─── Typography ──────────────────────────────────────────────

export const FontWeightSchema = z.enum([
  "Thin",
  "ExtraLight",
  "Light",
  "Regular",
  "Medium",
  "SemiBold",
  "Bold",
  "ExtraBold",
  "Black",
]);

export const TextAlignSchema = z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]);

export const TextCaseSchema = z.enum([
  "ORIGINAL",
  "UPPER",
  "LOWER",
  "TITLE",
  "SMALL_CAPS",
]);

export const TextDecorationSchema = z.enum([
  "NONE",
  "UNDERLINE",
  "STRIKETHROUGH",
]);

export const TextPropsSchema = z.object({
  content: z.string().describe("The actual text content"),
  fontFamily: z
    .string()
    .default("Inter")
    .describe("Font family name. Use closest Google Font if unknown"),
  fontWeight: FontWeightSchema.default("Regular"),
  fontSize: z.number().min(1).describe("Font size in pixels"),
  lineHeight: z
    .number()
    .optional()
    .describe("Line height in pixels. Omit for auto"),
  letterSpacing: z.number().default(0).describe("Letter spacing in pixels"),
  textAlign: TextAlignSchema.default("LEFT"),
  textCase: TextCaseSchema.default("ORIGINAL"),
  textDecoration: TextDecorationSchema.default("NONE"),
  color: HexColorSchema.describe("Text color as hex"),
  opacity: z.number().min(0).max(1).default(1),
  maxLines: z.number().optional().describe("Max lines before truncation"),
});

// ─── Fills, Strokes, Effects ─────────────────────────────────

export const SolidFillSchema = z.object({
  type: z.literal("SOLID"),
  color: HexColorSchema,
  opacity: z.number().min(0).max(1).default(1),
});

export const GradientStopSchema = z.object({
  position: z.number().min(0).max(1),
  color: HexColorSchema,
});

export const GradientFillSchema = z.object({
  type: z.enum(["LINEAR_GRADIENT", "RADIAL_GRADIENT"]),
  stops: z.array(GradientStopSchema).min(2),
  angle: z.number().default(0).describe("Angle in degrees for linear gradient"),
  opacity: z.number().min(0).max(1).default(1),
});

export const ImageFillSchema = z.object({
  type: z.literal("IMAGE"),
  imageRef: z
    .string()
    .describe("Reference key to an asset in the assets array"),
  scaleMode: z.enum(["FILL", "FIT", "CROP", "TILE"]).default("FILL"),
  opacity: z.number().min(0).max(1).default(1),
});

export const FillSchema = z.discriminatedUnion("type", [
  SolidFillSchema,
  GradientFillSchema,
  ImageFillSchema,
]);

export const StrokeSchema = z.object({
  color: HexColorSchema,
  weight: z.number().min(0).default(1),
  opacity: z.number().min(0).max(1).default(1),
  position: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).default("INSIDE"),
  dashPattern: z.array(z.number()).default([]),
});

export const ShadowEffectSchema = z.object({
  type: z.enum(["DROP_SHADOW", "INNER_SHADOW"]),
  color: HexColorSchema,
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  blur: z.number().min(0).default(0),
  spread: z.number().default(0),
  opacity: z.number().min(0).max(1).default(0.25),
});

export const BlurEffectSchema = z.object({
  type: z.literal("LAYER_BLUR"),
  radius: z.number().min(0),
});

export const BackgroundBlurEffectSchema = z.object({
  type: z.literal("BACKGROUND_BLUR"),
  radius: z.number().min(0),
});

export const EffectSchema = z.discriminatedUnion("type", [
  ShadowEffectSchema,
  BlurEffectSchema,
  BackgroundBlurEffectSchema,
]);

// ─── Style Properties ────────────────────────────────────────

export const StylePropsSchema = z.object({
  fills: z.array(FillSchema).default([]).describe("Background fills"),
  strokes: z.array(StrokeSchema).default([]).describe("Border strokes"),
  effects: z.array(EffectSchema).default([]).describe("Shadows, blurs"),
  cornerRadius: z
    .union([
      z.number().min(0),
      z.object({
        topLeft: z.number().min(0),
        topRight: z.number().min(0),
        bottomRight: z.number().min(0),
        bottomLeft: z.number().min(0),
      }),
    ])
    .default(0)
    .describe("Corner radius — uniform number or per-corner object"),
  opacity: z.number().min(0).max(1).default(1),
  clipsContent: z
    .boolean()
    .default(true)
    .describe("Whether the frame clips overflowing children"),
  visible: z.boolean().default(true),
});

// ─── Node Types ──────────────────────────────────────────────

export const NodeTypeSchema = z.enum([
  "FRAME",
  "TEXT",
  "RECTANGLE",
  "ELLIPSE",
  "LINE",
  "IMAGE",
  "ICON",
  "COMPONENT_INSTANCE",
  "GROUP",
  "VECTOR",
]);

// ─── UI Node (Recursive Tree) ────────────────────────────────

export interface UINode {
  type: z.infer<typeof NodeTypeSchema>;
  name: string;
  bounds: z.infer<typeof BoundingBoxSchema>;
  layout: z.infer<typeof LayoutPropsSchema>;
  childLayout: z.infer<typeof ChildLayoutSchema>;
  constraints: z.infer<typeof ConstraintsSchema>;
  style: z.infer<typeof StylePropsSchema>;
  text?: z.infer<typeof TextPropsSchema>;
  componentRef?: string;
  imageRef?: string;
  svgContent?: string;
  iconName?: string;
  role?: string;
  confidence?: number;
  children?: UINode[];
}

export const UINodeSchema: z.ZodType<UINode, z.ZodTypeDef, any> = z.lazy(() =>
  z.object({
    type: NodeTypeSchema,
    name: z
      .string()
      .describe(
        "Semantic layer name like 'Header', 'Product Card', 'Primary Button'. NEVER use 'Frame 1' or 'Rectangle 42'"
      ),
    bounds: BoundingBoxSchema.describe(
      "Absolute bounding box for fallback positioning"
    ),
    layout: LayoutPropsSchema.default({
      direction: "NONE",
      primaryAxisSizing: "HUG",
      counterAxisSizing: "HUG",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      itemSpacing: 0,
      alignment: "TOP_LEFT",
      wrap: false,
    }).describe(
      "Auto Layout properties. Set direction to HORIZONTAL or VERTICAL whenever children form a stack"
    ),
    childLayout: ChildLayoutSchema.default({
      layoutAlign: "INHERIT",
      layoutGrow: 0,
    }).describe(
      "How this node behaves as a child of an auto layout parent"
    ),
    constraints: ConstraintsSchema.default({
      horizontal: "LEFT",
      vertical: "TOP",
    }).describe("Resize constraints"),
    style: StylePropsSchema.default({
      fills: [],
      strokes: [],
      effects: [],
      cornerRadius: 0,
      opacity: 1,
      clipsContent: true,
      visible: true,
    }),
    text: TextPropsSchema.optional().describe(
      "Text properties — only for TEXT type nodes"
    ),
    componentRef: z
      .string()
      .optional()
      .describe(
        "Reference to a component definition ID if this is an instance"
      ),
    imageRef: z
      .string()
      .optional()
      .describe(
        "Reference key to an extracted image asset"
      ),
    iconName: z
      .string()
      .optional()
      .describe("Icon identifier if this is a detected icon"),
    role: z
      .string()
      .optional()
      .describe("Semantic role e.g. 'button', 'heading', 'input', 'card'"),
    confidence: z
      .number()
      .optional()
      .default(1.0)
      .describe("Confidence score (0-1)"),
    children: z.array(z.lazy(() => UINodeSchema)).optional().describe(
      "Nested child nodes. Order matters — first child is topmost in auto layout"
    ),
  })
);

// ─── Component Definitions ───────────────────────────────────

export const ComponentDefinitionSchema = z.object({
  id: z.string().describe("Unique component ID for cross-referencing"),
  name: z.string().describe("Component name e.g. 'Product Card', 'CTA Button'"),
  category: z
    .enum([
      "button",
      "card",
      "input",
      "badge",
      "tag",
      "navigation",
      "avatar",
      "list-item",
      "icon",
      "chip",
      "toggle",
      "tab",
      "modal",
      "toast",
      "other",
    ])
    .describe("Component category"),
  instanceCount: z
    .number()
    .min(1)
    .describe("Number of instances found in the design"),
  template: UINodeSchema.describe(
    "The canonical component structure — used to create the Figma Component"
  ),
});

// ─── Asset Regions ───────────────────────────────────────────

export const AssetRegionSchema = z.object({
  id: z.string().describe("Unique asset ID for cross-referencing via imageRef"),
  name: z.string().describe("Descriptive name e.g. 'Hero Banner', 'User Avatar'"),
  category: z.enum([
    "photo",
    "illustration",
    "logo",
    "icon",
    "avatar",
    "product",
    "banner",
    "chart",
    "background",
    "other",
  ]),
  bounds: BoundingBoxSchema.describe(
    "Bounding box within the original screenshot to crop"
  ),
  base64: z
    .string()
    .optional()
    .describe("Base64-encoded image data (populated after extraction)"),
});

// ─── Design Tokens ───────────────────────────────────────────

export const ColorTokenSchema = z.object({
  name: z
    .string()
    .describe(
      "Token name following system convention: primary, primary-hover, surface, text-primary, etc."
    ),
  value: HexColorSchema,
  category: z.enum([
    "primary",
    "secondary",
    "accent",
    "neutral",
    "success",
    "warning",
    "error",
    "info",
    "surface",
    "background",
    "text",
    "border",
    "overlay",
    "other",
  ]),
});

export const TextStyleTokenSchema = z.object({
  name: z
    .string()
    .describe(
      "Style name: Display, Heading 1, Heading 2, Subheading, Body, Body Small, Caption, Button, Overline, Code"
    ),
  fontFamily: z.string(),
  fontWeight: FontWeightSchema,
  fontSize: z.number(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().default(0),
});

export const ShadowTokenSchema = z.object({
  name: z.string().describe("e.g. Elevation/1, Elevation/2, Elevation/3"),
  effect: ShadowEffectSchema,
});

// ─── Grid ────────────────────────────────────────────────────

export const GridLayoutSchema = z.object({
  columns: z.number().min(1).default(12),
  gutterSize: z.number().min(0).default(20),
  marginLeft: z.number().min(0).default(0),
  marginRight: z.number().min(0).default(0),
  alignment: z.enum(["STRETCH", "CENTER", "MIN", "MAX"]).default("STRETCH"),
});

// ─── Master Analysis Result ──────────────────────────────────

export const DesignAnalysisSchema = z.object({
  metadata: z.object({
    sourceWidth: z.number().describe("Original screenshot width in pixels"),
    sourceHeight: z.number().describe("Original screenshot height in pixels"),
    deviceType: z
      .enum(["mobile", "tablet", "desktop", "unknown"])
      .describe("Detected device type"),
    platform: z
      .enum(["ios", "android", "web", "unknown"])
      .describe("Detected platform"),
    pageName: z
      .string()
      .describe("Inferred page name e.g. 'Home', 'Login', 'Dashboard'"),
  }),

  rootFrame: UINodeSchema.describe("The root frame of the design — contains all UI"),

  components: z
    .array(ComponentDefinitionSchema)
    .default([])
    .describe("Detected reusable component definitions"),

  assets: z
    .array(AssetRegionSchema)
    .default([])
    .describe("Image regions to extract from the screenshot"),

  colorTokens: z
    .array(ColorTokenSchema)
    .default([])
    .describe("Extracted color palette as design tokens"),

  textStyles: z
    .array(TextStyleTokenSchema)
    .default([])
    .describe("Extracted typography system"),

  shadowTokens: z
    .array(ShadowTokenSchema)
    .default([])
    .describe("Extracted shadow/elevation tokens"),

  spacingScale: z
    .array(z.number())
    .default([4, 8, 12, 16, 24, 32, 48, 64])
    .describe("Inferred spacing scale e.g. [4, 8, 12, 16, 24, 32, 48, 64]"),

  radiusScale: z
    .array(z.number())
    .default([4, 8, 12, 16, 24, 32])
    .describe("Inferred border radius scale e.g. [4, 8, 12, 16, 24, 32]"),

  grid: GridLayoutSchema.optional().describe(
    "Detected layout grid (if applicable)"
  ),
});

// ─── Type Exports ────────────────────────────────────────────

export type Color = z.infer<typeof ColorSchema>;
export type HexColor = z.infer<typeof HexColorSchema>;
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type LayoutDirection = z.infer<typeof LayoutDirectionSchema>;
export type SizingMode = z.infer<typeof SizingModeSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type LayoutProps = z.infer<typeof LayoutPropsSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type ChildLayout = z.infer<typeof ChildLayoutSchema>;
export type FontWeight = z.infer<typeof FontWeightSchema>;
export type TextAlign = z.infer<typeof TextAlignSchema>;
export type TextCase = z.infer<typeof TextCaseSchema>;
export type TextDecoration = z.infer<typeof TextDecorationSchema>;
export type TextProps = z.infer<typeof TextPropsSchema>;
export type SolidFill = z.infer<typeof SolidFillSchema>;
export type GradientStop = z.infer<typeof GradientStopSchema>;
export type GradientFill = z.infer<typeof GradientFillSchema>;
export type ImageFill = z.infer<typeof ImageFillSchema>;
export type Fill = z.infer<typeof FillSchema>;
export type Stroke = z.infer<typeof StrokeSchema>;
export type ShadowEffect = z.infer<typeof ShadowEffectSchema>;
export type BlurEffect = z.infer<typeof BlurEffectSchema>;
export type BackgroundBlurEffect = z.infer<typeof BackgroundBlurEffectSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type StyleProps = z.infer<typeof StylePropsSchema>;
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;
export type AssetRegion = z.infer<typeof AssetRegionSchema>;
export type ColorToken = z.infer<typeof ColorTokenSchema>;
export type TextStyleToken = z.infer<typeof TextStyleTokenSchema>;
export type ShadowToken = z.infer<typeof ShadowTokenSchema>;
export type GridLayout = z.infer<typeof GridLayoutSchema>;
export type DesignAnalysis = z.infer<typeof DesignAnalysisSchema>;
