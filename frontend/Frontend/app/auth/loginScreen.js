import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MyStatusBar from "../../components/myStatusBar";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
  screenHeight,
} from "../../constants/styles";
// import IntlPhoneInput from "react-native-intl-phone-input";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../services/api";
import { useProfile } from "../context/ProfileContext";

const LoginScreen = () => {
  const router = useRouter();
  const [backClickCount, setBackClickCount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callingCode, setCallingCode] = useState("27");
  const [countryCode, setCountryCode] = useState("ZA");
  const [isLoading, setIsLoading] = useState(false);
  const { setProfileData } = useProfile();
  const phoneInput = useRef(null);

  // const backAction = () => {
  //   backClickCount == 1 ? BackHandler.exitApp() : _spring();
  //   return true;
  // };  


  //   useFocusEffect(
  //   useCallback(() => {
  //     const subscription = BackHandler.addEventListener(
  //       "hardwareBackPress",
  //       backAction
  //     );
  
  //     return () => subscription.remove();
  //   }, [])
  // );

  //  function _spring() {
  //   setBackClickCount(1);
  //   setTimeout(() => setBackClickCount(0), 1000);
  // }


  const handleLogin = async () => {
    
    const cleanEmail = email?.trim().toLowerCase();
  const cleanPassword = password;
  if (!cleanEmail || !cleanPassword) {
    Alert.alert("Missing Credentials", "Please enter both your email and password.");
    return;
  }

    setIsLoading(true);

    try {
    const response = await api.post('/users/login/', {
      email: cleanEmail,
      password: cleanPassword
    });
    console.log("Response ", response.data);
    let user;
    if (response.status === 200) {
      
      const { access_token, refresh_token , user } = response.data; 
      // Note: adjust the keys above ('access' vs 'access_token') to exactly match your Django serializer output!

      console.log("access :",access_token);
      console.log("user:",response.data.user);
      setProfileData(response.data.user);
      // 4. FIXED: Store security sensitive tokens securely
      if (access_token) await SecureStore.setItemAsync('userToken', access_token);
      if (refresh_token ) await SecureStore.setItemAsync('refreshToken', refresh_token );

      // 5. FIXED: Stringify object before saving so it doesn't drop layout metadata
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userId', response.data.user.id);
        
        };
      }
      const token = response.data.access_token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        console.log("Token stored successfully:", token);
        
        if ( response.data.user.id && response.data.user.is_driver === true) {
          console.log("Navigating to Driver Panel...");
          router.replace("/(driverTabs)/home/homeScreen");
        } else {
          console.log("Navigating to Rider Panel...");
          // router.replace("/pickLocation/pickLocationScreen"); // Or your main passenger home screen
          router.replace("/(tabs)/home/homeScreen");
        }
        
    }
      console.log("Identity context successfully stored locally.");

    }
    
   catch (err) {
    console.error("Login Error:", err.response?.data || err.message);
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
  extraScrollHeight={50}
  keyboardShouldPersistTaps="handled"
>
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>
      
  {imageView()}
  {loginInfo()}

      </ScrollView>
      {exitInfo()}
    </View>
    </KeyboardAwareScrollView>
  );



    function imageView() {
    return (
      <View style={styles.imageViewWrapStyle}>
        <Image
          source={require("../../assets/images/FIKA_ppLogo.jpeg")}
          style={{ width: "100%", height: "65%", resizeMode: "contain" }}
        />
      </View>
    );
  }

    function loginInfo() {
    return (
      <View style={{ flex: 1 }}>
        {loginDescription()}
        {loginDetailsInfo()}
       {loginButton()}
      {registerNavigation()}
    </View>
    );
  }

  function loginDetailsInfo() {
    return (
      <View>
        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="mail-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Email"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
          />
        </View>

        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="key-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="password"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
          />
        </View>
      </View>
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
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
    marginHorizontal: Sizes.fixPadding * 2,
    ...CommonStyles.rowAlignCenter,
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    height: 20,
    padding: 0,
    flex: 1,
    marginLeft: Sizes.fixPadding,
  },
});