import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { generateIrrigationReportPDF } from '../utils/pdfGenerator';
import { apiRegenerateIrrigationRecommendation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { t } from '../services/i18n';
import { translateIfNeeded, translateArrayIfNeeded } from '../services/translate';

const IrrigationDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, appLanguage } = useAuth();

  const [reportData, setReportData] = useState(route.params?.reportData || {});

  // Sync reportData whenever screen comes into focus (handles back-navigation)
  useFocusEffect(
    useCallback(() => {
      if (route.params?.reportData) {
        setReportData(route.params.reportData);
      }
    }, [route.params?.reportData])
  );
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [translatedInsights, setTranslatedInsights] = useState(null);

  const needed  = reportData.irrigationNeeded === true || reportData.irrigationNeeded === 1;
  const accent  = needed ? '#C05621' : '#276749';
  const heroBg  = needed
    ? 'linear-gradient(135deg, #C05621 0%, #ED8936 100%)'
    : 'linear-gradient(135deg, #276749 0%, #38A169 100%)';

  // Parse AI markdown into sections
  const parsedInsights = useMemo(() => {
    const rawText  = reportData.aiInsights || "";
    const sections = rawText.split(/###\s+/);
    const parsed   = { assessment: '', reason: '', action: '', tips: [], precautions: [] };

    sections.forEach(sec => {
      if (!sec.trim()) return;
      const [titleLine, ...bodyLines] = sec.split('\n');
      const title = titleLine.toLowerCase();
      const body  = bodyLines.join('\n').trim();

      if (title.includes('assessment'))           parsed.assessment = body;
      else if (title.includes('why'))             parsed.reason     = body;
      else if (title.includes('action'))          parsed.action     = body;
      else if (title.includes('tip') || title.includes('water management')) {
        parsed.tips = body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean);
      }
      else if (title.includes('precaution'))       {
        parsed.precautions = body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean);
      }
    });
    return parsed;
  }, [reportData.aiInsights]);

  // Auto-translate AI content when language changes
  useEffect(() => {
    const run = async () => {
      if (appLanguage !== 'mr') { setTranslatedInsights(null); return; }
      const [assessment, reason, action, tips, precautions] = await Promise.all([
        translateIfNeeded(parsedInsights.assessment,    appLanguage),
        translateIfNeeded(parsedInsights.reason,        appLanguage),
        translateIfNeeded(parsedInsights.action,        appLanguage),
        translateArrayIfNeeded(parsedInsights.tips,       appLanguage),
        translateArrayIfNeeded(parsedInsights.precautions, appLanguage),
      ]);
      setTranslatedInsights({ assessment, reason, action, tips, precautions });
    };
    run();
  }, [appLanguage, parsedInsights]);

  const display = translatedInsights || parsedInsights;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateIrrigationReportPDF(reportData, user?.name);
    } catch {
      Alert.alert(t("irrigation.report_title"), t("crop.pdf_failed"));
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiRegenerateIrrigationRecommendation();
      if (res.success && res.data) {
        setReportData(res.data);
        // Notify InsightsScreen so the card stays in sync after going back
        route.params?.onUpdate?.(res.data);
      }
    } catch {
      Alert.alert(t("irrigation.regenerate"), t("crop.regen_failed"));
    } finally {
      setGenerating(false);
    }
  };

  const inputData = reportData.inputData || {};

  return (
    <ScreenWrapper backgroundColor={needed ? '#7B341E' : COLORS.primary} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: needed ? '#7B341E' : COLORS.primary }]}>
        <Ionicons name="water-outline" size={24} color={COLORS.white} />
        <Text style={styles.headerTitle}>{t("irrigation.report_title")}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={[styles.heroCard, { borderTopColor: accent }, SHADOWS.lg]}>
          <View style={[styles.heroBadge, { backgroundColor: accent + '22' }]}>
            <Ionicons name="hardware-chip-outline" size={13} color={accent} />
            <Text style={[styles.heroBadgeText, { color: accent }]}>
              {t("irrigation.badge")}
            </Text>
          </View>
          <View style={[styles.heroIconBox, { backgroundColor: accent + '22' }]}>
            <Ionicons name={needed ? 'water' : 'checkmark-circle'} size={48} color={accent} />
          </View>
          <Text style={[styles.heroTitle, { color: accent }]}>
            {needed ? t("irrigation.water_required") : t("irrigation.no_water")}
          </Text>
          {/* IRRIGATE NOW pill — tappable to go to Motor screen */}
          {needed ? (
            <TouchableOpacity
              style={[styles.heroPill, { backgroundColor: accent }]}
              onPress={() => navigation.navigate('Motor')}
              activeOpacity={0.8}
            >
              <Ionicons name="water" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.heroPillText}>{t("irrigation.status_required")}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.heroPill, { backgroundColor: accent }]}>
              <Text style={styles.heroPillText}>{t("irrigation.status_ok")}</Text>
            </View>
          )}
          <Text style={styles.heroSub}>
            {t("irrigation.generated")}: {new Date(reportData.updatedAt || Date.now()).toLocaleString()}
          </Text>
        </View>

        {/* FIELD DATA */}
        <View style={[styles.dataCard, SHADOWS.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={18} color={accent} />
            <Text style={styles.sectionTitle}>{t("irrigation.field_data")}</Text>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("irrigation.soil_moisture")}</Text>
              <Text style={[styles.gridVal, { color: accent }]}>{inputData.soil_moisture ?? '--'}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("irrigation.soil_temp")}</Text>
              <Text style={styles.gridVal}>{inputData.soil_temperature ?? '--'}°C</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("dashboard.temperature")}</Text>
              <Text style={styles.gridVal}>{inputData.temperature ?? '--'}°C</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("dashboard.humidity")}</Text>
              <Text style={styles.gridVal}>{inputData.humidity ?? '--'}%</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("irrigation.rainfall")}</Text>
              <Text style={styles.gridVal}>{inputData.rainfall ?? '--'} mm</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t("crop.soil_color")}</Text>
              <Text style={[styles.gridVal, { textTransform: 'capitalize' }]}>{inputData.soil_color ?? '--'}</Text>
            </View>
          </View>
        </View>

        {generating ? (
          <View style={[styles.sectionCard, { alignItems: 'center', justifyContent: 'center', minHeight: 150 }, SHADOWS.sm]}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' }}>{t("crop.ml_loading")}</Text>
          </View>
        ) : (
          <>
            {/* FIELD ASSESSMENT */}
            {!!display.assessment && (
              <View style={[styles.highlightBox, { backgroundColor: accent }]}>
                <Text style={styles.highlightTitle}>{t("irrigation.field_assessment")}</Text>
                <Text style={styles.highlightBody}>{display.assessment}</Text>
              </View>
            )}

            {/* WHY */}
            {!!display.reason && (
              <View style={[styles.sectionCard, SHADOWS.sm]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="help-circle" size={18} color={accent} />
                  <Text style={styles.sectionTitle}>{t("irrigation.why_title")}</Text>
                </View>
                <Text style={styles.cardText}>{display.reason}</Text>
              </View>
            )}

            {/* RECOMMENDED ACTION */}
            {!!display.action && (
              <View style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: accent }, SHADOWS.sm]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flash" size={18} color={accent} />
                  <Text style={styles.sectionTitle}>{t("irrigation.action_title")}</Text>
                </View>
                <Text style={styles.cardText}>{display.action}</Text>
              </View>
            )}

            {/* WATER MANAGEMENT TIPS */}
            {display.tips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.sectionGroupTitle}>{t("irrigation.tips_title")}</Text>
                {display.tips.map((tip, idx) => (
                  <View key={idx} style={[styles.tipCard, SHADOWS.sm]}>
                    <Ionicons name="checkmark-circle" size={18} color={accent} style={{ marginTop: 2 }} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* PRECAUTIONS */}
            {display.precautions.length > 0 && (
              <View style={[styles.riskBox, SHADOWS.sm]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning" size={18} color={COLORS.danger} />
                  <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>{t("irrigation.precautions")}</Text>
                </View>
                {display.precautions.map((p, idx) => (
                  <View key={idx} style={styles.riskRow}>
                    <View style={styles.riskDot} />
                    <Text style={styles.riskText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.actions}>
          <Button
            title={downloading ? t("common.saving") : t("irrigation.download_pdf")}
            onPress={handleDownload}
            icon="download"
            variant="primary"
            loading={downloading}
            style={{ marginBottom: SPACING.md, backgroundColor: accent }}
          />
          <Button
            title={t("irrigation.regenerate")}
            onPress={handleRegenerate}
            icon="refresh"
            variant="outline"
            loading={generating}
            textStyle={{ color: accent }}
            style={{ borderColor: accent }}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.base, paddingBottom: SPACING.xxxl },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm, paddingBottom: SPACING.xl + 20,
    gap: SPACING.sm,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.white },

  heroCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center',
    marginTop: -SPACING.xl, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
    borderTopWidth: 4, ...SHADOWS.lg,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round, marginBottom: SPACING.md,
  },
  heroBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'uppercase' },
  heroIconBox:   { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base },
  heroTitle:     { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm },
  heroPill:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: BORDER_RADIUS.round, marginBottom: SPACING.sm },
  heroPillText:  { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  heroSub:       { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  dataCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.base },
  gridRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.background, paddingBottom: SPACING.sm, marginBottom: SPACING.sm },
  gridItem: { flex: 1 },
  gridLabel:{ fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  gridVal:  { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },

  highlightBox:  { borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.base },
  highlightTitle:{ fontSize: FONT_SIZES.md, color: '#fff', fontWeight: '800', marginBottom: SPACING.sm },
  highlightBody: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },

  sectionCard:   { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  sectionTitle:  { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  cardText:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

  tipsContainer:     { marginBottom: SPACING.base },
  sectionGroupTitle: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: COLORS.textTertiary, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: 4 },
  tipCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.base, marginBottom: SPACING.xs, flexDirection: 'row', gap: 10, alignItems: 'flex-start', ...SHADOWS.sm },
  tipText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },

  riskBox:  { backgroundColor: '#FFF5F5', borderRadius: BORDER_RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.xl, borderWidth: 1, borderColor: '#FED7D7' },
  riskRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  riskDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginTop: 8 },
  riskText: { fontSize: FONT_SIZES.sm, color: '#C53030', flex: 1, lineHeight: 20, fontWeight: '600' },

  actions: { marginTop: SPACING.base, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.xl },
});

export default IrrigationDetailScreen;
