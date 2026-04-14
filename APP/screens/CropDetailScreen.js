import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { generateCropReportPDF } from '../utils/pdfGenerator';
import { apiRegenerateCropRecommendation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { t } from '../services/i18n';
import { translateIfNeeded, translateArrayIfNeeded } from '../services/translate';

const CropDetailScreen = () => {
    const route = useRoute();
    const { user, appLanguage } = useAuth(); // Subscribe to language changes → re-render
    
    const [reportData, setReportData] = useState(route.params?.reportData || {});
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showData, setShowData] = useState(false);
    const [translatedInsights, setTranslatedInsights] = useState(null); // Holds translated AI text

    const parsedInsights = useMemo(() => {
        const rawText = reportData.aiInsights || "";
        const sections = rawText.split(/###\s+/);
        
        const parsed = {
        reason: t("crop.ml_loading"),
        soil: t("crop.ml_loading"),
        weather: t("crop.ml_loading"),
            tips: [],
            risks: [],
        };

        sections.forEach(sec => {
            if (!sec.trim()) return;
            const [titleLine, ...bodyLines] = sec.split('\n');
            const title = titleLine.toLowerCase();
            const body = bodyLines.join('\n').trim();

            if (title.includes('why') || title.includes('reason')) parsed.reason = body;
            else if (title.includes('soil')) parsed.soil = body;
            else if (title.includes('weather') || title.includes('suitability')) parsed.weather = body;
            else if (title.includes('tip') || title.includes('farm')) {
                parsed.tips = body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean);
            }
            else if (title.includes('risk') || title.includes('precaution') || title.includes('alert')) {
                // If it's a paragraph rather than a list, we still map it as a single array element if no dashes exist
                if (body.includes('-')) {
                    parsed.risks = body.split('\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean);
                } else {
                    parsed.risks = [body];
                }
            }
        });
        return parsed;
    }, [reportData.aiInsights]);

    // Auto-translate AI content whenever language or report changes
    useEffect(() => {
        const runTranslation = async () => {
            if (appLanguage !== 'mr') {
                setTranslatedInsights(null); // Use raw English
                return;
            }
            const [reason, soil, weather, tips, risks] = await Promise.all([
                translateIfNeeded(parsedInsights.reason, appLanguage),
                translateIfNeeded(parsedInsights.soil,   appLanguage),
                translateIfNeeded(parsedInsights.weather, appLanguage),
                translateArrayIfNeeded(parsedInsights.tips,  appLanguage),
                translateArrayIfNeeded(parsedInsights.risks, appLanguage),
            ]);
            setTranslatedInsights({ reason, soil, weather, tips, risks });
        };
        runTranslation();
    }, [appLanguage, parsedInsights]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await generateCropReportPDF(reportData, user?.name);
        } catch(err) {
            Alert.alert("PDF Failed", "Unable to generate the document at this time.");
        } finally {
            setDownloading(false);
        }
    };

    const handleRegenerate = async () => {
        setGenerating(true);
        try {
            const res = await apiRegenerateCropRecommendation();
            if (res.success && res.data) {
                setReportData(res.data);
            }
        } catch (err) {
            Alert.alert("Generation Failed", "Could not reach the Machine Learning cluster.");
        } finally {
            setGenerating(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return t("crop.generated");
        return new Date(isoString).toLocaleString();
    };

    const inputData = reportData.inputData || {};
    // Use translated insights if Marathi is selected, else use raw parsed
    const displayInsights = translatedInsights || parsedInsights;

    return (
        <ScreenWrapper backgroundColor={COLORS.primary} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Ionicons name="hardware-chip-outline" size={24} color={COLORS.white} />
                <Text style={styles.headerTitle}>{t("crop.report_title")}</Text>
            </View>

            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* 🌾 SECTION 1: CROP SUMMARY HERO */}
                <View style={[styles.heroCard, SHADOWS.lg]}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.heroBadgeText}>{t("crop.highly_suitable")}</Text>
                    </View>
                    <View style={styles.heroIconBox}>
                        <Ionicons name="leaf" size={40} color={COLORS.success} />
                    </View>
                    <Text style={styles.heroTitle}>{reportData.recommendedCrop || "..."}</Text>
                    <Text style={styles.heroTimestamp}>{t("crop.generated")}: {formatDate(reportData.updatedAt || reportData.createdAt)}</Text>
                </View>

                {/* 📥 DATA USED (COLLAPSIBLE) */}
                <TouchableOpacity 
                    style={[styles.collapseBtn, SHADOWS.sm]} 
                    activeOpacity={0.8}
                    onPress={() => setShowData(!showData)}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Ionicons name="bar-chart-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.collapseText}>{t("crop.data_used")}</Text>
                    </View>
                    <Ionicons name={showData ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {showData && (
                    <View style={[styles.dataGridCard, SHADOWS.sm]}>
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
                        <View style={styles.gridRow}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.potassium")}</Text>
                                <Text style={styles.gridVal}>{inputData.potassium || '--'} <Text style={styles.gridUnit}>mg</Text></Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.soil_ph")}</Text>
                                <Text style={styles.gridVal}>{inputData.ph || '--'}</Text>
                            </View>
                        </View>
                        <View style={[styles.gridRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>{t("crop.soil_color")}</Text>
                                <Text style={[styles.gridVal, { textTransform: 'capitalize' }]}>{inputData.soil_color || '--'}</Text>
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
                        <ActivityIndicator size="large" color={COLORS.success} />
                        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' }}>{t("crop.ml_loading")}</Text>
                    </View> 
                ) : (
                    <>
                        <View style={styles.highlightBox}>
                            <Text style={styles.highlightTitle}>{t("crop.why_recommended")} {reportData.recommendedCrop || ''} {t("crop.is_recommended")}</Text>
                            <Text style={styles.highlightBody}>{displayInsights.reason}</Text>
                        </View>

                        {/* SOIL */}
                        <View style={[styles.sectionCard, SHADOWS.sm]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="earth" size={20} color={COLORS.primary} />
                                <Text style={styles.sectionTitle}>{t("crop.soil_health")}</Text>
                            </View>
                            <Text style={styles.cardText}>{displayInsights.soil}</Text>
                        </View>

                        {/* WEATHER */}
                        <View style={[styles.sectionCard, SHADOWS.sm]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="partly-sunny" size={20} color={"#D69E2E"} />
                                <Text style={styles.sectionTitle}>{t("crop.weather_suit")}</Text>
                            </View>
                            <Text style={styles.cardText}>{displayInsights.weather}</Text>
                        </View>

                        {/* 🚜 SECTION 5: TIPS */}
                        {displayInsights.tips.length > 0 && (
                            <View style={styles.tipsContainer}>
                                <Text style={styles.sectionGroupTitle}>{t("crop.expert_tips")}</Text>
                                {displayInsights.tips.map((tip, idx) => (
                                    <View key={idx} style={[styles.tipCard, SHADOWS.sm]}>
                                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{marginTop: 2}} />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* ⚠️ SECTION 6: RISKS */}
                        {displayInsights.risks.length > 0 && (
                            <View style={[styles.riskBox, SHADOWS.sm]}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="warning" size={20} color={COLORS.danger} />
                                    <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>{t("crop.risks")}</Text>
                                </View>
                                {displayInsights.risks.map((risk, idx) => (
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
                        title={downloading ? t("common.saving") : t("crop.download_pdf")} 
                        onPress={handleDownload}
                        icon="download"
                        variant="primary"
                        loading={downloading}
                        style={{ marginBottom: SPACING.md }}
                    />
                    <Button 
                        title={t("crop.regenerate")} 
                        onPress={handleRegenerate}
                        icon="refresh"
                        variant="outline"
                        loading={generating}
                        textStyle={{ color: COLORS.success }}
                        style={{ borderColor: COLORS.success }}
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
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.round,
        gap: 4,
        marginBottom: SPACING.md
    },
    heroBadgeText: { fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: '700', textTransform: 'uppercase' },
    heroIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FFF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.base
    },
    heroTitle: { fontSize: 32, fontWeight: '800', color: '#1A202C' },
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
        borderLeftColor: COLORS.primary
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
    gridItem: { flex: 1 },
    gridLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
    gridVal: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
    gridUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },

    highlightBox: {
        backgroundColor: '#2F855A',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        marginBottom: SPACING.base,
        ...SHADOWS.md
    },
    highlightTitle: { fontSize: FONT_SIZES.lg, color: COLORS.white, fontWeight: '800', marginBottom: SPACING.sm },
    highlightBody: { fontSize: FONT_SIZES.sm, color: "rgba(255,255,255,0.9)", lineHeight: 22 },

    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.base
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
    cardText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },

    tipsContainer: { marginTop: SPACING.sm, marginBottom: SPACING.base },
    sectionGroupTitle: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.textTertiary, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: 4 },
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

export default CropDetailScreen;
