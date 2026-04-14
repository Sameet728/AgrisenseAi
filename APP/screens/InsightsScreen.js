// ============================================================
// screens/InsightsScreen.js
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import InsightCard from "../components/InsightCard";
import CropCard from "../components/CropCard";
import FertilizerCard from "../components/FertilizerCard";
import IrrigationCard from "../components/IrrigationCard";
import ScreenWrapper from "../components/ScreenWrapper";
import LoadingScreen from "../components/LoadingScreen";
import ErrorView from "../components/ErrorView";
import ProfileReminderBanner from "../components/ProfileReminderBanner";
import { apiGetInsights, apiGetCropRecommendation, apiGetFertilizerRecommendation, apiGetIrrigationRecommendation, apiGetFarmDataHistory } from "../services/api";
import { downloadPDF } from "../utils/reportGenerator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { t } from '../services/i18n';
import { translateIfNeeded } from '../services/translate';

const { width } = Dimensions.get("window");
const SEVERITY_FILTERS = ["All", "High", "Medium", "Low"];
const HISTORY_RANGES = ["Week", "Month", "Year", "All"];

const InsightsScreen = () => {
  const [insights,    setInsights]    = useState([]);
  const [cropReport,  setCropReport]  = useState(null);
  const [fertReport,  setFertReport]  = useState(null);
  const [irrigReport, setIrrigReport] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("All");

  const [historyData, setHistoryData]       = useState([]);
  const [historyRange, setHistoryRange]     = useState("Week");
  const [historyLoading, setHistoryLoading] = useState(true);

  const navigation = useNavigation();
  const { profileData, appLanguage } = useAuth(); // appLanguage subscription forces re-render on switch

  const [translatedInsights, setTranslatedInsights] = useState([]);

  const fetchInsights = useCallback(async () => {
    try {
      setError(null);
      const [res, cropRes, fertRes, irrigRes] = await Promise.all([
         apiGetInsights(),
         apiGetCropRecommendation().catch(() => null),
         apiGetFertilizerRecommendation().catch(() => null),
         apiGetIrrigationRecommendation().catch(() => null),
      ]);
      setInsights(res.data);
      if (cropRes?.data)  setCropReport(cropRes.data);
      if (fertRes?.data)  setFertReport(fertRes.data);
      if (irrigRes?.data) setIrrigReport(irrigRes.data);
    } catch (err) {
      setError(t("insights.no_data"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiGetFarmDataHistory(historyRange.toLowerCase());
      if (res?.success) setHistoryData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyRange]);

  // Auto-translate anomaly messages whenever language or insights change
  useEffect(() => {
    const runTranslation = async () => {
      if (appLanguage !== 'mr' || !insights.length) {
        setTranslatedInsights(insights);
        return;
      }
      const translated = await Promise.all(
        insights.map(async (item) => ({
          ...item,
          message: await translateIfNeeded(item.message || '', appLanguage),
        }))
      );
      setTranslatedInsights(translated);
    };
    runTranslation();
  }, [appLanguage, insights]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // When returning from IrrigationDetail after regeneration, re-fetch the cached report
  useFocusEffect(
    useCallback(() => {
      apiGetIrrigationRecommendation()
        .then(res => { if (res?.data) setIrrigReport(res.data); })
        .catch(() => {});
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
    fetchHistory();
  };

  const handleAction = (insight) => {
    Alert.alert(insight.title, `Action: ${insight.action}\n\n${insight.message}`, [
      { text: "OK", style: "default" },
    ]);
  };

  if (loading && insights.length === 0) return <LoadingScreen message="Generating AI insights…" />;
  if (error && insights.length === 0)
    return <ErrorView message={error} onRetry={onRefresh} />;

  const displayData = translatedInsights.length ? translatedInsights : insights;
  const filtered =
    filter === "All"
      ? displayData
      : displayData.filter((i) => i.severity?.toLowerCase() === filter.toLowerCase());

  const highCount   = insights.filter((i) => i.severity === "high").length;
  const mediumCount = insights.filter((i) => i.severity === "medium").length;

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

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <View style={styles.aiIcon}>
            <Ionicons name="hardware-chip-outline" size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.bannerTitle}>{t("nav.insights")}</Text>
          </View>
        </View>
        <View style={styles.bannerStats}>
          {highCount > 0 && (
            <View style={[styles.statBadge, { backgroundColor: COLORS.dangerBg }]}>
              <Text style={[styles.statNum, { color: COLORS.danger }]}>{highCount}</Text>
              <Text style={[styles.statLabel, { color: COLORS.danger }]}>High</Text>
            </View>
          )}
          {mediumCount > 0 && (
            <View style={[styles.statBadge, { backgroundColor: COLORS.warningBg }]}>
              <Text style={[styles.statNum, { color: COLORS.warning }]}>{mediumCount}</Text>
              <Text style={[styles.statLabel, { color: COLORS.warning }]}>Medium</Text>
            </View>
          )}
        </View>
      </View>

      {/* Advanced AI Projections */}
      <View style={{ marginTop: SPACING.base, marginHorizontal: SPACING.base }}>
         <CropCard
           cropName={cropReport?.recommendedCrop}
           snippet={cropReport?.aiInsights || "Generating AI Insights..."}
           onPress={() => {
              if (cropReport) navigation.navigate("CropDetail", { reportData: cropReport });
           }}
         />

         <FertilizerCard
           fertilizerName={fertReport?.recommendedFertilizer}
           snippet={fertReport?.aiInsights || "Generating optimal nutrient metrics..."}
           onPress={() => {
              if (fertReport) navigation.navigate("FertilizerDetail", { reportData: fertReport });
           }}
         />

         <IrrigationCard
           irrigationNeeded={irrigReport?.irrigationNeeded}
           snippet={irrigReport?.aiInsights || t("irrigation.loading")}
           onPress={() => {
              if (irrigReport) navigation.navigate("IrrigationDetail", {
                reportData: irrigReport,
                // Callback: when detail screen regenerates, update our local state immediately
                onUpdate: (freshData) => setIrrigReport(freshData),
              });
           }}
         />
      </View>

      {/* ========================================= */}
      {/* Farm Data Analytics Section */}
      {/* ========================================= */}
      <View>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitleText}>Historical Data Maps</Text>
        </View>

        {/* History Filter Chips */}
        <View style={styles.historyFilterWrap}>
          {HISTORY_RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setHistoryRange(r)}
              style={[styles.historyChip, historyRange === r && styles.historyChipActive]}
            >
              <Text style={[styles.historyChipText, historyRange === r && styles.historyChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.cardContainer, SHADOWS.sm]}>
          {historyLoading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
               <Text style={{color: COLORS.textSecondary}}>Loading analytics...</Text>
            </View>
          ) : historyData.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
               <Text style={{color: COLORS.textTertiary}}>No data recorded for this period yet.</Text>
            </View>
          ) : (
            <>
              <LineChart
                data={{
                  labels: historyData.map((d, i) => i % Math.max(1, Math.floor(historyData.length / 5)) === 0 ? new Date(d.timestamp).toLocaleDateString([],{month:'short', day:'numeric'}) : ""),
                  datasets: [
                    {
                      data: historyData.map(d => d.soil || 0),
                      color: (opacity = 1) => `rgba(28, 107, 219, ${opacity})`, // Blue for Moisture
                      strokeWidth: 2
                    },
                    {
                      data: historyData.map(d => d.temperature || 0),
                      color: (opacity = 1) => `rgba(235, 87, 87, ${opacity})`, // Red for Temp
                      strokeWidth: 2
                    }
                  ],
                  legend: ["Moisture %", "Temp °C"]
                }}
                width={width - SPACING.base * 4}
                height={220}
                withDots={false}
                withInnerLines={false}
                chartConfig={{
                  backgroundColor: COLORS.white,
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, 0.5)`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "0" }
                }}
                style={{ marginVertical: 8, borderRadius: 8 }}
              />
              
              <Text style={styles.chartSubtitle}>
                {historyData.length} {t("insights.records_processed")} {historyRange}
              </Text>

              <View style={styles.downloadRow}>
                <TouchableOpacity 
                  style={[styles.downloadBtn, { backgroundColor: COLORS.primary }]} 
                  onPress={() => downloadPDF(historyData, historyRange, profileData)}
                >
                  <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
                  <Text style={styles.downloadBtnText}>{t("insights.download_pdf")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ========================================= */}
      {/* Current Anomalies Section */}
      {/* ========================================= */}
      <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
        <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
        <Text style={styles.sectionTitleText}>{t("insights.anomalies")}</Text>
      </View>

      {/* Summary card */}
      <View style={[styles.summaryCard, SHADOWS.md]}>
        <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
        <Text style={styles.summaryText}>
          {highCount + mediumCount === 0
            ? t("insights.no_issues")
            : `${highCount + mediumCount} ${t("insights.issues_summary")} ${highCount > 0 ? t("insights.immediate_action") : t("insights.monitor_closely")}`
          }
        </Text>
      </View>

      {/* Insights list */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={52} color={COLORS.success} />
            <Text style={styles.emptyTitle}>{t("insights.all_clear")}</Text>
            <Text style={styles.emptyText}>{t("insights.no_issues")}</Text>
          </View>
        ) : (
          filtered.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAction={handleAction}
            />
          ))
        )}
      </View>

      {/* Footer note */}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
        <Text style={styles.footerText}>{t("insights.pull_refresh")}</Text>
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
    paddingBottom: SPACING.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontSize: FONT_SIZES.lg, fontWeight: "800", color: COLORS.white },
  bannerSub:   { fontSize: FONT_SIZES.xs, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  bannerStats: { flexDirection: "row", gap: SPACING.sm },
  statBadge: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 44,
  },
  statNum:   { fontSize: FONT_SIZES.base, fontWeight: "800" },
  statLabel: { fontSize: FONT_SIZES.xs, fontWeight: "600" },

  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: SPACING.base,
  },
  summaryText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  filterRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:       { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: "600" },
  chipTextActive: { color: COLORS.white },

  list: { paddingHorizontal: SPACING.base },

  empty: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.success,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.base,
  },
  footerText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },

  // Analytics Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitleText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  historyFilterWrap: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  historyChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  historyChipText: { fontSize: FONT_SIZES.xs, fontWeight: "600", color: COLORS.textSecondary },
  historyChipTextActive: { color: COLORS.white },
  cardContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
  },
  chartSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  downloadRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  downloadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  downloadBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONT_SIZES.sm,
  },
});

export default InsightsScreen;
