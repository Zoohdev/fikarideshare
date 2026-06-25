import { Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { CommonStyles, Fonts, Colors } from "../constants/styles";

const VARIANT_STYLES = {
  primary: CommonStyles.button,
  outline: CommonStyles.buttonOutline,
  destructive: CommonStyles.buttonDestructive,
};

const VARIANT_TEXT = {
  primary: Fonts.whiteColor18Bold,
  outline: Fonts.primaryColor18Bold,
  destructive: Fonts.whiteColor18Bold,
};

/**
 * Shared CTA button. Replaces the repeated
 * `<TouchableOpacity style={CommonStyles.button}><Text style={Fonts.whiteColor18Bold}>` pattern.
 */
const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;
  const baseStyle = isDisabled ? CommonStyles.buttonDisabled : VARIANT_STYLES[variant];
  const baseTextStyle = isDisabled ? Fonts.grayColor18Medium : VARIANT_TEXT[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[baseStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? Colors.primaryColor : Colors.whiteColor} />
      ) : (
        <Text style={[baseTextStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
