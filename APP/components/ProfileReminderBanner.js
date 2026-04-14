import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";

const ProfileReminderBanner = () => {
  const { profileData } = useAuth();
  const navigation = useNavigation();

  // If profile is fully complete, or data hasn't loaded yet, don't show the banner.
  if (!profileData || profileData.isProfileComplete) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("Profile")}
      style={styles.bannerContainer}
    >
      <Ionicons name="warning" size={18} color={COLORS.warning} />
      <Text style={styles.bannerText}>
        ⚠️ Complete your profile for accurate AI insights
      </Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: "600",
  },
});

export default ProfileReminderBanner;
