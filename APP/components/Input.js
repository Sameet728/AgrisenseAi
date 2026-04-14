// ============================================================
// components/Input.js
// ============================================================

import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  error,
  helper,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = "none",
  editable = true,
  style,
  inputStyle,
  rightElement,
}) => {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isSecure = secureTextEntry && !showPass;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          error  && styles.containerError,
          !editable && styles.containerDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? COLORS.primary : COLORS.textTertiary}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          style={[styles.input, icon && styles.inputWithIcon, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDisabled}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass((p) => !p)} style={styles.iconRight}>
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}

        {rightElement && !secureTextEntry && (
          <View style={styles.iconRight}>{rightElement}</View>
        )}
      </View>

      {error  && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.base },

  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
  },
  containerFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFaint },
  containerError:   { borderColor: COLORS.danger },
  containerDisabled:{ backgroundColor: COLORS.surfaceAlt, opacity: 0.7 },

  iconLeft:  { marginRight: SPACING.sm },
  iconRight: { marginLeft: SPACING.sm },

  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  inputWithIcon: {},

  errorText:  { fontSize: FONT_SIZES.xs, color: COLORS.danger,  marginTop: 4 },
  helperText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 4 },
});

export default Input;
