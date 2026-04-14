import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, 
  FlatList, StyleSheet, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { t } from '../services/i18n';

/**
 * A highly reusable, completely restricted Picker component designed 
 * to prevent manual typographical errors and standardize agronomic data.
 */
const Dropdown = ({ label, value, data, onSelect, placeholder = t("common.select") }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownButton} 
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.valueText, !value && { color: COLORS.textDisabled }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <SafeAreaView style={styles.modalBg}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setVisible(false)} 
          />
          <View style={styles.sheetContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.itemBtn, value === item && styles.itemBtnActive]} 
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.itemText, value === item && styles.itemTextActive]}>
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.base },
  label: { 
    fontSize: FONT_SIZES.sm, 
    color: COLORS.textSecondary, 
    fontWeight: "600", 
    marginBottom: SPACING.xs 
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueText: { fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalOverlay: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '75%',
    minHeight: '40%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: "800", color: COLORS.textPrimary },
  itemBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  itemBtnActive: { backgroundColor: COLORS.primaryFaint },
  itemText: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  itemTextActive: { fontWeight: "700", color: COLORS.primary },
});

export default Dropdown;
