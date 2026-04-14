// ============================================================
// navigation/AppNavigator.js
// ============================================================

import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { COLORS, FONT_SIZES, SPACING } from "../constants/theme";

// Screens
import LoginScreen    from "../screens/LoginScreen";
import SignupScreen   from "../screens/SignupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import InsightsScreen  from "../screens/InsightsScreen";
import MotorScreen     from "../screens/MotorScreen";
import ProfileScreen   from "../screens/ProfileScreen";
import LoadingScreen   from "../components/LoadingScreen";
import SplashScreen    from "../components/SplashScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import CropDetailScreen from "../screens/CropDetailScreen";
import FertilizerDetailScreen from "../screens/FertilizerDetailScreen";
import IrrigationDetailScreen from "../screens/IrrigationDetailScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon config ──────────────────────────────────────────
const TAB_CONFIG = {
  Dashboard: { icon: "home",       iconFocused: "home"       },
  Insights:  { icon: "bulb-outline", iconFocused: "bulb"    },
  Motor:     { icon: "water-outline", iconFocused: "water"  },
  Profile:   { icon: "person-outline", iconFocused: "person"},
};

// ── Custom Tab Bar Label ─────────────────────────────────────
const TabLabel = ({ label, focused }) => (
  <Text
    style={{
      fontSize: FONT_SIZES.xs,
      fontWeight: focused ? "700" : "500",
      color: focused ? COLORS.primary : COLORS.textDisabled,
      marginBottom: Platform.OS === "ios" ? 0 : 4,
    }}
  >
    {label}
  </Text>
);

// ── Bottom Tab Screen Headers ────────────────────────────────
const SCREEN_HEADERS = {
  Dashboard: { title: "AgriSense AI", subtitle: "Farm Dashboard" },
  Insights:  { title: "AI Insights",  subtitle: null },
  Motor:     { title: "Motor Control",subtitle: null },
  Profile:   { title: "Profile",      subtitle: null },
};

// ── Main Tab Navigator ────────────────────────────────────────
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
      const cfg = TAB_CONFIG[route.name] || {};
      return {
        headerShown: false,
        tabBarIcon: ({ focused, size }) => (
          <Ionicons
            name={focused ? cfg.iconFocused : cfg.icon}
            size={size}
            color={focused ? COLORS.primary : COLORS.textDisabled}
          />
        ),
        tabBarLabel: ({ focused }) => (
          <TabLabel label={route.name} focused={focused} />
        ),
        tabBarStyle: [styles.tabBar, { height: Platform.OS === "ios" ? 64 + insets.bottom : 64, paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.xs }],
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDisabled,
      };
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Insights"  component={InsightsScreen}  />
    <Tab.Screen name="Motor"     component={MotorScreen}     />
    <Tab.Screen name="Profile"   component={ProfileScreen}   />
  </Tab.Navigator>
  );
};

// ── App Stack (For Post-Onboarding Navigation) ───────────────
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen 
      name="ProfileSetup" 
      component={ProfileSetupScreen}
      options={{ animation: "slide_from_bottom" }}
    />
    <Stack.Screen 
      name="CropDetail" 
      component={CropDetailScreen}
      options={{ animation: "slide_from_right" }}
    />
    <Stack.Screen
      name="FertilizerDetail"
      component={FertilizerDetailScreen}
      options={{ animation: "slide_from_right" }}
    />
    <Stack.Screen
      name="IrrigationDetail"
      component={IrrigationDetailScreen}
      options={{ animation: "slide_from_right" }}
    />
  </Stack.Navigator>
);

// ── Auth Stack ────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"  component={LoginScreen}  />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

// ── Root Navigator ────────────────────────────────────────────
const AppNavigator = () => {
  const { user, loading, profileData } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  // Show splash until both auth finishes loading AND the custom 2-second animation ends
  if (loading || !splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  // User is considered "Onboarded" if the mandatory fields (name, phone, location) exist.
  const hasOnboarded = !!(profileData && profileData.name && profileData.phone && profileData.location);

  return (
    <NavigationContainer>
      {user ? (
        hasOnboarded ? <AppStack /> : <ProfileSetupScreen />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    paddingTop: SPACING.xs,
  },
});

export default AppNavigator;
