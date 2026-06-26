import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect } from "react";
import { Colors, Fonts, Sizes, screenWidth } from "../constants/styles";
import MyStatusBar from "../components/myStatusBar";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";
import { getPostAuthRoute } from "../services/postAuthRoute";
import { useProfile } from "./context/ProfileContext";

const SplashScreen = () => {
  const router = useRouter();
  const { setProfileData } = useProfile();

  useEffect(() => {
    const resume = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        router.replace("/onboarding/onboardingScreen");
        return;
      }

      let profile;
      try {
        const profileRes = await api.get("/users/profile/");
        profile = profileRes.data;
        setProfileData(profile);
      } catch (err) {
        // Interceptor already tried refreshing the token - if we're still
        // here, the session is genuinely gone.
        router.replace("/onboarding/onboardingScreen");
        return;
      }

      router.replace(await getPostAuthRoute(profile));
    };

    const timer = setTimeout(resume, 1200);
    return () => clearTimeout(timer);
  }, []);

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
          source={require("../assets/images/FIKA_ppLogo.png")}
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
