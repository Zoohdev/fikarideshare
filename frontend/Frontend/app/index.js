import { useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import MyStatusBar from "../components/myStatusBar";
import { Colors, Sizes } from "../constants/styles";

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
          source={require("../assets/images/FIKA_ppLogo.jpeg")}
          style={styles.appIcon}
        />
        {/* <Text style={{ ...Fonts.whiteColor28SemiBold }}>Fika</Text> */}
      </View>
    );
  }
};

export default SplashScreen;

const styles = StyleSheet.create({
  appIcon: {
    // height: 100.0,
    // width: screenWidth / 2.0,
    resizeMode: "contain",
    marginVertical: -Sizes.fixPadding,
    tintColor: Colors.whiteColor,
  },
});
