/**
 * DesignForge AI — Website URL → Figma: Types
 * Isolated from all existing type definitions.
 */

export interface WebsiteViewport { width: number; height: number; }

export const WEBSITE_VIEWPORTS: Record<string, WebsiteViewport> = {
  "Desktop 1440x900":  { width: 1440, height: 900  },
  "Laptop 1280x800":   { width: 1280, height: 800  },
  "Tablet 768x1024":   { width: 768,  height: 1024 },
  "Mobile 390x844":    { width: 390,  height: 844  },
};

export interface WebsiteConversionOptions {
  editableText:    boolean;
  autoLayout:      boolean;
  importImages:    boolean;
  preserveFonts:   boolean;
  preserveShadows: boolean;
  preserveBorders: boolean;
}

export interface WebsiteNodeBounds { x: number; y: number; width: number; height: number; }

export interface WebsiteNodeFill {
  type:           "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL";
  color?:         string;
  opacity?:       number;
  gradientStops?: Array<{ position: number; color: string; opacity: number }>;
}

export interface WebsiteNodeStroke {
  color:    string;
  opacity:  number;
  weight:   number;
  weights?: { top: number; right: number; bottom: number; left: number };
  position: "INSIDE" | "OUTSIDE" | "CENTER";
}

export interface WebsiteNodeEffect {
  type:     "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?:   string;
  offsetX?: number;
  offsetY?: number;
  blur?:    number;
  spread?:  number;
  opacity?: number;
  radius?:  number;
  visible:  boolean;
}

export interface WebsiteNodeCornerRadius {
  topLeft: number; topRight: number; bottomRight: number; bottomLeft: number;
}

export interface WebsiteNodeText {
  content:        string;
  fontFamily:     string;
  fontWeight:     string;
  fontSize:       number;
  lineHeight?:    number;
  letterSpacing:  number;
  textAlign:      "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";
  textCase:       "ORIGINAL" | "UPPER" | "LOWER";
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  color:          string;
  opacity:        number;
  width:          number;
  height:         number;
}

export interface WebsiteNodeLayout {
  display: string; direction: "HORIZONTAL" | "VERTICAL" | "NONE";
  flexDirection: string; justifyContent: string; alignItems: string; flexWrap: string;
  gap: number; rowGap: number; columnGap: number;
  paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number;
  marginTop: number; marginRight: number; marginBottom: number; marginLeft: number;
  flexGrow: number; flexShrink: number; alignSelf: string;
  gridTemplateColumns?: string;
}

export interface WebsiteNodeStyle {
  fills: WebsiteNodeFill[]; strokes: WebsiteNodeStroke[]; effects: WebsiteNodeEffect[];
  cornerRadius: number | WebsiteNodeCornerRadius;
  opacity: number; clipsContent: boolean; visible: boolean;
  position: string; zIndex: number; overflow: string;
  objectFit?: string; transform?: string;
}

export type WebsiteNodeType = "FRAME" | "TEXT" | "IMAGE" | "VECTOR" | "UNKNOWN";

export interface WebsiteNode {
  id: string; type: WebsiteNodeType; tagName: string; name: string;
  bounds: WebsiteNodeBounds; layout: WebsiteNodeLayout; style: WebsiteNodeStyle;
  text?: WebsiteNodeText; imageRef?: string; svgContent?: string;
  isPseudo?: boolean; pseudoType?: "before" | "after"; children: WebsiteNode[];
}

export interface WebsiteAsset {
  id: string; src: string; base64?: string; mimeType?: string;
  width: number; height: number; bounds: WebsiteNodeBounds;
}

export interface WebsiteFont { family: string; weight: string; style: string; }

export interface WebsiteExtractionResult {
  url: string; title: string; viewport: WebsiteViewport;
  pageWidth: number; pageHeight: number;
  rootNode: WebsiteNode; assets: WebsiteAsset[]; fonts: WebsiteFont[];
  extractedAt: number;
}

export interface WebsiteToFigmaRequest {
  url: string; viewport: WebsiteViewport; options: WebsiteConversionOptions;
}

export interface WebsiteToFigmaResponse {
  success: boolean; data?: WebsiteExtractionResult; error?: string; requestId?: string;
}
