// ============================================================
// components/Card.js
// ============================================================

import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";

const Card = ({
  children,
  style,
  variant = "default",  // default | elevated | flat | outlined
  padding = "md",       // none | sm | md | lg
}) => {
  const variantStyle = styles[`variant_${variant}`] || styles.variant_default;
  const paddingStyle = padding === "none" ? {} : styles[`padding_${padding}`] || styles.padding_md;

  return (
    <View style={[styles.base, variantStyle, paddingStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },

  variant_default: {
    ...SHADOWS.md,
  },
  variant_elevated: {
    ...SHADOWS.lg,
  },
  variant_flat: {
    backgroundColor: COLORS.surfaceAlt,
  },
  variant_outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },

  padding_sm: { padding: SPACING.sm },
  padding_md: { padding: SPACING.base },
  padding_lg: { padding: SPACING.xl },
});

export default Card;
