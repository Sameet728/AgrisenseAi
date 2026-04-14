// ============================================================
// components/Header.js
// ============================================================

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, SHADOWS } from "../constants/theme";

const Header = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.sm },
        transparent ? styles.transparent : styles.solid,
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.row}>
        {/* Left */}
        <View style={styles.side}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* Right */}
        <View style={styles.side}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },
  solid: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    width: 44,
    alignItems: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
});

export default Header;
