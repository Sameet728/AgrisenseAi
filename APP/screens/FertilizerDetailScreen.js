import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { generateFertilizerReportPDF } from '../utils/pdfGenerator';
import { apiRegenerateFertilizerRecommendation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { t } from '../services/i18n';
import { translateIfNeeded, translateArrayIfNeeded } from '../services/translate';

const FertilizerDetailScreen = () => {
    const route = useRoute();
    const { user, appLanguage } = useAuth(); // Subscribe for language re-renders

    const [reportData, setReportData] = useState(route.params?.reportData || {});
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showData, setShowData] = useState(false);
    const [translatedInsights, setTranslatedInsights] = useState(null);

    const parsedInsights = useMemo(() => {
        const rawText = reportData.aiInsights || "";
        const sections = rawText.split(/###\s+/);

        const parsed = {
            reason:   t("fertilizer.why_recommended"),
            soil:     t("fertilizer.why_recommended"),
            strategy: [],
            risks:    [],
        };

        sections.forEach(sec => {
            if (!sec.trim()) return;
            const [titleLine, ...bodyLines] = sec.split('\n');
            const title = titleLine.toLowerCase();
            const body  = bodyLines.join('\n').trim();

            if (title.includes('why') || title.includes('reason')) parsed.reason = body;
            else if (title.includes('soil')) parsed.soil = body;
            else if (title.includes('application') || title.includes('strategy')) {
                parsed.strategy = body.includes('-')
                    ? body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean)
                    : [body];
            }
            else if (title.includes('risk') || title.includes('precaution') || title.includes('alert')) {
                parsed.risks = body.includes('-')
                    ? body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean)
                    : [body];
            }
        });
        return parsed;
    }, [reportData.aiInsights]);

    // Auto-translate AI content whenever language or report changes
    useEffect(() => {
        const runTranslation = async () => {
            if (appLanguage !== 'mr') {
                setTranslatedInsights(null);
                return;
            }
            const [reason, soil, strategy, risks] = await Promise.all([
                translateIfNeeded(parsedInsights.reason,   appLanguage),
                translateIfNeeded(parsedInsights.soil,     appLanguage),
                translateArrayIfNeeded(parsedInsights.strategy, appLanguage),
                translateArrayIfNeeded(parsedInsights.risks,    appLanguage),
            ]);
            setTranslatedInsights({ reason, soil, strategy, risks });
        };
        runTranslation();
    }, [appLanguage, parsedInsights]);

    // Use translated or raw insights
    const display = translatedInsights || parsedInsights;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await generateFertilizerReportPDF(reportData, user?.name);
        } catch(err) {
            Alert.alert(t("fertilizer.report_title"), t("crop.pdf_failed"));
        } finally {
            setDownloading(false);
        }
    };

    const handleRegenerate = async () => {
        setGenerating(true);
        try {
            const res = await apiRegenerateFertilizerRecommendation();
            if (res.success && res.data) {
                setReportData(res.data);
            }
        } catch (err) {
            Alert.alert(t("fertilizer.regenerate"), t("crop.regen_failed"));
        } finally {
            setGenerating(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return t("fertilizer.generated");
        return new Date(isoString).toLocaleString();
    };

    const inputData = reportData.inputData || {};

    // Marathi nutrient labels
    const nitrogenLabel   = appLanguage === 'mr' ? 'नायट्रोजन' : 'Nitrogen';
    const phosphorusLabel = appLanguage === 'mr' ? 'फॉस्फरस'  : 'Phosphorus';
    const potassiumLabel  = appLanguage === 'mr' ? 'पोटॅशियम' : 'Potassium';

    const renderProgressBar = (value, label, color) => {
        const fillPercent = Math.min((value / 150) * 100, 100);
        return (
            <View style={styles.progressRow}>
                <View style={styles.progressLabelBox}>
                    <Text style={styles.progressLabel}>{label}</Text>
                    <Text style={styles.progressVal}>{value} mg/kg</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${fillPercent}%`, backgroundColor: color }]} />
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.primary} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Ionicons name="color-fill-outline" size={24} color={COLORS.white} />
                <Text style={styles.headerTitle}>{t("fertilizer.report_title")}</Text>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* HERO SUMMARY */}
                <View style={[styles.heroCard, SHADOWS.lg]}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#319795" />
                        <Text style={styles.heroBadgeText}>{t("fertilizer.highly_suitable")}</Text>
                    </View>
                    <View style={styles.heroIconBox}>
                        <Ionicons name="flask" size={40} color="#319795" />
                    </View>
                    <Text style={styles.heroTitle}>{reportData.recommendedFertilizer || "..."}</Text>
                    <Text style={styles.heroTimestamp}>{t("fertilizer.generated")}: {formatDate(reportData.updatedAt || reportData.createdAt)}</Text>
                </View>

                {/* DATA USED (COLLAPSIBLE) */}
                <TouchableOpacity
                    style={[styles.collapseBtn, SHADOWS.sm]}
                    activeOpacity={0.8}
                    onPress={() => setShowData(!showData)}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Ionicons name="bar-chart-outline" size={20} color="#319795" />
                        <Text style={styles.collapseText}>{t("fertilizer.data_used")}</Text>
                    </View>
                    <Ionicons name={showData ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {showData && (
                    <View style={[styles.dataGridCard, SHADOWS.sm]}>
                        <View style={styles.gridRow}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.soil_color")}</Text>
                                <Text style={[styles.gridVal, { textTransform: 'capitalize' }]}>{inputData.crop || '--'}</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.soil_ph")}</Text>
                                <Text style={styles.gridVal}>{inputData.ph || '--'}</Text>
                            </View>
                        </View>
                        <View style={styles.gridRow}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.nitrogen")}</Text>
                                <Text style={styles.gridVal}>{inputData.nitrogen || '--'} <Text style={styles.gridUnit}>mg</Text></Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.phosphorus")}</Text>
                                <Text style={styles.gridVal}>{inputData.phosphorus || '--'} <Text style={styles.gridUnit}>mg</Text></Text>
                            </View>
                        </View>
                        <View style={[styles.gridRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.potassium")}</Text>
                                <Text style={styles.gridVal}>{inputData.potassium || '--'} <Text style={styles.gridUnit}>mg</Text></Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.latest_temp")}</Text>
                                <Text style={styles.gridVal}>{inputData.temperature || '--'} <Text style={styles.gridUnit}>°C</Text></Text>
                            </View>
                        </View>
                    </View>
                )}

                {generating ? (
                    <View style={[styles.reportCard, SHADOWS.md, { alignItems: 'center', justifyContent: 'center' }]}>
                        <ActivityIndicator size="large" color="#319795" />
                        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' }}>
                            {t("crop.ml_loading")}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* WHY THIS FERTILIZER */}
                        <View style={styles.highlightBox}>
                            <Text style={styles.highlightTitle}>
                                {t("fertilizer.why_recommended")} — {reportData.recommendedFertilizer || ''} {t("fertilizer.is_recommended")}
                            </Text>
                            <Text style={styles.highlightBody}>{display.reason}</Text>
                        </View>

                        {/* NUTRIENT ANALYSIS */}
                        <View style={[styles.sectionCard, SHADOWS.sm]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="podium" size={20} color="#319795" />
                                <Text style={styles.sectionTitle}>{t("fertilizer.nutrient_analysis")}</Text>
                            </View>
                            <Text style={[styles.cardText, { marginBottom: SPACING.md }]}>
                                {appLanguage === 'mr'
                                    ? 'खत घालण्यापूर्वीचे NPK प्रमाण:'
                                    : 'Your fundamental NPK bounds mapped before fertilizer addition:'}
                            </Text>
                            {renderProgressBar(inputData.nitrogen   || 0, nitrogenLabel,   "#38A169")}
                            {renderProgressBar(inputData.phosphorus || 0, phosphorusLabel, "#3182CE")}
                            {renderProgressBar(inputData.potassium  || 0, potassiumLabel,  "#DD6B20")}
                        </View>

                        {/* SOIL IMPROVEMENT */}
                        <View style={[styles.sectionCard, SHADOWS.sm]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="leaf" size={20} color="#48BB78" />
                                <Text style={styles.sectionTitle}>{t("crop.soil_health")}</Text>
                            </View>
                            <Text style={styles.cardText}>{display.soil}</Text>
                        </View>

                        {/* APPLICATION STRATEGY */}
                        {display.strategy.length > 0 && (
                            <View style={styles.tipsContainer}>
                                <Text style={styles.sectionGroupTitle}>{t("fertilizer.application_guide")}</Text>
                                {display.strategy.map((tip, idx) => (
                                    <View key={idx} style={[styles.tipCard, SHADOWS.sm]}>
                                        <Ionicons name="checkmark-circle" size={18} color="#319795" style={{marginTop: 2}} />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* RISKS */}
                        {display.risks.length > 0 && (
                            <View style={[styles.riskBox, SHADOWS.sm]}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="warning" size={20} color={COLORS.danger} />
                                    <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>{t("fertilizer.risks")}</Text>
                                </View>
                                {display.risks.map((risk, idx) => (
                                    <View key={idx} style={styles.riskRow}>
                                        <View style={styles.riskDot} />
                                        <Text style={styles.riskText}>{risk}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                <View style={styles.actions}>
                    <Button
                        title={downloading ? t("common.saving") : t("fertilizer.download_pdf")}
                        onPress={handleDownload}
                        icon="download"
                        variant="primary"
                        loading={downloading}
                        style={{ marginBottom: SPACING.md, backgroundColor: "#319795" }}
                    />
                    <Button
                        title={t("fertilizer.regenerate")}
                        onPress={handleRegenerate}
                        icon="refresh"
                        variant="outline"
                        loading={generating}
                        textStyle={{ color: "#319795" }}
                        style={{ borderColor: "#319795" }}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },

    header: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xl + 20,
        gap: SPACING.sm
    },
    headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.white },

    heroCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        marginTop: -SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.lg
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6FFFA',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.round,
        gap: 4,
        marginBottom: SPACING.md
    },
    heroBadgeText: { fontSize: FONT_SIZES.xs, color: '#319795', fontWeight: '700', textTransform: 'uppercase' },
    heroIconBox: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#E6FFFA',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.base
    },
    heroTitle:     { fontSize: 32, fontWeight: '800', color: '#1A202C' },
    heroTimestamp: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.xs },

    collapseBtn: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.base,
        borderLeftWidth: 4,
        borderLeftColor: '#319795'
    },
    collapseText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },

    dataGridCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.lg,
    },
    gridRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
        paddingBottom: SPACING.sm,
        marginBottom: SPACING.sm
    },
    gridItem:  { flex: 1 },
    gridLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
    gridVal:   { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
    gridUnit:  { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },

    highlightBox: {
        backgroundColor: '#2C7A7B',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        marginBottom: SPACING.base,
        ...SHADOWS.md
    },
    highlightTitle: { fontSize: FONT_SIZES.lg, color: COLORS.white, fontWeight: '800', marginBottom: SPACING.sm },
    highlightBody:  { fontSize: FONT_SIZES.sm, color: "rgba(255,255,255,0.9)", lineHeight: 22 },

    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.base
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    sectionTitle:  { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
    cardText:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

    progressRow:      { marginBottom: 12 },
    progressLabelBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
    progressVal:      { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    progressTrack:    { height: 8, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' },
    progressFill:     { height: '100%', borderRadius: 4 },

    tipsContainer:    { marginTop: SPACING.sm, marginBottom: SPACING.base },
    sectionGroupTitle:{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.textTertiary, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: 4 },
    tipCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.base,
        marginBottom: SPACING.xs,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start'
    },
    tipText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },

    riskBox: {
        backgroundColor: '#FFF5F5',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: '#FED7D7'
    },
    riskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
    riskDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginTop: 8 },
    riskText: { fontSize: FONT_SIZES.sm, color: '#C53030', flex: 1, lineHeight: 20, fontWeight: '600' },

    actions: {
        marginTop: SPACING.base,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.xl
    },
    reportCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, minHeight: 200 }
});

export default FertilizerDetailScreen;
