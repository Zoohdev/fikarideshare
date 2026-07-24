
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import PhoneInput from "react-native-phone-number-input";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MyStatusBar from "../../components/myStatusBar";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
  screenHeight,
} from "../../constants/styles";
import api from "../../services/api";

const RegisterScreen = () => {
  const router = useRouter();
  const phoneInput = useRef(null);
  
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("ZA");
  const [callingCode, setCallingCode] = useState("27");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [userRole, setUserRole] = useState("rider");

  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please populate all registration details.");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Your passwords do not match. Please verify.");
      return;
    }

    if (!agreeToTerms) {
      Alert.alert("Terms & Conditions", "You must accept the Terms and Conditions to proceed.");
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
        email: email.toLowerCase().trim(),
        phone_number: finalizedPhoneNumber,
        first_name: firstname.trim(),
        last_name: lastname.trim(),
        password: password,
        password_confirm: confirmPassword,
        user_type: userRole,
      };

      const response = await api.post('/users/register/', payload);
      
      if (response.status === 201) {
        const { access_token, refresh_token } = response.data;
        await SecureStore.setItemAsync('userToken', access_token);
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        Alert.alert("Success", "Registration successful!", [
          { text: "OK", onPress: () => router.push("/auth/loginScreen") }
        ]);
      }

    } catch (error) {
      console.log("--- AXIOS ERROR DIAGNOSTICS ---");
      console.log("Server Response Data:", error.response?.data);
    
      let userMessage = "Registration failed.";
      if (error.code === "ERR_NETWORK") {
        userMessage = "Network connection timeout. Verify your internet access stability.";
      } else if (error.response?.status === 400) {
        const serverErrors = error.response.data;
        userMessage = Object.values(serverErrors).flat().join("\n") || "Invalid details supplied.";
      }
      Alert.alert("Registration Problem", userMessage);
  
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={80}
      extraHeight={120}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
        <MyStatusBar />
        {header()}
        {imageView()}
        
        <View style={styles.formContainer}>
          {registerDescription()}
          {nameInfo()}
          {emailInfo()}
          {phoneNumberInfo()}
          {passwordInfo()}
          {roleSelectionInfo()}
          {termsAndConditionsBox()}
          {registerButton()}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );

  function header() {
    return (
      <View style={styles.headerBar}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButtonCircle}>
          <MaterialIcons name="arrow-back-ios" color={Colors.blackColor} size={18} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    );
  }

  function imageView() {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/FIKA_ppLogo.jpeg")}
          style={styles.brandLogo}
        />
      </View>
    );
  }

  function registerDescription() {
    return (
      <View style={styles.descriptionContainer}>
        <View style={styles.iconCircleBranding}>
          <MaterialCommunityIcons name="car-electric" color={Colors.primaryColor} size={28} />
        </View>
        <Text style={styles.titleText}>Create Account</Text>
        <Text style={styles.subtitleText}>
          Sign up to experience elite, premium on-demand rideshare logistics.
        </Text>
      </View>
    );
  }

  function nameInfo() {
    return (
      <View style={styles.rowInputsContainer}>
        <View style={[styles.valueBox, { flex: 1, marginRight: Sizes.fixPadding }]}>
          <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="First Name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            value={firstname}
            onChangeText={setFirstname}
          />
        </View>
        <View style={[styles.valueBox, { flex: 1 }]}>
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

  function emailInfo() {
    return (
      <View style={styles.valueBox}>
        <Ionicons name="mail-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Email Address"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
    );
  }

  // function phoneNumberInfo() {
  //   return (
  //     <View style={styles.phoneInputWrapper}>
  //       <PhoneInput
  //         ref={phoneInput}
  //         defaultCode="ZA"
  //         layout="first-country"
  //         onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
  //         onChangeCountry={(country) => {
  //           setCountryCode(country.cca2);
  //           if (country.callingCode?.length > 0) {
  //             setCallingCode(country.callingCode[0]);
  //           }
  //         }}
  //         countryPickerProps={{ withFlag: true, withEmoji: true }}
  //         containerStyle={styles.mobileNumberWrapStyle}
  //         textContainerStyle={{ backgroundColor: "transparent", paddingVertical: 0 }}
  //         dialCodeTextStyle={styles.dialCodeText}
  //         codeTextStyle={styles.dialCodeText}
  //       />
  //     </View>
  //   );
  // }
  function phoneNumberInfo() {
    return (
      <View style={styles.phoneInputWrapper}>
        <PhoneInput
          ref={phoneInput}
          defaultCode="ZA"
          layout="first" // Fix 1: Changed from "first-country" to valid "first"
          onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
          onChangeCountry={(country) => {
            setCountryCode(country.cca2);
            if (country.callingCode?.length > 0) {
              setCallingCode(country.callingCode[0]);
            }
          }}
          countryPickerProps={{ 
            withFlag: true, 
            withEmoji: true,
            renderFlagButton: undefined // Fix 2: Bypasses the broken custom flag container
          }}
          containerStyle={styles.mobileNumberWrapStyle}
          textContainerStyle={{ backgroundColor: "transparent", paddingVertical: 0 }}
          dialCodeTextStyle={styles.dialCodeText}
          codeTextStyle={styles.dialCodeText}
        />
      </View>
    );
  }


  function passwordInfo() {
    return (
      <View>
        <View style={styles.valueBox}>
          <Ionicons name="lock-closed-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Create Password"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            secureTextEntry={securePassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSecurePassword(!securePassword)}>
            <Ionicons name={securePassword ? "eye-off-outline" : "eye-outline"} color={Colors.grayColor} size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.valueBox}>
          <Ionicons name="lock-closed-outline" color={Colors.grayColor} size={18} />
          <TextInput
            placeholder="Confirm Password"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            secureTextEntry={secureConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}>
            <Ionicons name={secureConfirmPassword ? "eye-off-outline" : "eye-outline"} color={Colors.grayColor} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function roleSelectionInfo() {
    return (
      <View style={styles.roleContainer}>
        {/* Rider Radio Option */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setUserRole("rider")}
          style={[
            styles.roleOption,
            userRole === "rider" ? styles.activeRoleOption : styles.inactiveRoleOption,
          ]}
        >
          {/* <Ionicons
            name={userRole === "rider" ? "radio-button-on" : "radio-button-off"}
            color={userRole === "rider" ? "#2E7D32" : Colors.grayColor}
            size={20}
          /> */}
          <Text
            style={[
              styles.roleText,
              userRole === "rider" ? styles.activeRoleText : styles.inactiveRoleText,
            ]}
          >
            Rider
          </Text>
        </TouchableOpacity>
  
        {/* Driver Radio Option */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setUserRole("driver")}
          style={[
            styles.roleOption,
            userRole === "driver" ? styles.activeRoleOption : styles.inactiveRoleOption,
          ]}
        >
          {/* <Ionicons
            name={userRole === "driver" ? "radio-button-on" : "radio-button-off"}
            color={userRole === "driver" ? "#2E7D32" : Colors.grayColor}
            size={20}
          /> */}
          <Text
            style={[
              styles.roleText,
              userRole === "driver" ? styles.activeRoleText : styles.inactiveRoleText,
            ]}
          >
            Driver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function termsAndConditionsBox() {
    return (
      <View style={styles.termsCardContainer}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          style={styles.checkboxTouchTarget}
        >
          <MaterialCommunityIcons 
            name={agreeToTerms ? "checkbox-marked" : "checkbox-blank-outline"} 
            color={agreeToTerms ? Colors.primaryColor : Colors.grayColor} 
            size={22} 
          />
        </TouchableOpacity>
        <View style={styles.termsTextColumn}>
          <Text style={styles.termsBaseText}>
            I verify that I accept the{" "}
            <Text onPress={() => router.push("termsAndConditions/termsAndConditionsScreen")} style={styles.termsLinkText}>
              Terms & Conditions
            </Text>
            {" "}and have reviewed the{" "}
            <Text onPress={() => router.push("privacyPolicy/privacyPolicyScreen")} style={styles.termsLinkText}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    );
  }

  function registerButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRegister}
        disabled={isLoading}
        style={[styles.primaryActionBtn, isLoading && { opacity: 0.75 }]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.btnText}>Register</Text>
        )}
      </TouchableOpacity>
    );
  }
};

export default RegisterScreen;

// --- PREMIUM RECONFIGURED STYLESHEET ---
const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingTop: Sizes.fixPadding * 1.5,
    backgroundColor: Colors.primaryColor,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...CommonStyles.shadow,
  },
  imageContainer: {
    height: screenHeight / 5.5,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: Sizes.fixPadding * 3,
    borderBottomRightRadius: Sizes.fixPadding * 3,
  },
  brandLogo: {
    width: "80%",
    height: "60%",
    resizeMode: "contain",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Sizes.fixPadding * 2.5,
    paddingTop: Sizes.fixPadding,
  },
  descriptionContainer: {
    alignItems: "center",
    marginVertical: Sizes.fixPadding * 1.5,
  },
  iconCircleBranding: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Sizes.fixPadding,
  },
  titleText: {
    fontSize: 22,
    fontFamily: "Regular", // Fallback to your typography definition tokens
    fontWeight: "700",
    color: Colors.blackColor,
  },
  subtitleText: {
    ...Fonts.grayColor14Medium,
    textAlign: "center",
    marginTop: Sizes.fixPadding - 6,
    paddingHorizontal: Sizes.fixPadding,
    lineHeight: 20,
  },
  rowInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding * 1.5,
    height: 52,
    borderRadius: Sizes.fixPadding + 2,
    marginVertical: Sizes.fixPadding - 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    flex: 1,
    marginLeft: Sizes.fixPadding,
    height: "100%",
  },
  phoneInputWrapper: {
    marginVertical: Sizes.fixPadding - 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Sizes.fixPadding + 2,
    backgroundColor: Colors.whiteColor,
    overflow: "hidden",
    height: 52,
    justifyContent: "center",
  },
  mobileNumberWrapStyle: {
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
  },
  dialCodeText: {
    ...Fonts.blackColor15SemiBold,
    fontSize: 15,
  },
  termsCardContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.2,
    marginVertical: Sizes.fixPadding,
    alignItems: "flex-start",
  },
  checkboxTouchTarget: {
    marginRight: Sizes.fixPadding - 2,
    marginTop: 1,
  },
  termsTextColumn: {
    flex: 1,
  },
  termsBaseText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    fontFamily: "Regular",
  },
  termsLinkText: {
    color: Colors.primaryColor,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  primaryActionBtn: {
    backgroundColor: Colors.primaryColor,
    borderRadius: Sizes.fixPadding + 4,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Sizes.fixPadding * 1.5,
    ...CommonStyles.shadow,
  },
  btnText: {
    ...Fonts.whiteColor18Bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },


  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Sizes.fixPadding - 4,
  },
  roleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: Sizes.fixPadding + 2,
    borderWidth: 1,
    backgroundColor: Colors.whiteColor,
  },
  activeRoleOption: {
    borderColor: "#2E7D32", // Strong Green border color
    // backgroundColor: "#F1F8E9", // Light tint green background highlight
  },
  inactiveRoleOption: {
    borderColor: "#E2E8F0",
    backgroundColor: Colors.whiteColor,
  },
  roleText: {
    marginLeft: Sizes.fixPadding,
    fontSize: 15,
    fontWeight: "600",
  },
  activeRoleText: {
    color: "#2E7D32",
  },
  inactiveRoleText: {
    color: Colors.grayColor,
  },


});