// ============================================================
// constants/theme.js — Design tokens for AgriSense AI
// ============================================================

export const COLORS = {
  // Primary green palette
  primary:        "#1A6B3C",
  primaryLight:   "#2E8B57",
  primaryDark:    "#0F3D22",
  primaryFaint:   "#E8F5EE",

  // Accent
  accent:         "#4CAF50",
  accentLight:    "#81C784",
  accentDark:     "#388E3C",

  // Semantic
  success:        "#2E7D32",
  successBg:      "#E8F5E9",
  warning:        "#F57F17",
  warningBg:      "#FFF8E1",
  danger:         "#C62828",
  dangerBg:       "#FFEBEE",
  info:           "#1565C0",
  infoBg:         "#E3F2FD",

  // Neutrals
  white:          "#FFFFFF",
  background:     "#F4F8F5",
  surface:        "#FFFFFF",
  surfaceAlt:     "#F0F7F3",
  border:         "#D6E8DC",
  divider:        "#E8F0EA",

  // Text
  textPrimary:    "#1A2E22",
  textSecondary:  "#4A6356",
  textTertiary:   "#7A9B87",
  textDisabled:   "#B0C8B8",
  textOnPrimary:  "#FFFFFF",

  // Chart colors
  chartGreen:     "#4CAF50",
  chartBlue:      "#2196F3",
  chartOrange:    "#FF9800",
  chartRed:       "#F44336",
  chartPurple:    "#9C27B0",
};

export const FONTS = {
  regular:   "System",
  medium:    "System",
  semiBold:  "System",
  bold:      "System",
};

export const FONT_SIZES = {
  xs:   10,
  sm:   12,
  md:   14,
  base: 16,
  lg:   18,
  xl:   20,
  xxl:  24,
  xxxl: 30,
  hero: 36,
};

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 40,
};

export const BORDER_RADIUS = {
  sm:     8,
  md:     14,
  lg:     20,
  xl:     24,
  round:  999,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#0A3B25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#0A3B25",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#0A3B25",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};
