import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import ScreenWrapper from "../components/ScreenWrapper";
import Button from "../components/Button";
import Dropdown from "../components/Dropdown";
import { apiUpdateProfile } from "../services/api";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import { t } from "../services/i18n";

import districtsRaw from "../constants/districts.json";
import cropsRaw from "../constants/crops.json";
import soilColorsRaw from "../constants/soilColors.json";

const ProfileSetupScreen = () => {
  const { user, profileData, updateProfileData } = useAuth();
  const navigation = useNavigation();
  
  // Basic info (Mandatory)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Farm Details (Optional)
  const [cropType, setCropType] = useState("");
  const [soilColor, setSoilColor] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [irrigationType, setIrrigationType] = useState("");
  const [thingSpeakApiKey, setThingSpeakApiKey] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill if fields already exist (e.g., from auth user object or partial profileData)
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
    if (profileData) {
      if (profileData.name) setName(profileData.name);
      if (profileData.email) setEmail(profileData.email);
      if (profileData.phone) setPhone(profileData.phone);
      if (profileData.location) setLocation(profileData.location);
      if (profileData.cropType) setCropType(profileData.cropType);
      if (profileData.soilColor) setSoilColor(profileData.soilColor);
      if (profileData.farmSize) setFarmSize(profileData.farmSize);
      if (profileData.irrigationType) setIrrigationType(profileData.irrigationType);
      if (profileData.thingSpeakApiKey) setThingSpeakApiKey(profileData.thingSpeakApiKey);
    }
  }, [user, profileData]);

  const validateMandatory = () => {
    if (!name.trim() || !phone.trim() || !location.trim()) {
      Alert.alert("Missing Fields", "Please complete all mandatory basic information fields.");
      return false;
    }
    // Basic phone validation check (minimum digits)
    const phoneRegex = /^[0-9+\s\-]{7,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      Alert.alert("Invalid Format", "Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const handleSave = async (skipOptional = false) => {
    if (!validateMandatory()) return;
    
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        cropType: skipOptional ? "" : cropType.trim(),
        soilColor: skipOptional ? "" : soilColor.trim(),
        farmSize: skipOptional ? "" : farmSize.trim(),
        irrigationType: skipOptional ? "" : irrigationType.trim(),
        thingSpeakApiKey: skipOptional ? "" : thingSpeakApiKey.trim(),
      };
      
      // Save globally to Backend MongoDB Base
      await apiUpdateProfile(payload);

      // Save locally to App State (AsyncStorage)
      await updateProfileData(payload);

      // If we are already onboarded, we must be editing, so we should jump back intelligently.
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.background} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("profile.title")}</Text>
          <Text style={styles.subtitle}>{t("profile.instruction")}</Text>
        </View>

        {/* Basic Info (Mandatory) */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t("profile.mandatory")}</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("auth.name")} *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t("auth.name")} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("auth.email")} *</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("profile.phone")} *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. +91 9876543210" keyboardType="phone-pad" />
          </View>

          <Dropdown 
            label={`${t("profile.location")} *`} 
            value={location} 
            data={districtsRaw} 
            onSelect={setLocation} 
          />
        </View>

        {/* Farm Details (Optional) */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={20} color={COLORS.success} />
            <Text style={styles.cardTitle}>{t("profile.optional")}</Text>
          </View>
          
          <Dropdown 
            label={t("profile.crop_type")} 
            value={cropType} 
            data={cropsRaw} 
            onSelect={setCropType} 
          />

          <Dropdown 
            label={t("profile.soil_color")} 
            value={soilColor} 
            data={soilColorsRaw} 
            onSelect={setSoilColor} 
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("profile.farm_size")}</Text>
            <TextInput style={styles.input} value={farmSize} onChangeText={setFarmSize} placeholder="e.g. 5" keyboardType="numeric" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("profile.api_key")}</Text>
            <TextInput style={styles.input} value={thingSpeakApiKey} onChangeText={setThingSpeakApiKey} placeholder="API Key" />
          </View>
        </View>

        <View style={styles.actions}>
          <Button title={t("common.save")} onPress={() => handleSave(false)} loading={loading} style={styles.saveBtn} size="lg" />
          <Button title={t("common.cancel")} onPress={() => navigation.goBack()} variant="outline" disabled={loading} size="lg" />
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  header: { marginBottom: SPACING.xl, marginTop: SPACING.lg, paddingHorizontal: SPACING.sm },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md, gap: SPACING.sm },
  cardTitle: { fontSize: FONT_SIZES.base, fontWeight: "700", color: COLORS.textPrimary },
  hintText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginBottom: SPACING.md, fontStyle: "italic" },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.base, color: COLORS.textPrimary, backgroundColor: COLORS.surface },
  inputDisabled: { backgroundColor: COLORS.border, color: COLORS.textSecondary },
  actions: { gap: SPACING.md, marginTop: SPACING.sm },
});

export default ProfileSetupScreen;
