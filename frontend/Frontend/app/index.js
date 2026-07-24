// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation, useRouter } from "expo-router";
// import * as SecureStore from 'expo-secure-store';
// import React, { useEffect } from "react";
// import { Image, StyleSheet, View } from "react-native";
// import MyStatusBar from "../components/myStatusBar";
// import { Colors, Sizes } from "../constants/styles";
// import { clearSession, refreshSession } from "../services/authSession";

// const SplashScreen = () => {

//   const navigation = useNavigation();
//   const router = useRouter();

//   useEffect(() => {
//     let active = true;
//     const timer = setTimeout(async () => {
//       try {
//         const refreshToken = await SecureStore.getItemAsync('refreshToken');
//         if (refreshToken) {
//           try {
//             // Proactively refresh on cold start instead of only trusting a
//             // cached access token's presence - this surfaces a truly-dead
//             // session immediately, before the user ever sees the home screen.
//             await refreshSession();
//           } catch (refreshError) {
//             if (refreshError.response) {
//               // Server rejected the refresh token (expired/blacklisted) -
//               // the session is genuinely over.
//               await clearSession();
//               if (active) {
//                 navigation.push("onboarding/onboardingScreen");
//               }
//               return;
//             }
//             // Network/timeout error - unknown whether the session is dead.
//             // Fail soft: proceed with the cached session and let api.js's
//             // interceptor sort it out on the next real request.
//           }

//           const userDataRaw = await AsyncStorage.getItem('userData');
//           if (userDataRaw) {
//             const userData = JSON.parse(userDataRaw);
//             if (active) {
//               router.replace(
//                 userData?.is_driver === true
//                   ? "/(driverTabs)/home/homeScreen"
//                   : "/(tabs)/home/homeScreen"
//               );
//               return;
//             }
//           }
//         }
//       } catch (e) {
//         console.log("Auto-login check failed:", e);
//       }
//       if (active) {
//         navigation.push("onboarding/onboardingScreen");
//       }
//     }, 2000);
//     return () => {
//       active = false;
//       clearTimeout(timer);
//     }
//   }, [])

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.whiteColor }}>
//       <MyStatusBar />
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         {appIcon()}
//       </View>
//     </View>
//   );

//   function appIcon() {
//     return (
//       <View style={{ margin: Sizes.fixPadding * 2.0, alignItems: "center" }}>
//         <Image
//           source={require("../assets/images/splash-icon.png")}
//           style={styles.appIcon}
//         />
//         {/* <Text style={{ ...Fonts.whiteColor28SemiBold }}>Fika</Text> */}
//       </View>
//     );
//   }
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   appIcon: {
//     // height: 100.0,
//     // width: screenWidth / 2.0,
//     resizeMode: "contain",
//     marginVertical: -Sizes.fixPadding,
//     tintColor: Colors.whiteColor,
//   },
// });


import { useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import MyStatusBar from "../components/myStatusBar";
import { Colors, Sizes, screenWidth, screenHeight } from "../constants/styles";

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
    <View style={{ flex: 1, backgroundColor: Colors.whiteColor }}>
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
          source={require("../assets/images/splash-icon.png")}
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
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
