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
import Button from "../../components/Button";
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
      <Button
        title="Back to home"
        variant="outline"
        onPress={() => navigation.push("(tabs)")}
        style={{ marginBottom: Sizes.fixPadding * 3.0 }}
      />
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
          ${Number(amount || 0).toFixed(2)} {successFor == "money" ? "added" : "sent"}
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
