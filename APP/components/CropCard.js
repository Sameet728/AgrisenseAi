import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const CropCard = ({ cropName, snippet, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top label — same pattern as Fertilizer/Irrigation */}
      <View style={styles.header}>
        <Text style={styles.badgeText}>RECOMMENDED CROP</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={32} color={COLORS.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cropName}>{cropName || 'Analyzing...'}</Text>
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet || 'Tap to view the comprehensive generative report for your soil conditions.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FFF4',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  cropName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22543D',
    marginBottom: 4,
  },
  snippet: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default CropCard;
