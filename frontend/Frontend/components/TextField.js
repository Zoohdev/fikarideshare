import { View, TextInput, Text } from "react-native";
import React from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Colors, Fonts, Sizes, CommonStyles } from "../constants/styles";

/**
 * Shared input row (icon + TextInput) on a flat bordered surface.
 * Replaces the `valueBox` style independently redefined in
 * loginScreen.js / registerScreen.js / DriverRegisterScreen.js.
 *
 * `label` is from the premium redesign - purely presentational, opt-in.
 *
 * Deliberately NOT doing a focus-driven style re-render here (gold
 * border/shadow on focus) - confirmed on-device that toggling a dynamic
 * `elevation` style on this view's onFocus causes the keyboard to flash
 * and immediately dismiss on this app's setup (New Architecture +
 * Android), making the field untypeable. Not worth the visual polish.
 */
const TextField = ({
  icon,
  label,
  error,
  containerStyle,
  rightComponent,
  ...textInputProps
}) => {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor: error ? Colors.redColor : Colors.borderColor }]}>
        {icon ? (
          <MaterialIcons
            name={icon}
            size={20}
            color={Colors.mutedTextColor}
            style={{ marginRight: Sizes.fixPadding }}
          />
        ) : null}
        <TextInput
          placeholderTextColor={Colors.mutedTextColor}
          style={{
            flex: 1,
            paddingVertical: Sizes.fixPadding * 1.4,
            ...Fonts.blackColor15Medium,
          }}
          {...textInputProps}
        />
        {rightComponent}
      </View>
      {error ? (
        <Text style={{ ...Fonts.redColor14Medium, marginTop: 4.0 }}>{error}</Text>
      ) : null}
    </View>
  );
};

export default TextField;

const styles = {
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.mutedTextColor,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Montserrat_SemiBold",
  },
  inputRow: {
    ...CommonStyles.rowAlignCenter,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding + 1,
    borderWidth: 1.5,
    paddingHorizontal: Sizes.fixPadding * 1.5,
  },
};
