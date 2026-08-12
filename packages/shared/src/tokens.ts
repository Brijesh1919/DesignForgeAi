/**
 * DesignForge AI — Design Token Types
 *
 * Professional naming conventions for design tokens
 * following industry standards (Material, Ant, Chakra).
 */

// ─── Color Token Categories ─────────────────────────────────

export const COLOR_TOKEN_NAMES = {
  primary: [
    "primary",
    "primary-hover",
    "primary-pressed",
    "primary-light",
    "primary-dark",
    "on-primary",
  ],
  secondary: [
    "secondary",
    "secondary-hover",
    "secondary-pressed",
    "secondary-light",
    "secondary-dark",
    "on-secondary",
  ],
  accent: ["accent", "accent-hover", "accent-pressed", "on-accent"],
  neutral: [
    "neutral-50",
    "neutral-100",
    "neutral-200",
    "neutral-300",
    "neutral-400",
    "neutral-500",
    "neutral-600",
    "neutral-700",
    "neutral-800",
    "neutral-900",
  ],
  semantic: [
    "success",
    "success-light",
    "on-success",
    "warning",
    "warning-light",
    "on-warning",
    "error",
    "error-light",
    "on-error",
    "info",
    "info-light",
    "on-info",
  ],
  surface: [
    "background",
    "surface",
    "surface-variant",
    "surface-elevated",
    "overlay",
  ],
  text: [
    "text-primary",
    "text-secondary",
    "text-tertiary",
    "text-disabled",
    "text-inverse",
  ],
  border: ["border", "border-light", "border-focus", "divider"],
} as const;

// ─── Typography Scale ────────────────────────────────────────

export const TYPOGRAPHY_SCALE = {
  display: { name: "Display", defaultSize: 48, defaultWeight: "Bold" as const },
  "heading-1": {
    name: "Heading 1",
    defaultSize: 36,
    defaultWeight: "Bold" as const,
  },
  "heading-2": {
    name: "Heading 2",
    defaultSize: 28,
    defaultWeight: "SemiBold" as const,
  },
  "heading-3": {
    name: "Heading 3",
    defaultSize: 24,
    defaultWeight: "SemiBold" as const,
  },
  subheading: {
    name: "Subheading",
    defaultSize: 20,
    defaultWeight: "Medium" as const,
  },
  body: { name: "Body", defaultSize: 16, defaultWeight: "Regular" as const },
  "body-small": {
    name: "Body Small",
    defaultSize: 14,
    defaultWeight: "Regular" as const,
  },
  caption: {
    name: "Caption",
    defaultSize: 12,
    defaultWeight: "Regular" as const,
  },
  button: { name: "Button", defaultSize: 14, defaultWeight: "Medium" as const },
  overline: {
    name: "Overline",
    defaultSize: 10,
    defaultWeight: "Medium" as const,
  },
  code: { name: "Code", defaultSize: 14, defaultWeight: "Regular" as const },
} as const;

export type TypographyScaleKey = keyof typeof TYPOGRAPHY_SCALE;

// ─── Spacing Scale ───────────────────────────────────────────

export const DEFAULT_SPACING_SCALE = [
  2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 120,
] as const;

// ─── Radius Scale ────────────────────────────────────────────

export const DEFAULT_RADIUS_SCALE = [
  0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 9999,
] as const;

// ─── Elevation / Shadow Scale ────────────────────────────────

export interface ElevationLevel {
  name: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  opacity: number;
}

export const DEFAULT_ELEVATION_SCALE: ElevationLevel[] = [
  {
    name: "Elevation/None",
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    spread: 0,
    opacity: 0,
  },
  {
    name: "Elevation/1",
    offsetX: 0,
    offsetY: 1,
    blur: 3,
    spread: 0,
    opacity: 0.1,
  },
  {
    name: "Elevation/2",
    offsetX: 0,
    offsetY: 2,
    blur: 6,
    spread: 0,
    opacity: 0.12,
  },
  {
    name: "Elevation/3",
    offsetX: 0,
    offsetY: 4,
    blur: 12,
    spread: 0,
    opacity: 0.15,
  },
  {
    name: "Elevation/4",
    offsetX: 0,
    offsetY: 8,
    blur: 24,
    spread: 0,
    opacity: 0.18,
  },
  {
    name: "Elevation/5",
    offsetX: 0,
    offsetY: 16,
    blur: 48,
    spread: 0,
    opacity: 0.22,
  },
];

// ─── Opacity Scale ───────────────────────────────────────────

export const DEFAULT_OPACITY_SCALE = {
  "opacity-0": 0,
  "opacity-5": 0.05,
  "opacity-10": 0.1,
  "opacity-20": 0.2,
  "opacity-30": 0.3,
  "opacity-40": 0.4,
  "opacity-50": 0.5,
  "opacity-60": 0.6,
  "opacity-70": 0.7,
  "opacity-80": 0.8,
  "opacity-90": 0.9,
  "opacity-100": 1,
} as const;
