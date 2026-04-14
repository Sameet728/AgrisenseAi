// ============================================================
// components/LoadingScreen.js
// ============================================================

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../constants/theme";

const LoadingScreen = ({ message = "Loading…" }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default LoadingScreen;
