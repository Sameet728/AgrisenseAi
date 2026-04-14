import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import { getSensorStatus, getStatusColor, getStatusBg, getStatusLabel } from "../utils";
import { useAuth } from "../context/AuthContext";

const SensorCard = ({ sensorKey, value, icon, label, unit, compact = false }) => {
  const { appLanguage } = useAuth();
  const status    = getSensorStatus(sensorKey, value);
  const color     = getStatusColor(status);
  const bgColor   = getStatusBg(status);
  const statusLabel = getStatusLabel(status, appLanguage);

  if (compact) {
    return (
      <View style={[styles.compactCard, { borderLeftColor: color }]}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.compactValue}>{value}{unit}</Text>
        <Text style={styles.compactLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, SHADOWS.md]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.badgeText, { color }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Value */}
      <Text style={[styles.value, { color }]}>
        {typeof value === "number" 
          ? ['moisture', 'ldr'].includes(sensorKey) ? Math.round(value) : value.toFixed(1)
          : value}
        <Text style={styles.unit}>{unit}</Text>
      </Text>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: `${Math.min(100, Math.max(0, (value / getMaxForKey(sensorKey)) * 100))}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const getMaxForKey = (key) => {
  const maxMap = {
    moisture: 100, temperature: 50, humidity: 100,
    soilTemp: 50, ldr: 1000, ph: 14,
  };
  return maxMap[key] || 100;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    margin: SPACING.xs,
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: "600" },

  value: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  unit: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: SPACING.sm,
  },

  barTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Compact styles
  compactCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  compactValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginHorizontal: SPACING.sm,
  },
  compactLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

export default SensorCard;
