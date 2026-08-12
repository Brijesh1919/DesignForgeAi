/**
 * DesignForge AI — Shared Constants
 */

// ─── Supported File Types ────────────────────────────────────

export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
] as const;

export const SUPPORTED_DOCUMENT_TYPES = ["application/pdf"] as const;

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES,
] as const;

export const SUPPORTED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".tiff",
  ".pdf",
] as const;

// ─── Image Constraints ───────────────────────────────────────

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_WIDTH = 4096;
export const MAX_IMAGE_HEIGHT = 4096;
export const MIN_IMAGE_WIDTH = 100;
export const MIN_IMAGE_HEIGHT = 100;

// ─── Processing Stages ───────────────────────────────────────

export const PROCESSING_STAGES = [
  { id: "uploading", label: "Uploading screenshot...", icon: "☁️" },
  { id: "analyzing", label: "Analyzing layout...", icon: "🔍" },
  { id: "reading-text", label: "Reading text...", icon: "📝" },
  { id: "extracting-colors", label: "Extracting colors...", icon: "🎨" },
  { id: "detecting-components", label: "Detecting components...", icon: "🧩" },
  { id: "building-layout", label: "Building Auto Layout...", icon: "📐" },
  { id: "creating-nodes", label: "Creating Figma nodes...", icon: "✨" },
  { id: "generating-styles", label: "Generating styles...", icon: "🎯" },
  { id: "inserting-images", label: "Inserting images...", icon: "🖼️" },
  { id: "finalizing", label: "Finalizing design...", icon: "🚀" },
] as const;

export type ProcessingStageId = (typeof PROCESSING_STAGES)[number]["id"];

// ─── Font Mapping ────────────────────────────────────────────

/**
 * Curated Google Fonts that closely match common system / app fonts.
 * Used as fallbacks when exact font detection isn't possible.
 */
export const FONT_FALLBACK_MAP: Record<string, string> = {
  // iOS
  "SF Pro Display": "Inter",
  "SF Pro Text": "Inter",
  "SF Pro Rounded": "Nunito",
  "SF Mono": "JetBrains Mono",
  "Helvetica Neue": "Inter",
  Helvetica: "Inter",

  // Android
  Roboto: "Roboto",
  "Noto Sans": "Noto Sans",
  "Google Sans": "Product Sans",

  // Windows
  "Segoe UI": "Open Sans",
  "Segoe UI Variable": "Open Sans",
  Calibri: "Lato",
  Arial: "Open Sans",

  // macOS
  "San Francisco": "Inter",
  ".SF NS": "Inter",

  // Web Common
  system: "Inter",
  "system-ui": "Inter",
  "-apple-system": "Inter",
  BlinkMacSystemFont: "Inter",

  // Monospace
  "Fira Code": "Fira Code",
  "Source Code Pro": "Source Code Pro",
  Menlo: "JetBrains Mono",
  Monaco: "JetBrains Mono",
  Consolas: "JetBrains Mono",
  "Courier New": "JetBrains Mono",

  // Fallback
  "sans-serif": "Inter",
  serif: "Merriweather",
  monospace: "JetBrains Mono",
};

/**
 * List of popular Google Fonts for best matching.
 */
export const POPULAR_GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Nunito Sans",
  "Raleway",
  "Ubuntu",
  "Outfit",
  "Plus Jakarta Sans",
  "DM Sans",
  "Source Sans 3",
  "Work Sans",
  "Manrope",
  "Space Grotesk",
  "Sora",
  "Lexend",
  "Figtree",
  "Geist",
  "Onest",
  "Urbanist",
  "Satoshi",
  "General Sans",
  "Cabinet Grotesk",
  "Clash Display",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "Source Serif 4",
  "Libre Baskerville",
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "IBM Plex Mono",
  "Space Mono",
] as const;

// ─── API Defaults ────────────────────────────────────────────

export const DEFAULT_BACKEND_URL = "http://localhost:3001";
export const API_VERSION = "v1";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

// ─── Figma Defaults ──────────────────────────────────────────

export const PLUGIN_UI_WIDTH = 380;
export const PLUGIN_UI_HEIGHT = 600;
export const DEFAULT_FRAME_PADDING = 16;
export const DEFAULT_ITEM_SPACING = 8;
