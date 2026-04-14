// ============================================================
// screens/SignupScreen.js
// ============================================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import Input from "../components/Input";
import Button from "../components/Button";
import ScreenWrapper from "../components/ScreenWrapper";
import { apiSignup } from "../services/api";
import { saveApiKey } from "../services/storage";
import { validateEmail } from "../utils";
import { t } from "../services/i18n";

const SignupScreen = ({ navigation }) => {
  const { signIn } = useAuth();

  const [form,    setForm]    = useState({ name: "", email: "", password: "", apiKey: "" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const update = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name     = "Full name is required.";
    if (!form.email)              e.email    = "Email is required.";
    else if (!validateEmail(form.email)) e.email = "Enter a valid email.";
    if (!form.password)           e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Minimum 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Pass the selected form language to backend natively
      const res = await apiSignup(form.name.trim(), form.email.trim(), form.password, form.apiKey.trim());
      if (form.apiKey.trim()) await saveApiKey(form.apiKey.trim());
      await signIn(res.user, res.token);
    } catch (err) {
      Alert.alert("Signup Failed", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>AgriSense AI</Text>
          <Text style={styles.tagline}>{t("auth.signup")}</Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, SHADOWS.lg]}>
          <Text style={styles.heading}>{t("auth.signup")}</Text>

          <Input
            label={`${t("auth.name")} *`}
            placeholder={t("auth.name")}
            value={form.name}
            onChangeText={update("name")}
            icon="person-outline"
            autoCapitalize="words"
            error={errors.name}
          />

          <Input
            label={`${t("auth.email")} *`}
            placeholder="you@example.com"
            value={form.email}
            onChangeText={update("email")}
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label={`${t("auth.password")} *`}
            placeholder="Min 6"
            value={form.password}
            onChangeText={update("password")}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          {/* ThingSpeak API Key */}
          <View style={styles.apiKeySection}>
            <View style={styles.apiKeyHeader}>
              <Ionicons name="key-outline" size={16} color={COLORS.primaryLight} />
              <Text style={styles.apiKeyTitle}>{t("profile.api_key")}</Text>
              <Text style={styles.optional}>({t("profile.optional")})</Text>
            </View>
            <Input
              placeholder="API Key"
              value={form.apiKey}
              onChangeText={update("apiKey")}
              icon="code-slash-outline"
            />
          </View>

          <Button
            title={t("auth.signup_btn")}
            onPress={handleSignup}
            loading={loading}
            icon="checkmark-circle-outline"
            iconPosition="right"
            size="lg"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}>{t("auth.have_account")}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, paddingBottom: SPACING.xxxl },

  hero: {
    alignItems: "center",
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    position: "absolute",
    left: SPACING.base,
    top: SPACING.xxxl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  langBtn: {
    position: "absolute",
    right: SPACING.base,
    top: SPACING.xxxl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    ...SHADOWS.md
  },
  langBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.primary
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
  },
  heading: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  apiKeySection: {
    backgroundColor: COLORS.primaryFaint,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  apiKeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  apiKeyTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  optional: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  apiKeyHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: { fontSize: FONT_SIZES.sm, color: "rgba(255,255,255,0.7)" },
  footerLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default SignupScreen;
