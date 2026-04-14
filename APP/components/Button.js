// ============================================================
// components/Button.js
// ============================================================

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";

const Button = ({
  title,
  onPress,
  variant = "primary",   // primary | secondary | outline | danger | ghost
  size    = "md",        // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = true,
  style,
  textStyle,
}) => {
  const variantStyle = styles[`btn_${variant}`] || styles.btn_primary;
  const textVariant  = styles[`text_${variant}`] || styles.text_primary;
  const sizeStyle    = styles[`size_${size}`] || styles.size_md;
  const textSize     = styles[`textSize_${size}`] || styles.textSize_md;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize || 18}
              color={textVariant.color}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.baseText, textVariant, textSize, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize || 18}
              color={textVariant.color}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  fullWidth: { width: "100%" },
  content: { flexDirection: "row", alignItems: "center" },
  disabled: { opacity: 0.5 },

  // Variants
  btn_primary:   { backgroundColor: COLORS.primary },
  btn_secondary: { backgroundColor: COLORS.accentLight },
  btn_outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  btn_danger: { backgroundColor: COLORS.danger },
  btn_ghost:  { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },

  // Text variants
  text_primary:   { color: COLORS.white },
  text_secondary: { color: COLORS.primaryDark },
  text_outline:   { color: COLORS.primary },
  text_danger:    { color: COLORS.white },
  text_ghost:     { color: COLORS.primary },

  // Sizes
  size_sm: { paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, iconSize: 14 },
  size_md: { paddingVertical: SPACING.md,     paddingHorizontal: SPACING.xl, iconSize: 18 },
  size_lg: { paddingVertical: SPACING.base,   paddingHorizontal: SPACING.xxl, iconSize: 20 },

  // Base text
  baseText: { fontWeight: "700", letterSpacing: 0.3 },
  textSize_sm: { fontSize: FONT_SIZES.sm },
  textSize_md: { fontSize: FONT_SIZES.base },
  textSize_lg: { fontSize: FONT_SIZES.lg },
});

export default Button;
