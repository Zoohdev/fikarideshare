import {
  ScrollView,
  Text,
  View,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import PhoneInput from "react-native-phone-number-input";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../context/ProfileContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { registerForPushNotificationsAsync } from "../../services/pushNotifications";

const USER_TYPE = "rider";

const RegisterScreen = () => {
  const router = useRouter();
  const { setProfileData } = useProfile();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingCode, setCallingCode] = useState("27");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
        <MyStatusBar />
        <View
          style={{
            backgroundColor: Colors.primaryColor,
            padding: Sizes.fixPadding * 2,
          }}
        >
          <MaterialIcons
            name="arrow-back-ios"
            color={Colors.whiteColor}
            size={22}
            onPress={() => router.back()}
          />
        </View>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View
            style={{
              height: screenHeight / 2.7,
              backgroundColor: Colors.primaryColor,
              alignItems: "center",
              justifyContent: "center",
              marginTop: -40,
            }}
          >
            <Image
              source={require("../../assets/images/FIKA_ppLogo.png")}
              style={{ width: "100%", height: "65%", resizeMode: "contain" }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
              <Text style={{ ...Fonts.blackColor20SemiBold }}>Create your rider account</Text>
              <Text
                style={{
                  ...Fonts.grayColor15Medium,
                  textAlign: "center",
                  marginTop: Sizes.fixPadding,
                }}
              >
                Welcome, please create your account using your information
              </Text>
            </View>

            <TextField
              icon="person-outline"
              placeholder="First Name"
              value={firstname}
              onChangeText={setFirstname}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />
            <TextField
              icon="person-outline"
              placeholder="Last Name"
              value={lastname}
              onChangeText={setLastname}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />
            <TextField
              icon="mail-outline"
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginVertical: Sizes.fixPadding * 2.0 }}
            />

            <PhoneInput
              defaultCode="ZA"
              layout="first-country"
              onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
              onChangeCountry={(country) => {
                if (country.callingCode?.length > 0) setCallingCode(country.callingCode[0]);
              }}
              countryPickerProps={{ withFlag: true, withEmoji: false }}
              containerStyle={{
                ...CommonStyles.card,
                marginHorizontal: Sizes.fixPadding * 2.0,
                marginBottom: Sizes.fixPadding,
                width: "auto",
              }}
              dialCodeTextStyle={{ ...Fonts.blackColor15SemiBold, marginHorizontal: Sizes.fixPadding - 2 }}
              flagStyle={{ fontSize: 28 }}
              textContainerStyle={{ backgroundColor: "transparent" }}
            />

            <TextField
              icon="key-outline"
              placeholder="Please create password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />
            <TextField
              icon="key-outline"
              placeholder="Please confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={isLoading}
              style={{ marginVertical: Sizes.fixPadding * 4 }}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default RegisterScreen;
