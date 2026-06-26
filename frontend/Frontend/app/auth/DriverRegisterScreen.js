import {
  Text,
  View,
  Alert,
  StatusBar,
  Animated,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
} from "../../constants/styles";
import TextField from "../../components/TextField";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import PhoneInput from "react-native-phone-number-input";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../context/ProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { registerForPushNotificationsAsync } from "../../services/pushNotifications";

const USER_TYPE = "driver";

// Matches the "FIKA Login"/"FIKA Onboarding" claude.ai/design premium
// theme - see registerScreen.js. Only the badge accent (gold instead of
// teal/white) and copy differ, mirroring the rider/driver icon language
// already used for the two entry buttons on loginScreen.js.
const DriverRegisterScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setProfileData } = useProfile();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingCode, setCallingCode] = useState("27");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // See loginScreen.js - warms the country picker's flag-image CDN
  // connection on mount instead of starting cold on first tap.
  useEffect(() => {
    fetch("https://xcarpentier.github.io/react-native-country-picker-modal/countries/").catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Missing details", "All fields are required.");
      return;
    }
    if (phoneNumber.length < 7) {
      Alert.alert("Invalid Input", "Please enter a valid mobile number.");
      return;
    }

    const cleanLocalNumber = phoneNumber.replace(/^0+/, "").trim();
    const cleanCode = callingCode ? callingCode.replace(/\D/g, "") : "27";
    const finalizedPhoneNumber = `+${cleanCode}${cleanLocalNumber}`;

    setIsLoading(true);
    try {
      const payload = {
        email,
        phone_number: finalizedPhoneNumber,
        first_name: firstname,
        last_name: lastname,
        password,
        password_confirm: confirmPassword,
        user_type: USER_TYPE,
      };

      const response = await api.post("/users/register/", payload);

      if (response.status === 201) {
        const { access_token, refresh_token, user } = response.data;
        await SecureStore.setItemAsync("userToken", access_token);
        await SecureStore.setItemAsync("refreshToken", refresh_token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));
        await AsyncStorage.setItem("userId", user.id);
        setProfileData(user);
        registerForPushNotificationsAsync();

        router.replace(
          user?.is_driver ? "/(driverTabs)/home/homeScreen" : "/(tabs)/home/homeScreen"
        );
      }
    } catch (error) {
      let userMessage = "Registration failed. Please try again.";

      if (error.code === "ERR_NETWORK") {
        userMessage = "Cannot reach the server. Check your connection and try again.";
      } else if (error.response?.status === 400) {
        const serverErrors = error.response.data;
        const errorMessages = [];

        if (Array.isArray(serverErrors.email)) errorMessages.push(serverErrors.email[0]);
        if (Array.isArray(serverErrors.phone_number)) errorMessages.push(serverErrors.phone_number[0]);

        userMessage = errorMessages.length
          ? errorMessages.join("\n")
          : Object.values(serverErrors).flat().join("\n") || "Invalid data.";
      }
      Alert.alert("Couldn't create account", userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={120}
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: Colors.creamBackground }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerGlow} pointerEvents="none" />
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.whiteColor} />
        </TouchableOpacity>
        <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
          <Animated.Image
            source={require("../../assets/images/FIKA_ppLogo.png")}
            style={[styles.logo, { transform: [{ translateY: logoTranslateY }] }]}
          />
          <View style={styles.typeBadge}>
            <MaterialIcons name="explore" size={14} color="#A8821E" />
            <Text style={styles.typeBadgeText}>DRIVER ACCOUNT</Text>
          </View>
        </View>
      </View>

      <View style={[styles.form, { paddingBottom: Sizes.fixPadding * 4 + insets.bottom }]}>
        <Text style={styles.title}>Create your driver account</Text>
        <Text style={styles.subtitle}>
          You&apos;ll set up your vehicle and documents after this step
        </Text>

        <View style={styles.row}>
          <TextField
            label="First Name"
            icon="person-outline"
            placeholder="First name"
            value={firstname}
            onChangeText={setFirstname}
            containerStyle={{ flex: 1, marginTop: Sizes.fixPadding * 2.5 }}
          />
          <View style={{ width: Sizes.fixPadding }} />
          <TextField
            label="Last Name"
            icon="person-outline"
            placeholder="Last name"
            value={lastname}
            onChangeText={setLastname}
            containerStyle={{ flex: 1, marginTop: Sizes.fixPadding * 2.5 }}
          />
        </View>

        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          containerStyle={{ marginTop: Sizes.fixPadding * 1.5 }}
        />

        <Text style={styles.label}>Phone Number</Text>
        <PhoneInput
          defaultCode="ZA"
          layout="first-country"
          onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
          onChangeCountry={(country) => {
            if (country.callingCode?.length > 0) setCallingCode(country.callingCode[0]);
          }}
          countryPickerProps={{ withFlag: true, withEmoji: true }}
          containerStyle={styles.phoneContainer}
          textContainerStyle={{ backgroundColor: "transparent" }}
          dialCodeTextStyle={{ ...Fonts.blackColor15SemiBold, marginHorizontal: Sizes.fixPadding - 2 }}
          flagStyle={{ fontSize: 28 }}
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
        <TextField
          label="Confirm Password"
          icon="lock-outline"
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={{ marginTop: Sizes.fixPadding * 1.5 }}
          rightComponent={
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.mutedTextColor}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRegister}
          disabled={isLoading}
          style={{ marginTop: Sizes.fixPadding * 2.5 }}
        >
          <LinearGradient colors={["#EFB155", "#E8A33D"]} style={styles.ctaButton}>
            <Text style={styles.ctaText}>{isLoading ? "Creating account..." : "Register"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default DriverRegisterScreen;

const styles = {
  header: {
    height: 230,
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
  backButton: {
    position: "absolute",
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 140,
    height: 66,
    resizeMode: "contain",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Sizes.fixPadding * 2,
    backgroundColor: "rgba(212,175,55,0.16)",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#8A6D1C",
    fontFamily: "Montserrat_SemiBold",
  },
  form: {
    paddingHorizontal: Sizes.fixPadding * 2.2,
    paddingTop: Sizes.fixPadding * 2.5,
    paddingBottom: Sizes.fixPadding * 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.blackColor,
    fontFamily: "Montserrat_Bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#8A8175",
    fontFamily: "Montserrat_Medium",
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.mutedTextColor,
    textTransform: "uppercase",
    marginTop: Sizes.fixPadding * 1.5,
    marginBottom: 8,
    fontFamily: "Montserrat_SemiBold",
  },
  phoneContainer: {
    ...CommonStyles.card,
    borderWidth: 1.5,
    width: "100%",
    marginBottom: 4,
  },
  ctaButton: {
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
};
