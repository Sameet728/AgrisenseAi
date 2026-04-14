// ============================================================
// components/InsightCard.js
// ============================================================

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";

const TYPE_CONFIG = {
  warning: { color: COLORS.warning, bg: COLORS.warningBg, icon: "warning" },
  danger:  { color: COLORS.danger,  bg: COLORS.dangerBg,  icon: "alert-circle" },
  info:    { color: COLORS.info,    bg: COLORS.infoBg,     icon: "information-circle" },
  success: { color: COLORS.success, bg: COLORS.successBg,  icon: "checkmark-circle" },
};

const InsightCard = ({ insight, onAction }) => {
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.info;

  return (
    <View style={[styles.card, SHADOWS.md]}>
      <View style={[styles.stripe, { backgroundColor: cfg.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{insight.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.severityText, { color: cfg.color }]}>
                {(insight.severity || "").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.message}>{insight.message}</Text>

        {insight.action && (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: cfg.color }]}
            onPress={() => onAction && onAction(insight)}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionText, { color: cfg.color }]}>{insight.action}</Text>
            <Ionicons name="chevron-forward" size={14} color={cfg.color} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    flexDirection: "row",
    overflow: "hidden",
  },
  stripe: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: SPACING.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  titleBlock: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  severityBadge: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  severityText: { fontSize: FONT_SIZES.xs, fontWeight: "700" },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  actionText: { fontSize: FONT_SIZES.sm, fontWeight: "600", marginRight: 2 },
});

export default InsightCard;
