import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,ActivityIndicator
} from "react-native";
import React, { useRef ,useState } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
// import IntlPhoneInput from "react-native-intl-phone-input";
import PhoneInput from "react-native-phone-number-input";
import axios from "axios";
import api from "../../services/api";
import * as SecureStore from 'expo-secure-store';


const RegisterScreen = () => {
  const router = useRouter();
  const phoneInput = useRef(null);
  // const [name, setName] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("ZA");
  const [callingCode, setCallingCode] = useState("27");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !phoneNumber || !password || !confirmPassword) {
      alert("All fields are required");
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 7) {
      Alert.alert("Invalid Input", "Please enter a valid mobile number.");
      return;
    }

    const cleanLocalNumber = phoneNumber.replace(/^0+/, "").trim();

    const cleanCode = callingCode ? callingCode.replace(/\D/g, "") : "27";

    const finalizedPhoneNumber = `+${cleanCode}${cleanLocalNumber}`;
    console.log("FINALIZED PHONE GOING TO DB:", finalizedPhoneNumber);
    setIsLoading(true);
    // const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // removes spaces, dashes, etc.
    // const cleanCallingCode = callingCode.replace(/\D/g, "");
    
    try {
      const payload = {
        email :email,
        phone_number: finalizedPhoneNumber,
        first_name:firstname,
        last_name : lastname,
        password :password,
        password_confirm :confirmPassword,
        user_type : "driver"
        
      };

      console.log("Registering...")
      const response = await api.post('/users/register/', payload);
      
      console.log("Sending payload to Django:", payload);
      console.log("Success data:", response.data);
      if(response.status===201){
        console.log("Registeration successful");
        const { access_token, refresh_token, user } = response.data;

        await SecureStore.setItemAsync('userToken', access_token);
        await SecureStore.setItemAsync('refreshToken', refresh_token);

      }
      Alert.alert("Success", "Registration code sent!");

    }catch (error) {
      // 💡 CRITICAL DIAGNOSTIC LOGS — Check your React Native terminal for these!
      console.log("--- AXIOS ERROR DIAGNOSTICS ---");
      console.log("Error Message:", error.message);
      console.log("Error Code:", error.code);
      console.log("Server Response Status:", error.response?.status);
      console.log("Server Response Data:", error.response?.data);
      console.log("--------------------------------");
    
      let userMessage = "Registration failed.";
    
      if (error.code === "ERR_NETWORK") {
        userMessage = `Cannot connect to Django Server! Verify your server is running on http://${callingCode ? 'your-ip' : ''}:8000 and your phone is on the same Wi-Fi network.`;
      } if (error.code === "ERR_NETWORK") {
        userMessage = `Cannot connect to Django Server! Verify your server is running on http://${callingCode ? 'your-ip' : ''}:8000 and your phone is on the same Wi-Fi network.`;
      } else if (error.response?.status === 400) {
        const serverErrors = error.response.data;
        let errorMessages = [];
      
        if (serverErrors.email && Array.isArray(serverErrors.email)) {
          errorMessages.push(serverErrors.email[0]); 
        }
      
        if (serverErrors.phone_number && Array.isArray(serverErrors.phone_number)) {
          errorMessages.push(serverErrors.phone_number[0]);
        }
      
        if (errorMessages.length > 0) {
          userMessage = errorMessages.join("\n");
        } else {
          // Fallback for any other validation errors (like short passwords)
          userMessage = Object.values(serverErrors).flat().join("\n") || "Invalid data.";
        }
      }
      Alert.alert("Already Registered", userMessage);
  
    } finally {
      // Always unlock the button when execution finishes
      setIsLoading(false);
    }

    
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        {header()}
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {imageView()}
          {registerInfo()}
        </ScrollView>
      </View>
    </View>
  );

  function header() {
    return (
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
    );
  }

  function registerInfo() {
    return (
      <View style={{ flex: 1 }}>
        {registerDescription()}
        {nameInfo()}
        {emailInfo()}
        {phoneNumberInfo()}
        {passwordInfo()}
        {registerButton()}
      </View>
    );
  }

  function nameInfo() {
    return (
      <View >
        
        
        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="First Name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={firstname}
            onChangeText={setFirstname}
          />
        </View>
        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Last Name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={lastname}
            onChangeText={setLastname}
          />
        </View>
      </View>
      
    );
  }

  function passwordInfo() {
    return (
      <View>
        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="key-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Please create password"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
          <Ionicons name="key-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Please confirm password"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      
    );
  }

  function emailInfo() {
    return (
      <View style={{ ...styles.valueBox, marginVertical: Sizes.fixPadding * 2 }}>
        <Ionicons name="mail-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Enter your email address"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>
    );
  }


  function phoneNumberInfo() {
    return (
        <PhoneInput
        defaultCode="ZA" 
        layout="first-country"
          onChangeText={(text) => {
            const cleanedPhone = text.replace(/\D/g, "");
            setPhoneNumber(cleanedPhone);
          }}
          onChangeCountry={(country) => {
            // country.callingCode array holds the dial codes (e.g., ["27"])
            setCountryCode(country.cca2);
            if (country.callingCode && country.callingCode.length > 0) {
              setCallingCode(country.callingCode[0]);
              console.log("Country changed to dialing code:", country.callingCode[0]);
            }
          }}
          countryPickerProps={{
            withFlag: true,
            withEmoji: true,
          }}
          containerStyle={styles.mobileNumberWrapStyle}
          
                          // phoneInputStyle={styles.textFieldStyle}
                          dialCodeTextStyle={{
                            ...Fonts.blackColor15SemiBold,
                            marginHorizontal: Sizes.fixPadding - 2
                          }}
                          // dialCodeTextStyle={styles.textFieldStyle}
                          flagStyle={{ fontSize: 28 }}
          textContainerStyle={{ backgroundColor: "transparent" }}
        />
    );
  }

  function registerButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRegister}
        disabled={isLoading}
        style={[
          CommonStyles.button, 
          { marginVertical: Sizes.fixPadding * 4 },
          // 💡 Optional: Make the button look slightly faded/disabled while loading
          isLoading && { opacity: 0.6 } 
        ]}

      >
        {isLoading ? (
        //If loading is true, show the spinner
        <ActivityIndicator color={Colors.whiteColor || "#FFF"} size="small" />
      ) : (
        // If loading is false, show the regular text
        <Text style={{ ...Fonts.whiteColor18Bold }}>Register</Text>
      )}
      </TouchableOpacity>
    );
  }

  function registerDescription() {
    return (
      <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
        <Text style={{ ...Fonts.blackColor20SemiBold }}>Register</Text>
        <Text
          style={{ ...Fonts.grayColor15Medium, textAlign: "center", marginTop: Sizes.fixPadding }}
        >
          Welcome, please create your account using your information
        </Text>
      </View>
    );
  }

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
};

export default RegisterScreen;

const styles = StyleSheet.create({
  imageViewWrapStyle: {
    height: screenHeight / 2.7,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
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
  mobileNumberWrapStyle: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding - 7,
    ...CommonStyles.shadow,
    marginHorizontal: Sizes.fixPadding * 2,
    marginTop: Sizes.fixPadding-10,
    marginBottom: Sizes.fixPadding,
    width:'auto'
  },
});