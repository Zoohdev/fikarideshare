import {
  StyleSheet,
  Text,
  View,
  Image,
  BackHandler,
} from "react-native";
import React, { useCallback } from "react";
import { Colors, Sizes, Fonts } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation } from "expo-router";

const SuccessfullyAddAndSendScreen = () => {

  const navigation = useNavigation();

  const { successFor, amount } = useLocalSearchParams();

  const backAction = () => {
    navigation.push("(tabs)");
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", backAction);
      };
    }, [backAction])
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={styles.center}>{congratsInfo()}</View>
      {backToHome()}
    </View>
  );

  function backToHome() {
    return (
      <Text
        onPress={() => {
          navigation.push("(tabs)");
        }}
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
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../../assets/images/icons/success.png")}
          style={{ width: 83.0, height: 83.0, resizeMode: "contain" }}
        />
        <Text
          style={{
            ...Fonts.primaryColor20SemiBold,
            marginTop: Sizes.fixPadding + 8.0,
          }}
        >
          ${Number(amount || 0).toFixed(2)} {successFor == "money" ? "added" : "sended"}
        </Text>
        <Text
          style={{
            ...Fonts.grayColor14SemiBold,
            textAlign: "center",
            marginTop: Sizes.fixPadding,
          }}
        >
          {successFor == "money"
            ? "Congratulation your money successfully added into wallet"
            : "Congratulation your money successfully send in your bank"}
        </Text>
      </View>
    );
  }
};

export default SuccessfullyAddAndSendScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: Sizes.fixPadding * 4.0,
  },
});
