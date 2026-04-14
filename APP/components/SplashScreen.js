import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING } from "../constants/theme";

const SplashScreen = ({ onFinish }) => {
  const [logoAnim] = useState(new Animated.Value(0));
  const [appName, setAppName] = useState("");
  const [tagline, setTagline] = useState("");
  const onFinishRef = useRef(onFinish);

  const fullAppName = "AgriSense AI";
  const fullTagline = "Smart Farming. Real Insights.";

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let mounted = true;

    const typeText = (text, setter, speed) => {
      return new Promise((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
          if (!mounted) {
            clearInterval(interval);
            resolve();
            return;
          }
          setter(text.substring(0, i + 1));
          i++;
          if (i >= text.length) {
            clearInterval(interval);
            resolve();
          }
        }, speed);
      });
    };

    const runAnimation = async () => {
      // 1. Fade in the logo
      await new Promise((resolve) => {
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(resolve);
      });

      if (!mounted) return;

      // 2. Type out the App Name
      await typeText(fullAppName, setAppName, 80);
      
      if (!mounted) return;

      // 3. Type out the Tagline dynamically
      await typeText(fullTagline, setTagline, 40);

      if (!mounted) return;

      // 4. Wait briefly, then proceed to app
      setTimeout(() => {
        if (mounted && onFinishRef.current) {
          onFinishRef.current();
        }
      }, 1200);
    };

    runAnimation();

    return () => {
      mounted = false;
    };
  }, [logoAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View style={[styles.logoCircle, { opacity: logoAnim, transform: [{ scale: logoAnim }] }]}>
          <Ionicons name="leaf" size={64} color={COLORS.white} />
        </Animated.View>
        
        {/* Placeholder heights prevent layout shifting while typing */}
        <View style={{ height: FONT_SIZES.hero + 16, alignItems: "center", justifyContent: "center" }}>
          <Text style={styles.appName}>{appName}</Text>
        </View>
        <View style={{ height: FONT_SIZES.md + 4, marginTop: 8, alignItems: "center", justifyContent: "center" }}>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: {
    fontSize: FONT_SIZES.hero,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
