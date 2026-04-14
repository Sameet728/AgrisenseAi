// ============================================================
// screens/DashboardScreen.js
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import SensorCard from "../components/SensorCard";
import ScreenWrapper from "../components/ScreenWrapper";
import LoadingScreen from "../components/LoadingScreen";
import ErrorView from "../components/ErrorView";
import ProfileReminderBanner from "../components/ProfileReminderBanner";
import { useAuth } from "../context/AuthContext";
import { apiGetSensorData, apiGetSensorHistory } from "../services/api";
import { getSensorStatus, getStatusColor, formatTimestamp } from "../utils";

import { t } from '../services/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - SPACING.base * 2 - SPACING.xl * 2;

const SENSOR_KEYS = [
  { key: "moisture",    icon: "water",       unit: "%" },
  { key: "temperature", icon: "thermometer", unit: "°C" },
  { key: "humidity",    icon: "cloud",       unit: "%" },
  { key: "soilTemp",    icon: "earth",       unit: "°C" },
  { key: "ldr",         icon: "sunny",       unit: " lux" },
];

const REFRESH_INTERVAL = 30; // seconds

const DashboardScreen = () => {
  const { user, profileData, appLanguage } = useAuth();

  const [sensorData,  setSensorData]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [chartTab,    setChartTab]    = useState(0);
  const [countdown,   setCountdown]   = useState(REFRESH_INTERVAL);
  const [syncing,     setSyncing]     = useState(false);  // flashes on background refresh

  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startPulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 400, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const getChartTabs = () => [t("dashboard.moisture"), t("dashboard.temperature"), t("dashboard.humidity")];

  const fetchData = useCallback(async (silent = false) => {
    try {
      setError(null);
      if (silent) { setSyncing(true); startPulse(); }
      const [sRes, hRes] = await Promise.all([
        apiGetSensorData(),
        apiGetSensorHistory(),
      ]);
      setSensorData(sRes.data);
      setHistory(hRes.data);
    } catch (err) {
      setError("Failed to load sensor data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  }, [startPulse]);

  // Auto-refresh every 15 s + countdown ticker
  useEffect(() => {
    fetchData();                    // Initial fetch

    const refreshTimer = setInterval(() => {
      setCountdown(REFRESH_INTERVAL); // Reset countdown
      fetchData(true);                // Silent background sync
    }, REFRESH_INTERVAL * 1000);

    // 1-second tick to decrement countdown
    const ticker = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(ticker);
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    setCountdown(REFRESH_INTERVAL);
    fetchData();
  };

  if (loading)       return <LoadingScreen message="Fetching sensor data…" />;
  if (error && !sensorData) return <ErrorView message={error} onRetry={fetchData} />;

  const chartKeys   = ["moisture", "temperature", "humidity"];
  const chartColors = [COLORS.chartBlue, COLORS.chartOrange, COLORS.chartGreen];
  const chartKey    = chartKeys[chartTab];
  const chartColor  = chartColors[chartTab];

  const chartHistory = history.slice(-6); // show max 6 recent data points on X axis

  const chartData = {
    labels:   chartHistory.map((h) => h.time),
    datasets: [{ data: chartHistory.map((h) => h[chartKey] ?? 0) }],
  };

  const motorStatus = sensorData?.motor || "OFF";
  const motorOn     = motorStatus === "ON";

  const criticalCount = SENSOR_KEYS.filter(
    ({ key }) => getSensorStatus(key, sensorData?.[key]) === "critical"
  ).length;
  const warningCount = SENSOR_KEYS.filter(
    ({ key }) => getSensorStatus(key, sensorData?.[key]) === "warning"
  ).length;

  return (
    <ScreenWrapper backgroundColor={COLORS.primary} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.primary]}
          />
        }
      >
        <ProfileReminderBanner />

      {/* Greeting banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {t("dashboard.greeting")}, {user?.name?.split(" ")[0] || "Farmer"} 👋
          </Text>
          <Text style={styles.farmName}>{user?.farm || "AgriSense"}</Text>

          {/* Live sync row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Animated.View style={[
              styles.liveDot,
              { opacity: pulseAnim, backgroundColor: syncing ? '#FFD700' : '#4ADE80' }
            ]} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
              {syncing
                ? (appLanguage === 'mr' ? 'अपडेट होत आहे...' : 'Updating...')
                : (appLanguage === 'mr'
                    ? `पुढील अपडेट ${countdown}s मध्ये`
                    : `Next sync in ${countdown}s`)}
            </Text>
          </View>
        </View>

        <View style={[styles.motorBadge, { backgroundColor: motorOn ? COLORS.successBg : COLORS.dangerBg }]}>
          <Ionicons
            name={motorOn ? "water" : "water-outline"}
            size={18}
            color={motorOn ? COLORS.success : COLORS.danger}
          />
          <Text style={[styles.motorBadgeText, { color: motorOn ? COLORS.success : COLORS.danger }]}>
            {t("nav.motor")} {motorOn ? t("motor.on") : t("motor.off")}
          </Text>
        </View>
      </View>

      {/* Alert strip */}
      {(criticalCount > 0 || warningCount > 0) && (
        <View style={[styles.alertStrip, { backgroundColor: criticalCount > 0 ? COLORS.dangerBg : COLORS.warningBg }]}>
          <Ionicons
            name="warning"
            size={16}
            color={criticalCount > 0 ? COLORS.danger : COLORS.warning}
          />
          <Text style={[styles.alertText, { color: criticalCount > 0 ? COLORS.danger : COLORS.warning }]}>
            {criticalCount > 0
              ? `${criticalCount} ${t("dashboard.critical_sensors")}`
              : `${warningCount} ${t("dashboard.warning_sensors")}`}
          </Text>
        </View>
      )}

      {/* Sensor grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("dashboard.status_live")}</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>{t("dashboard.status_optimal")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>{t("dashboard.status_warning")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>{t("dashboard.status_critical")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sensorGrid}>
        {SENSOR_KEYS.map(({ key, icon, unit }) => {
          let translatedLabel = key;
          if (key === 'moisture') translatedLabel = t("dashboard.moisture");
          if (key === 'temperature') translatedLabel = t("dashboard.temperature");
          if (key === 'humidity') translatedLabel = t("dashboard.humidity");
          if (key === 'ldr') translatedLabel = t("dashboard.light");
          if (key === 'soilTemp') translatedLabel = t("dashboard.soil_temp");

          return (
            <View key={key} style={styles.sensorCell}>
              <SensorCard
                sensorKey={key}
                value={sensorData?.[key] ?? 0}
                icon={icon}
                label={translatedLabel}
                unit={unit}
              />
            </View>
          );
        })}
      </View>

      {/* Chart section */}
      <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("dashboard.trends_today")}</Text>
      </View>

      <View style={[styles.chartCard, SHADOWS.lg]}>
        {/* Chart tabs */}
        <View style={styles.chartTabs}>
          {getChartTabs().map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setChartTab(i)}
              style={[
                styles.chartTab,
                chartTab === i && [styles.chartTabActive, { backgroundColor: chartColors[i] }],
              ]}
            >
              <Text
                style={[
                  styles.chartTabText,
                  chartTab === i && styles.chartTabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {history.length > 0 && (
          <LineChart
            data={chartData}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 1,
              color: (opacity = 1) => chartColor + Math.round(opacity * 255).toString(16).padStart(2, "0"),
              labelColor: () => COLORS.textTertiary,
              style: { borderRadius: 8 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: chartColor },
              propsForBackgroundLines: { stroke: COLORS.divider, strokeDasharray: "4" },
            }}
            bezier
            style={styles.chart}
            withInnerLines
            withOuterLines={false}
          />
        )}
      </View>

      {/* Soil nutrients row */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Soil Nutrients (NPK)</Text>
      </View>

      <View style={[styles.nutrientCard, SHADOWS.sm]}>
        {[
          { label: "Nitrogen (N)",   key: "nitrogen",   max: 100, color: COLORS.chartGreen,  unit: "mg/kg" },
          { label: "Phosphorus (P)", key: "phosphorus", max: 60,  color: COLORS.chartOrange, unit: "mg/kg" },
          { label: "Potassium (K)",  key: "potassium",  max: 300, color: COLORS.chartPurple, unit: "mg/kg" },
        ].map(({ label, key, max, color, unit }) => {
          const value = sensorData?.[key];
          const hasValue = value != null && !isNaN(value); // 0 is valid!
          return (
            <View key={label} style={styles.nutrientRow}>
              <Text style={styles.nutrientLabel}>{label}</Text>
              <View style={styles.nutrientBarTrack}>
                {hasValue ? (
                  <View style={[styles.nutrientBarFill, { width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }]} />
                ) : (
                  <View style={[styles.nutrientBarFill, { width: '100%', backgroundColor: '#E2E8F0' }]} />
                )}
              </View>
              <Text style={[styles.nutrientValue, { color: hasValue ? color : COLORS.textTertiary }]}>
                {hasValue ? `${value} ${unit}` : "--"}
              </Text>
            </View>
          );
        })}
        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.xs }}>
          {sensorData?.nitrogen != null ? '📡 Live from sensor' : 'Awaiting sensor data...'}
        </Text>
      </View>
      </View>


      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: SPACING.xxxl },

  banner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl + 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting:  { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.white },
  farmName:  { fontSize: FONT_SIZES.sm, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  timestamp: { fontSize: FONT_SIZES.xs, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  motorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  motorBadgeText: { fontSize: FONT_SIZES.sm, fontWeight: "700" },

  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  alertText: { fontSize: FONT_SIZES.sm, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  legend: { flexDirection: "row", gap: SPACING.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.sm,
  },
  sensorCell: { width: "50%", padding: SPACING.xs },

  chartCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
  },
  chartTabs: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    marginBottom: SPACING.base,
  },
  chartTab: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  chartTabActive: {},
  chartTabText:       { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: "600" },
  chartTabTextActive: { color: COLORS.white },
  chart: { borderRadius: BORDER_RADIUS.md, marginLeft: -SPACING.base },

  nutrientCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  nutrientLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
    width: 120,
  },
  nutrientBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  nutrientBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  nutrientValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    width: 72,
    textAlign: "right",
  },
});

export default DashboardScreen;
