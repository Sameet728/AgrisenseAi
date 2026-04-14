// ============================================================
// screens/ProfileScreen.js
// ============================================================

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import Button from "../components/Button";
import ScreenWrapper from "../components/ScreenWrapper";
import { useAuth } from "../context/AuthContext";
import { t } from "../services/i18n";
import { apiGetProfile } from "../services/api";

const ROW = ({ icon, label, value, color }) => (
  <View style={styles.row}>
    <View style={[styles.rowIcon, { backgroundColor: (color || COLORS.primary) + "18" }]}>
      <Ionicons name={icon} size={18} color={color || COLORS.primary} />
    </View>
    <View style={styles.rowBody}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const ProfileScreen = () => {
  const { user, profileData, signOut, appLanguage, changeLanguage, updateUser, updateProfileData } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiGetProfile();
      if (res.success && res.user) {
        // user object in response usually contains both auth and profile fields
        // Update both to ensure everything is in sync
        const fetchedData = res.user;
        const isProfileComplete = !!(
          fetchedData.cropType &&
          fetchedData.soilType &&
          fetchedData.thingSpeakApiKey
        );
        fetchedData.isProfileComplete = isProfileComplete;
        
        await updateUser(fetchedData);
        await updateProfileData(fetchedData);
      }
    } catch (error) {
      console.warn("Failed to refresh profile:", error);
    } finally {
      setRefreshing(false);
    }
  }, [updateUser, updateProfileData]);

  const handleLogout = () => {
    Alert.alert(
      t("profile.signout"),
      t("profile.signout_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("profile.signout"), style: "destructive", onPress: signOut },
      ]
    );
  };

  const handleLanguageChange = async (lang) => {
    if (lang === appLanguage) return;
    await changeLanguage(lang);
  };

  const initials = (profileData?.name || user?.name || "F")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const maskedKey = profileData?.thingSpeakApiKey
    ? profileData.thingSpeakApiKey.slice(0, 4) + "••••••••" + profileData.thingSpeakApiKey.slice(-4)
    : t("profile.not_configured");

  return (
    <ScreenWrapper backgroundColor={COLORS.primary} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.white} />
        }
      >
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profileData?.name || user?.name || t("dashboard.greeting")}</Text>
          <Text style={styles.email}>{profileData?.email || user?.email || ""}</Text>
          <View style={styles.farmBadge}>
            <Ionicons name="leaf" size={12} color={COLORS.white} />
            <Text style={styles.farmBadgeText}>
              {profileData?.farmSize ? profileData.farmSize + " " + t("profile.acres") : t("profile.my_farm")}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <View style={styles.actionSection}>
          <Button
            title={profileData?.isProfileComplete ? t("profile.edit") : t("profile.complete")}
            onPress={() => navigation.navigate("ProfileSetup")}
            icon="create-outline"
            variant={profileData?.isProfileComplete ? "secondary" : "primary"}
            size="lg"
          />
        </View>

        {/* ─── Language Selection ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("auth.language")}</Text>
          <View style={[styles.card, SHADOWS.md, styles.langCard]}>
            <Ionicons name="language" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.langCardLabel}>{t("profile.app_language")}</Text>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langBtn, appLanguage === "en" && styles.langBtnActive]}
                onPress={() => handleLanguageChange("en")}
                activeOpacity={0.8}
              >
                <Text style={[styles.langBtnText, appLanguage === "en" && styles.langBtnTextActive]}>
                  🇬🇧 English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, appLanguage === "mr" && styles.langBtnActive]}
                onPress={() => handleLanguageChange("mr")}
                activeOpacity={0.8}
              >
                <Text style={[styles.langBtnText, appLanguage === "mr" && styles.langBtnTextActive]}>
                  🇮🇳 मराठी
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.basic_details")}</Text>
          <View style={[styles.card, SHADOWS.md]}>
            <ROW icon="person-outline"   label={t("auth.name")}         value={profileData?.name || user?.name || "—"} />
            <View style={styles.divider} />
            <ROW icon="mail-outline"     label={t("auth.email")}        value={profileData?.email || user?.email || "—"} />
            <View style={styles.divider} />
            <ROW icon="call-outline"     label={t("profile.phone")}     value={profileData?.phone || "—"} />
            <View style={styles.divider} />
            <ROW icon="location-outline" label={t("profile.location")}  value={profileData?.location || "—"} />
          </View>
        </View>

        {/* Farm Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.agri_profile")}</Text>
          <View style={[styles.card, SHADOWS.md]}>
            <ROW icon="leaf-outline"  label={t("profile.crop_type")}  value={profileData?.cropType || t("profile.not_configured")}  color={COLORS.success} />
            <View style={styles.divider} />
            <ROW icon="color-palette-outline" label={t("profile.soil_color")} value={profileData?.soilColor || t("profile.not_configured")} color={COLORS.info} />
          </View>
        </View>

        {/* IoT Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.iot_config")}</Text>
          <View style={[styles.card, SHADOWS.md]}>
            <ROW icon="key-outline" label={t("profile.api_key")} value={maskedKey} />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title={t("profile.signout")}
            onPress={handleLogout}
            variant="outline"
            icon="log-out-outline"
            iconPosition="left"
            style={{ borderColor: COLORS.danger, marginTop: SPACING.lg }}
            textStyle={{ color: COLORS.danger }}
          />
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: SPACING.xxxl },

  hero: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.4)",
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: FONT_SIZES.xxl, fontWeight: "800", color: COLORS.white },
  name:       { fontSize: FONT_SIZES.xl,  fontWeight: "800", color: COLORS.white },
  email:      { fontSize: FONT_SIZES.sm,  color: "rgba(255,255,255,0.75)", marginTop: 4 },
  farmBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round, marginTop: SPACING.sm,
  },
  farmBadgeText: { fontSize: FONT_SIZES.sm, color: COLORS.white, fontWeight: "600" },

  actionSection: {
    paddingHorizontal: SPACING.base,
    marginTop: -SPACING.xl,
    paddingBottom: SPACING.md,
  },

  section:      { marginTop: SPACING.lg, paddingHorizontal: SPACING.base },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: "700", color: COLORS.textTertiary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: SPACING.sm,
  },
  card:    { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: "hidden" },
  divider: { height: 1, backgroundColor: COLORS.divider, marginLeft: SPACING.base + 36 + SPACING.sm },

  // Language selector
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    overflow: "visible",
  },
  langCardLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: "600",
    flex: 1,
  },
  langToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  langBtnActive: { backgroundColor: COLORS.primary },
  langBtnText:   { fontSize: FONT_SIZES.xs, fontWeight: "700", color: COLORS.textSecondary },
  langBtnTextActive: { color: COLORS.white },

  row: { flexDirection: "row", alignItems: "center", padding: SPACING.base, gap: SPACING.sm },
  rowIcon: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.sm,
    alignItems: "center", justifyContent: "center",
  },
  rowBody:  { flex: 1 },
  rowLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, fontWeight: "500" },
  rowValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: "600", marginTop: 1 },
});

export default ProfileScreen;
