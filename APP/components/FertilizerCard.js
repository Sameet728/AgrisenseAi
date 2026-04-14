import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const FertilizerCard = ({ fertilizerName, snippet, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RECOMMENDED FERTILIZER</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="color-fill" size={32} color={COLORS.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.fertilizerName}>{fertilizerName || 'Analyzing...'}</Text>
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet || 'Structuring precise elemental mappings based on crop constraints...'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7FAFC',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#319795', // Teal variant to differentiate from Crop's deep Green
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
    backgroundColor: '#319795', // Teal variant
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: '#319795',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  fertilizerName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  snippet: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default FertilizerCard;
