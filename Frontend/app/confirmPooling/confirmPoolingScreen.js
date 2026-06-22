import { Text, View, Image, BackHandler } from "react-native";
import React, { useCallback } from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";

const ConfirmPoolingScreen = () => {

  const navigation = useNavigation();

  const backAction = () => {
    navigation.push("(tabs)");
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
  
      return () => {
        subscription.remove(); // ✅ FIX
      };
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {congratsInfo()}
      </View>
      {backToHome()}
    </View>
  );

  function backToHome() {
    return (
      <Text
        onPress={() => { navigation.push("(tabs)") }}
        style={{
          ...Fonts.primaryColor16SemiBold,
          margin: Sizes.fixPadding * 2.0,
          alignSelf: "center",
        }}
      >
        Back to home
      </Text>
    );
  }

  function congratsInfo() {
    return (
      <View style={{ alignItems: "center", margin: Sizes.fixPadding * 2.0 }}>
        <Image
          source={require("../../assets/images/confirm_pooling.png")}
          style={{ width: 250, height: 150.0, resizeMode: "contain" }}
        />
        <Text
          style={{
            ...Fonts.blackColor18SemiBold,
            marginTop: Sizes.fixPadding * 2.0,
            marginBottom: Sizes.fixPadding - 2.0,
          }}
        >
          Congratulation
        </Text>
        <Text style={{ ...Fonts.grayColor14SemiBold, textAlign: "center" }}>
          Your car pooing has been{`\n`}confirmed
        </Text>
      </View>
    );
  }
};

export default ConfirmPoolingScreen;
