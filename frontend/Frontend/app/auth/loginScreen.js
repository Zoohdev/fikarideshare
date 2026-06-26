import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Colors,
  Sizes,
} from "../../constants/styles";
import TextField from "../../components/TextField";
import { useRouter } from "expo-router";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../context/ProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { registerForPushNotificationsAsync } from "../../services/pushNotifications";

// Matches the "FIKA Login" claude.ai/design prototype: teal header with a
// floating logo + gold tagline, premium gold-focus inputs, and the
// rider/driver entry points as two icon buttons instead of stacked text
// links.
const LoginScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setProfileData } = useProfile();

  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const logoTranslateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const handleLogin = async () => {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !password) {
      Alert.alert("Missing Credentials", "Please enter both your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/users/login/", {
        email: cleanEmail,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      await SecureStore.setItemAsync("userToken", access_token);
      await SecureStore.setItemAsync("refreshToken", refresh_token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      await AsyncStorage.setItem("userId", user.id);

      setProfileData(user);
      registerForPushNotificationsAsync();

      router.replace(
        user.is_driver ? "/(driverTabs)/home/homeScreen" : "/(tabs)/home/homeScreen"
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || err.response?.data?.detail || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: Colors.creamBackground }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerGlow} pointerEvents="none" />
        <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
          <Animated.Image
            source={require("../../assets/images/FIKA_ppLogo.png")}
            style={[styles.logo, { transform: [{ translateY: logoTranslateY }] }]}
          />
          <Text style={styles.tagline}>ENJOY SHARED AND AFFORDABLE RIDES</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          containerStyle={{ marginTop: Sizes.fixPadding * 2.5 }}
        />
        <TextField
          label="Password"
          icon="lock-outline"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          containerStyle={{ marginTop: Sizes.fixPadding * 1.5 }}
          rightComponent={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.mutedTextColor}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          style={styles.forgotRow}
          onPress={() => Alert.alert("Coming soon", "Password reset isn't available yet - please contact support.")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={handleLogin} disabled={isLoading}>
          <LinearGradient colors={["#EFB155", "#E8A33D"]} style={styles.ctaButton}>
            <Text style={styles.ctaText}>{isLoading ? "Logging in..." : "Log in"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New to FIKA?</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.accountTypeRow}>
          <TouchableOpacity
            style={styles.accountTypeButton}
            onPress={() => router.push("/auth/registerScreen")}
          >
            <Ionicons name="person-outline" size={24} color={Colors.primaryColor} />
            <Text style={styles.accountTypeLabelRider}>Ride with FIKA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountTypeButtonDriver}
            onPress={() => router.push("/auth/DriverRegisterScreen")}
          >
            <MaterialIcons name="explore" size={24} color="#A8821E" />
            <Text style={styles.accountTypeLabelDriver}>Drive with FIKA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default LoginScreen;

const styles = {
  header: {
    height: 280,
    backgroundColor: Colors.primaryColor,
    borderBottomLeftRadius: Sizes.fixPadding * 4.5,
    borderBottomRightRadius: Sizes.fixPadding * 4.5,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    top: -40,
    left: "50%",
    marginLeft: -190,
    width: 380,
    height: 340,
    borderRadius: 190,
    backgroundColor: "rgba(212,175,55,0.16)",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 170,
    height: 80,
    resizeMode: "contain",
  },
  tagline: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3.5,
    color: "rgba(212,175,55,0.92)",
    fontFamily: "Montserrat_SemiBold",
  },
  form: {
    paddingHorizontal: Sizes.fixPadding * 2.2,
    paddingTop: Sizes.fixPadding * 2.5,
    paddingBottom: Sizes.fixPadding * 3,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.blackColor,
    fontFamily: "Montserrat_Bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#8A8175",
    fontFamily: "Montserrat_Medium",
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: Sizes.fixPadding,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryColor,
    fontFamily: "Montserrat_SemiBold",
  },
  ctaButton: {
    marginTop: Sizes.fixPadding * 1.5,
    paddingVertical: 18,
    borderRadius: Sizes.fixPadding * 2,
    alignItems: "center",
    shadowColor: Colors.secondaryColor,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#2A1F06",
    fontFamily: "Montserrat_SemiBold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: Sizes.fixPadding * 2.8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(28,28,30,0.1)",
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9A9082",
    fontFamily: "Montserrat_SemiBold",
  },
  accountTypeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: Sizes.fixPadding * 1.8,
  },
  accountTypeButton: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    paddingVertical: 15,
    borderRadius: Sizes.fixPadding * 1.5,
    borderWidth: 1.5,
    borderColor: "rgba(10,46,36,0.16)",
    backgroundColor: Colors.whiteColor,
  },
  accountTypeButtonDriver: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    paddingVertical: 15,
    borderRadius: Sizes.fixPadding * 1.5,
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  accountTypeLabelRider: {
    fontSize: 13.5,
    fontWeight: "700",
    color: Colors.primaryColor,
    fontFamily: "Montserrat_SemiBold",
  },
  accountTypeLabelDriver: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#8A6D1C",
    fontFamily: "Montserrat_SemiBold",
  },
};
