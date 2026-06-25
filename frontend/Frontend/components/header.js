import { Text, View } from "react-native";
import React from "react";
import { CommonStyles, Fonts, Sizes, Colors } from "../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const Header = ({ title, navigation, rightComponent }) => {
  return (
    <View
      style={{
        backgroundColor: Colors.primaryColor,
        ...CommonStyles.rowAlignCenter,
        paddingHorizontal: Sizes.fixPadding * 2.0,
        paddingVertical: Sizes.fixPadding * 1.5,
      }}
    >
      <MaterialIcons
        name="arrow-back-ios"
        color={Colors.whiteColor}
        size={22}
        onPress={() => {
          navigation.pop();
        }}
      />
      <Text
        numberOfLines={1}
        style={{
          marginLeft: Sizes.fixPadding,
          ...Fonts.whiteColor18SemiBold,
          flex: 1,
        }}
      >
        {title}
      </Text>
      {rightComponent}
    </View>
  );
};

export default Header;
