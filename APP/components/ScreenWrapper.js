import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";

const ScreenWrapper = ({
  children,
  edges = ["top", "bottom", "left", "right"],
  backgroundColor = COLORS.background,
  style,
  ignoreTop = false,
  ignoreBottom = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // Conditionally process edges if we strictly want to ignore the notch
  // without losing our colored background extensions. Mostly handled by SafeAreaView 
  // but this flexibility helps with edge cases.
  
  const finalEdges = edges.filter(
    (edge) => !(ignoreTop && edge === "top") && !(ignoreBottom && edge === "bottom")
  );

  return (
    <SafeAreaView
      edges={finalEdges}
      style={[styles.container, { backgroundColor }, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;
