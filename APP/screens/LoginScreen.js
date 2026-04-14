// ============================================================
// screens/LoginScreen.js
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
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import Input from "../components/Input";
import Button from "../components/Button";
import ScreenWrapper from "../components/ScreenWrapper";
import { useAuth } from "../context/AuthContext";
import { apiLogin } from "../services/api";
import { validateEmail } from "../utils";
import { t } from "../services/i18n";

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!email)                  e.email    = "Email is required.";
    else if (!validateEmail(email)) e.email = "Enter a valid email.";
    if (!password)               e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiLogin(email.trim(), password);
      await signIn(res.user, res.token);
    } catch (err) {
      Alert.alert("Login Failed", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("rajesh.patil@farm.com");
    setPassword("farm@1234");
    setErrors({});
  };

  return (
    <ScreenWrapper style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={44} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>AgriSense AI</Text>
          <Text style={styles.tagline}>{t("auth.login")}</Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, SHADOWS.lg]}>
          <Text style={styles.heading}>{t("auth.login")}</Text>

          <Input
            label={`${t("auth.email")} *`}
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label={`${t("auth.password")} *`}
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <Button
            title={t("auth.login_btn")}
            onPress={handleLogin}
            loading={loading}
            icon="log-in-outline"
            iconPosition="right"
            size="lg"
            style={{ marginTop: SPACING.sm }}
          />

          {/* Demo button */}
          <TouchableOpacity onPress={fillDemo} style={styles.demoBtn}>
            <Ionicons name="flash-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.demoText}>Fill demo credentials</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.footerLink}>{t("auth.no_account")}</Text>
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
    paddingTop: SPACING.xxxl + 16,
    paddingBottom: SPACING.xxl,
    position: "relative",
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.base,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    letterSpacing: 0.5,
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

  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  demoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryLight,
    fontWeight: "600",
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

export default LoginScreen;
