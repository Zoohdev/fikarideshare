import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  BackHandler,
  Alert,
} from "react-native";
import React, { useRef,useState, useCallback } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import PhoneInput from "react-native-phone-number-input";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = "http://192.168.1.4:3000";

const LoginScreen = () => {
  const router = useRouter();
  const [backClickCount, setBackClickCount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingCode, setCallingCode] = useState("27");
  const [countryCode, setCountryCode] = useState("ZA");
  const [isLoading, setIsLoading] = useState(false);

  const phoneInput = useRef(null);

  const backAction = () => {
    backClickCount == 1 ? BackHandler.exitApp() : _spring();
    return true;
  };

 
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
  
      return () => subscription.remove();
    }, [])
  );

  function _spring() {
    setBackClickCount(1);
    setTimeout(() => setBackClickCount(0), 1000);
  }

  const handleLogin = async () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // removes spaces, dashes, etc.
    const cleanCallingCode = callingCode.replace(/\D/g, "");
    const fullPhoneNumber = phoneNumber.replace(/\s/g, "");
    console.log(fullPhoneNumber);
    // const fullPhoneNumber = phoneNumber;
    setIsLoading(true);

    try {
      // Direct login without OTP verification
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        phone: fullPhoneNumber,
      });
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(res.data)
      );
      
      console.log(
        "🚗 LOGIN RESPONSE:",
        res.data
      );
      
      //  DRIVER
      if (res.data.roleId === 2) {
      
        const driverId =
          res.data.driverId ||
          res.data.riderId ||
          res.data.userId;
      
        await AsyncStorage.setItem(
          "driverId",
          driverId.toString()
        );
      
        console.log(
          " DRIVER ID SAVED:",
          driverId
        );
        router.replace("/(driverTabs)/home/homeScreen");
      
      }
      
      //  RIDER
      else {
      
        const riderId =
          res.data.riderId ||
          res.data.userId;
      
        await AsyncStorage.setItem(
          "riderId",
          riderId.toString()
        );
      
        console.log(
          " RIDER ID SAVED:",
          riderId
        );
        router.replace("/pickLocation/pickLocationScreen");
      }
      
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>
        {imageView()}
        {loginInfo()}
      </ScrollView>
      {exitInfo()}
    </View>
  );

  function imageView() {
    return (
      <View style={styles.imageViewWrapStyle}>
        <Image
          source={require("../../assets/images/FIKA_ppLogo.png")}
          style={{ width: "100%", height: "65%", resizeMode: "contain" }}
        />
      </View>
    );
  }

  function loginInfo() {
    return (
      <View style={{ flex: 1 }}>
        {loginDescription()}
        {mobileNumberInfo()}
        {loginButton()}
        {registerNavigation()}
      </View>
    );
  }

  function mobileNumberInfo() {
    return (
      <PhoneInput
      ref={phoneInput}
      defaultValue={phoneNumber}
      defaultCode="ZA"
      layout="first"
      onChangeFormattedText={(text) => {
        if (!text) return;
    
        // full number (with country code)
        setPhoneNumber(text);
    
        // extract calling code
        const code = phoneInput.current?.getCallingCode();
        setCallingCode(code || "");
      }}
      containerStyle={styles.mobileNumberWrapStyle}
      textContainerStyle={{ backgroundColor: "transparent" }}
    />
    );
  }

  function loginButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLogin}
        disabled={isLoading}
        style={{ 
          ...CommonStyles.button, 
          marginVertical: Sizes.fixPadding * 4,
          opacity: isLoading ? 0.6 : 1 
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>
          {isLoading ? "Please Wait..." : "Login"}
        </Text>
      </TouchableOpacity>
    );
  }

  function loginDescription() {
    return (
      <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
        <Text style={{ ...Fonts.blackColor20SemiBold }}>Login</Text>
        <Text style={{ ...Fonts.grayColor15Medium, textAlign: "center", marginTop: Sizes.fixPadding }}>
          Welcome! Enter your phone number to login
        </Text>
      </View>
    );
  }

  function registerNavigation() {
    return (
      <View style={{ alignItems: "center", marginTop: Sizes.fixPadding * 2 }}>
        <Text style={{ ...Fonts.grayColor15Medium }}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/registerScreen")}>
          <Text style={{ ...Fonts.primaryColor16Bold, marginTop: Sizes.fixPadding }}>create rider</Text>
        </TouchableOpacity>

         <TouchableOpacity onPress={() => router.push("/auth/DriverRegisterScreen")}>
          <Text style={{ ...Fonts.primaryColor16Bold, marginTop: Sizes.fixPadding }}>create driver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function exitInfo() {
    return backClickCount == 1 ? (
      <View style={styles.exitInfoWrapStyle}>
        <Text style={{ ...Fonts.whiteColor14Medium }}>Press Back Once Again To Exit!</Text>
      </View>
    ) : null;
  }
};

export default LoginScreen;

const styles = StyleSheet.create({
  imageViewWrapStyle: {
    height: screenHeight / 2.7 + 20,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileNumberWrapStyle: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding - 7,
    ...CommonStyles.shadow,
    marginHorizontal: Sizes.fixPadding * 2,
    marginTop: Sizes.fixPadding,
  },
  exitInfoWrapStyle: {
    backgroundColor: Colors.blackColor,
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    borderRadius: Sizes.fixPadding * 2,
    paddingHorizontal: Sizes.fixPadding + 5,
    paddingVertical: Sizes.fixPadding,
    justifyContent: "center",
    alignItems: "center",
  },
});