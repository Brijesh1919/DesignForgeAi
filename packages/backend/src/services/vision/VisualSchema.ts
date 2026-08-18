/**
 * DesignForge AI — High-Fidelity Visual JSON Schema
 *
 * Defines the structured JSON returned by OpenRouter Vision API.
 * The vision model ONLY outputs this structured JSON schema.
 *
 * Pipeline: Screenshot → OpenRouter Vision → VisualDocument → Deterministic HTML/CSS → DOM Extractor → Figma Generator
 *
 * Schema Version: v7-visual-reconstruction
 */

/** Supported visual element types */
export type VisualElementType =
  | "page"
  | "section"
  | "container"
  | "frame"
  | "text"
  | "heading"
  | "paragraph"
  | "rectangle"
  | "image"
  | "icon"
  | "svg"
  | "line"
  | "button"
  | "input"
  | "link"
  | "card"
  | "divider"
  | "pill"
  | "navigation"
  | "list"
  | "menu"
  | "menu-item"
  | "badge"
  | "avatar"
  | "header"
  | "navbar"
  | "sidebar"
  | "footer"
  | "row"
  | "column"
  | "grid"
  | "table"
  | "label"
  | "logo"
  | "decorative"
  | "unknown";

import { z } from "zod";

export const ALLOWED_VISUAL_ELEMENT_TYPES = [
  "frame",
  "container",
  "section",
  "header",
  "navbar",
  "sidebar",
  "footer",
  "navigation",
  "row",
  "column",
  "grid",
  "table",
  "menu-item",
  "text",
  "heading",
  "paragraph",
  "label",
  "button",
  "icon",
  "image",
  "avatar",
  "input",
  "card",
  "divider",
  "badge",
  "pill",
  "link",
  "logo",
  "decorative",
] as const;

export const VisualElementTypeZod = z.enum(ALLOWED_VISUAL_ELEMENT_TYPES);

export const VALID_ELEMENT_TYPES: ReadonlySet<string> = new Set<string>(ALLOWED_VISUAL_ELEMENT_TYPES);

export const VisualElementZodSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    type: VisualElementTypeZod,
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    bbox: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    text: z.string().optional(),
    content: z.string().optional(),
    fontSize: z.number().optional(),
    fontWeight: z.number().optional(),
    lineHeight: z.union([z.number(), z.string()]).optional(),
    letterSpacing: z.union([z.number(), z.string()]).optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    background: z.string().optional(),
    borderColor: z.string().optional(),
    borderWidth: z.union([z.number(), z.string()]).optional(),
    borderRadius: z.number().optional(),
    shadow: z.string().optional(),
    boxShadow: z.string().optional(),
    textAlign: z.string().optional(),
    iconName: z.string().optional(),
    iconType: z.string().optional(),
    imageDescription: z.string().optional(),
    style: z.record(z.any()).optional(),
    children: z.array(z.lazy(() => VisualElementZodSchema)).optional(),
  })
);

export const VisualDocumentZodSchema = z.object({
  canvas: z.object({
    width: z.number(),
    height: z.number(),
    backgroundColor: z.string().optional(),
    background: z.string().optional(),
  }),
  elements: z.array(VisualElementZodSchema),
});

/** Layout modes for containers */
export type ContainerLayoutMode =
  | "ROW"
  | "COLUMN"
  | "GRID"
  | "TWO_COLUMN"
  | "THREE_COLUMN"
  | "FOUR_COLUMN"
  | "CENTER"
  | "STACK"
  | "ABSOLUTE"
  | "OVERLAY";

/** Canvas / Viewport dimensions extracted from screenshot */
export interface VisualCanvas {
  width: number;
  height: number;
  background?: string;
  backgroundColor?: string;
}

export type VisualViewport = VisualCanvas;

/** Global visual context */
export interface VisualGlobal {
  background?: string;       // e.g. "#FFFFFF" or "#0F172A"
  color?: string;            // primary text color
  fontFamily?: string;
  layoutDirection?: "row" | "column";
  deviceType?: "mobile" | "tablet" | "desktop" | "unknown";
}

/** Measured geometric bounding box */
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Measured visual styling */
export interface ElementStyle {
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  background?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number | string;
  borderRadius?: number;
  border?: string;
  boxShadow?: string;
  shadow?: string;
  opacity?: number;
  padding?: number | string;
  margin?: number | string;
  gap?: number;
}

/** Explicit layout properties */
export interface VisualLayoutProps {
  display?: "flex" | "grid" | "block" | "inline-block";
  flexDirection?: "row" | "column";
  gap?: number;
  alignItems?: "flex-start" | "flex-end" | "center" | "stretch";
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around";
}

/** Observed color representation */
export interface ObservedColor {
  value: string;
  confidence?: number;
}

/** A single visually identified element with exact measured geometry */
export interface VisualElement {
  id?: string;
  type: VisualElementType;
  role?: string;             // semantic descriptor e.g. "hero-left", "card-title", "logo-text"
  content?: string;          // text content alias
  text?: string;             // exact visible text content
  bbox?: ElementBounds;      // measured geometry { x, y, width, height }
  bounds?: ElementBounds;    // alias for bbox
  x?: number;                // flat coordinate alias
  y?: number;                // flat coordinate alias
  width?: number;            // flat coordinate alias
  height?: number;           // flat coordinate alias
  layout?: ContainerLayoutMode | VisualLayoutProps; // container layout relationship
  style?: ElementStyle;      // measured styles
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  color?: string;
  textColor?: string;
  background?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number | string;
  borderRadius?: number;
  border?: string;
  boxShadow?: string;
  shadow?: string;
  opacity?: number;
  padding?: number | string;
  margin?: number | string;
  gap?: number;
  isIcon?: boolean;
  iconType?: string;         // e.g. "dashboard", "users", "marketing", "content", "cart", "settings", "chevron-right"
  iconName?: string;         // alias for iconType
  iconColor?: string;
  isImage?: boolean;
  imageRole?: "IMAGE" | "LOGO" | "ICON" | "ILLUSTRATION" | "BACKGROUND_IMAGE" | "DECORATION";
  imageDescription?: string;
  objectFit?: "cover" | "contain" | "fill";
  state?: "active" | "inactive" | "disabled" | "hover" | "default";
  isActive?: boolean;
  rightIcon?: string;        // optional trailing icon e.g. "chevron-right"
  badge?: { text: string; color?: string; background?: string };
  children?: VisualElement[];
}

/** Root document returned by the visual analyzer */
export interface VisualDocument {
  canvas?: VisualCanvas;
  viewport?: VisualViewport;
  global?: VisualGlobal;
  elements: VisualElement[];
}

/** Output contract metadata */
export interface VisualMetadata {
  width: number;
  height: number;
  elementCount: number;
  textCount: number;
  imageCount: number;
  iconCount: number;
  sectionCount: number;
}

/** Output contract fidelity status */
export interface FidelityReport {
  contentComplete: boolean;
  geometryValidated: boolean;
  renderValidated: boolean;
  missingElements: string[];
}

/** Version strings for cache invalidation */
export const VISUAL_SCHEMA_VERSION = "v7-visual-reconstruction";
export const GENERATOR_VERSION = "v7-visual-reconstruction";
