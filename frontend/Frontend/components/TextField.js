import { View, TextInput, Text } from "react-native";
import React from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Colors, Fonts, Sizes, CommonStyles } from "../constants/styles";

/**
 * Shared input row (icon + TextInput) on a flat bordered surface.
 * Replaces the `valueBox` style independently redefined in
 * loginScreen.js / registerScreen.js / DriverRegisterScreen.js.
 */
const TextField = ({
  icon,
  error,
  containerStyle,
  rightComponent,
  ...textInputProps
}) => {
  return (
    <View style={containerStyle}>
      <View
        style={{
          ...CommonStyles.rowAlignCenter,
          backgroundColor: Colors.whiteColor,
          borderRadius: Sizes.fixPadding,
          borderWidth: 1,
          borderColor: error ? Colors.redColor : Colors.borderColor,
          paddingHorizontal: Sizes.fixPadding * 1.5,
        }}
      >
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
