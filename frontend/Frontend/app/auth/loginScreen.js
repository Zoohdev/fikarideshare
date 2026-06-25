import {
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  screenHeight,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { useRouter } from "expo-router";
import api from "../../services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../context/ProfileContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { registerForPushNotificationsAsync } from "../../services/pushNotifications";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setProfileData } = useProfile();

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
    <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={50} keyboardShouldPersistTaps="handled">
      <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
        <MyStatusBar />
        <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>
          <View
            style={{
              height: screenHeight / 2.7 + 20,
              backgroundColor: Colors.primaryColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={require("../../assets/images/FIKA_ppLogo.png")}
              style={{ width: "100%", height: "65%", resizeMode: "contain" }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
              <Text style={{ ...Fonts.blackColor20SemiBold }}>Login</Text>
              <Text style={{ ...Fonts.grayColor15Medium, textAlign: "center", marginTop: Sizes.fixPadding }}>
                Welcome back! Enter your details to continue
              </Text>
            </View>

            <TextField
              icon="mail-outline"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />
            <TextField
              icon="key-outline"
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              containerStyle={{ marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding }}
            />

            <Button
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginVertical: Sizes.fixPadding * 4 }}
            />

            <View style={{ alignItems: "center", marginTop: Sizes.fixPadding * 2 }}>
              <Text style={{ ...Fonts.grayColor15Medium }}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/auth/registerScreen")}>
                <Text style={{ ...Fonts.primaryColor16SemiBold, marginTop: Sizes.fixPadding }}>
                  Create rider account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/auth/DriverRegisterScreen")}>
                <Text style={{ ...Fonts.primaryColor16SemiBold, marginTop: Sizes.fixPadding }}>
                  Create driver account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default LoginScreen;
