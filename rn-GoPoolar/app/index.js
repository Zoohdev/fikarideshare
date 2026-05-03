import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect } from "react";
import { Colors, Fonts, Sizes, screenWidth } from "../constants/styles";
import MyStatusBar from "../components/myStatusBar";
import { useNavigation } from "expo-router";

const SplashScreen = () => {

  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.push("onboarding/onboardingScreen");
    }, 2000);
    return () => {
      clearTimeout(timer);
    }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primaryColor }}>
      <MyStatusBar />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {appIcon()}
      </View>
    </View>
  );

  function appIcon() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0, alignItems: "center" }}>
        <Image
          source={require("../assets/images/app_color_icon.png")}
          style={styles.appIcon}
        />
        <Text style={{ ...Fonts.whiteColor28SemiBold }}>Go Poolar</Text>
      </View>
    );
  }
};

export default SplashScreen;

const styles = StyleSheet.create({
  appIcon: {
    height: 100.0,
    width: screenWidth / 2.0,
    resizeMode: "contain",
    marginVertical: -Sizes.fixPadding,
    tintColor: Colors.whiteColor,
  },
});
