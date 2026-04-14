// ============================================================
// components/ErrorView.js
// ============================================================

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING } from "../constants/theme";
import Button from "./Button";

const ErrorView = ({ message = "Something went wrong.", onRetry }) => (
  <View style={styles.container}>
    <Ionicons name="cloud-offline-outline" size={60} color={COLORS.textDisabled} />
    <Text style={styles.title}>Oops!</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <Button
        title="Try Again"
        onPress={onRetry}
        icon="refresh"
        fullWidth={false}
        style={{ marginTop: SPACING.lg }}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: SPACING.base,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});

export default ErrorView;
