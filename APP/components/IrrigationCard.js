import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { t } from '../services/i18n';

const IrrigationCard = ({ irrigationNeeded, snippet, onPress }) => {
  const needed  = irrigationNeeded === true || irrigationNeeded === 1;
  const accent  = needed ? '#C05621' : '#276749';
  const bg      = needed ? '#FFFAF0' : '#F0FFF4';
  const border  = needed ? '#FBD38D' : '#9AE6B4';
  const icon    = needed ? 'water'   : 'checkmark-circle';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bg, borderColor: border }, SHADOWS.sm]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={[styles.badgeText, { color: accent }]}>
          {t("irrigation.badge")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={32} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.decision, { color: accent }]}>
            {needed ? t("irrigation.water_required") : t("irrigation.no_water")}
          </Text>
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet || t("irrigation.loading")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textTertiary} />
      </View>

      {/* Status pill */}
      <View style={[styles.statusPill, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <View style={[styles.statusDot, { backgroundColor: accent }]} />
        <Text style={[styles.statusText, { color: accent }]}>
          {needed ? t("irrigation.status_required") : t("irrigation.status_ok")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  header:    { marginBottom: SPACING.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  content:   { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  textContainer: { flex: 1, marginRight: SPACING.sm },
  decision: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  snippet:  { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 18 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.md, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1, alignSelf: 'flex-start',
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
});

export default IrrigationCard;
