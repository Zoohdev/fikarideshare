import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
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
const phoneInput = useRef(null);

const API_BASE = "http://192.168.91.1:3000"; // Localhost for Android emulator

const RegisterScreen = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("ZA");
  const [callingCode, setCallingCode] = useState("27");

  const handleRegister = async () => {
    if (!name || !email || !phoneNumber) {
      alert("All fields are required");
      return;
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // removes spaces, dashes, etc.
    const cleanCallingCode = callingCode.replace(/\D/g, "");
    // const fullPhoneNumber = `+${callingCode}${phoneNumber}`;
    const fullPhoneNumber = `+${phoneNumber}`;
    try {
      const res = await axios.post(`${API_BASE}/register-request`, {
        name,
        email,
        phone: fullPhoneNumber,
        // No roleId parameter - backend will hardcode role_id = 2
      });

      alert(res.data.message);

      router.push({
        pathname: "/OTP-Verification/otpVerificationScreen",
        params: {
          email,
          phone: fullPhoneNumber,
        },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
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
        {registerButton()}
      </View>
    );
  }

  function nameInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Enter your name"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={name}
          onChangeText={setName}
        />
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

  // function phoneNumberInfo() {
  //   return (
  //     <View style={styles.valueBox}>
  //       <IntlPhoneInput
  //             onChangeText={({ phoneNumber, dialCode }) => {
  //             const cleanedPhone = phoneNumber.replace(/\D/g, "");
  //             const cleanedDialCode = dialCode.replace(/\D/g, "");
        
  //                 setPhoneNumber(cleanedPhone);
  //                 setCallingCode(cleanedDialCode);
  //               }}
  //               defaultCountry="ZA"
  //               containerStyle={styles.mobileNumberWrapStyle}
  //               placeholder={"Enter your mobile number"}
  //               phoneInputStyle={{
  //                 flex: 1,
  //                 ...Fonts.blackColor15SemiBold,
  //                 paddingVertical: Sizes.fixPadding
  //               }}
  //               dialCodeTextStyle={{
  //                 ...Fonts.blackColor15SemiBold,
  //                 marginHorizontal: Sizes.fixPadding - 2
  //               }}
  //               flagStyle={{ fontSize: 28 }}
  //               inputProps={{ selectionColor: Colors.primaryColor }}
  //             />
  //     </View>
  //   );
  // }

  function phoneNumberInfo() {
    return (
      <View style={styles.valueBox}>
        <PhoneInput
          ref={phoneInput}
          defaultValue={phoneNumber}
          defaultCode="ZA"
          layout="first"
          onChangeFormattedText={(text) => {
            if (!text) return;
  
            // clean phone
            const cleanedPhone = (text || "").replace(/\D/g, "");
  
            // get calling code
            const dialCode = phoneInput.current?.getCallingCode() || "";
            const cleanedDialCode = (dialCode || "").replace(/\D/g, "");
  
            setPhoneNumber(cleanedPhone);
            setCallingCode(cleanedDialCode);
          }}
          containerStyle={styles.mobileNumberWrapStyle}
          textContainerStyle={{ backgroundColor: "transparent" }}
        />
      </View>
    );
  }

  function registerButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRegister}
        style={{ ...CommonStyles.button, marginVertical: Sizes.fixPadding * 4 }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Register</Text>
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
});