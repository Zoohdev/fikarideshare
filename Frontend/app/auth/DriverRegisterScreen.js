// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   TouchableOpacity,
//   TextInput,
//   Alert,ActivityIndicator
// } from "react-native";
// import React, { useRef ,useState } from "react";
// import {
//   Colors,
//   Fonts,
//   Sizes,
//   CommonStyles,
//   screenHeight,
// } from "../../constants/styles";
// import MyStatusBar from "../../components/myStatusBar";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { useRouter } from "expo-router";
// // import IntlPhoneInput from "react-native-intl-phone-input";
// import PhoneInput from "react-native-phone-number-input";
// import axios from "axios";
// import api from "../../services/api";
// import * as SecureStore from 'expo-secure-store';


// const RegisterScreen = () => {
//   const router = useRouter();
//   const phoneInput = useRef(null);
//   // const [name, setName] = useState("");
//   const [firstname, setFirstname] = useState("");
//   const [lastname, setLastname] = useState("");
//   const [email, setEmail] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [countryCode, setCountryCode] = useState("ZA");
//   const [callingCode, setCallingCode] = useState("27");
//   const [isLoading, setIsLoading] = useState(false);
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const handleRegister = async () => {
//     if (!firstname || !lastname || !email || !phoneNumber || !password || !confirmPassword) {
//       alert("All fields are required");
//       return;
//     }
    
//     if (!phoneNumber || phoneNumber.length < 7) {
//       Alert.alert("Invalid Input", "Please enter a valid mobile number.");
//       return;
//     }

//     const cleanLocalNumber = phoneNumber.replace(/^0+/, "").trim();

//     const cleanCode = callingCode ? callingCode.replace(/\D/g, "") : "27";

//     const finalizedPhoneNumber = `+${cleanCode}${cleanLocalNumber}`;
//     console.log("FINALIZED PHONE GOING TO DB:", finalizedPhoneNumber);
//     setIsLoading(true);
//     // const cleanPhoneNumber = phoneNumber.replace(/\D/g, ""); // removes spaces, dashes, etc.
//     // const cleanCallingCode = callingCode.replace(/\D/g, "");
    
//     try {
//       const payload = {
//         email :email,
//         phone_number: finalizedPhoneNumber,
//         first_name:firstname,
//         last_name : lastname,
//         password :password,
//         password_confirm :confirmPassword,
//         user_type : "driver"
        
//       };

//       console.log("Registering...")
//       const response = await api.post('/users/register/', payload);
      
//       console.log("Sending payload to Django:", payload);
//       console.log("Success data:", response.data);
//       if(response.status===201){
//         console.log("Registeration successful");
//         const { access_token, refresh_token, user } = response.data;

//         await SecureStore.setItemAsync('userToken', access_token);
//         await SecureStore.setItemAsync('refreshToken', refresh_token);

//       }
//       Alert.alert("Success", "Registration code sent!");

//     }catch (error) {
//       // 💡 CRITICAL DIAGNOSTIC LOGS — Check your React Native terminal for these!
//       console.log("--- AXIOS ERROR DIAGNOSTICS ---");
//       console.log("Error Message:", error.message);
//       console.log("Error Code:", error.code);
//       console.log("Server Response Status:", error.response?.status);
//       console.log("Server Response Data:", error.response?.data);
//       console.log("--------------------------------");
    
//       let userMessage = "Registration failed.";
    
//       if (error.code === "ERR_NETWORK") {
//         userMessage = `Cannot connect to Django Server! Verify your server is running on http://${callingCode ? 'your-ip' : ''}:8000 and your phone is on the same Wi-Fi network.`;
//       } if (error.code === "ERR_NETWORK") {
//         userMessage = `Cannot connect to Django Server! Verify your server is running on http://${callingCode ? 'your-ip' : ''}:8000 and your phone is on the same Wi-Fi network.`;
//       } else if (error.response?.status === 400) {
//         const serverErrors = error.response.data;
//         let errorMessages = [];
      
//         if (serverErrors.email && Array.isArray(serverErrors.email)) {
//           errorMessages.push(serverErrors.email[0]); 
//         }
      
//         if (serverErrors.phone_number && Array.isArray(serverErrors.phone_number)) {
//           errorMessages.push(serverErrors.phone_number[0]);
//         }
      
//         if (errorMessages.length > 0) {
//           userMessage = errorMessages.join("\n");
//         } else {
//           // Fallback for any other validation errors (like short passwords)
//           userMessage = Object.values(serverErrors).flat().join("\n") || "Invalid data.";
//         }
//       }
//       Alert.alert("Already Registered", userMessage);
  
//     } finally {
//       // Always unlock the button when execution finishes
//       setIsLoading(false);
//     }

    
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <MyStatusBar />
//       <View style={{ flex: 1 }}>
//         {header()}
//         <ScrollView
//           bounces={false}
//           showsVerticalScrollIndicator={false}
//           automaticallyAdjustKeyboardInsets={true}
//         >
//           {imageView()}
//           {registerInfo()}
//         </ScrollView>
//       </View>
//     </View>
//   );

//   function header() {
//     return (
//       <View
//         style={{
//           backgroundColor: Colors.primaryColor,
//           padding: Sizes.fixPadding * 2,
//         }}
//       >
//         <MaterialIcons
//           name="arrow-back-ios"
//           color={Colors.whiteColor}
//           size={22}
//           onPress={() => router.back()}
//         />
//       </View>
//     );
//   }

//   function registerInfo() {
//     return (
//       <View style={{ flex: 1 }}>
//         {registerDescription()}
//         {nameInfo()}
//         {emailInfo()}
//         {phoneNumberInfo()}
//         {passwordInfo()}
//         {registerButton()}
//       </View>
//     );
//   }

//   function nameInfo() {
//     return (
//       <View >
        
        
//         <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
//           <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
//           <TextInput
//             placeholder="First Name"
//             style={styles.textFieldStyle}
//             placeholderTextColor={Colors.grayColor}
//             value={firstname}
//             onChangeText={setFirstname}
//           />
//         </View>
//         <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
//           <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
//           <TextInput
//             placeholder="Last Name"
//             style={styles.textFieldStyle}
//             placeholderTextColor={Colors.grayColor}
//             value={lastname}
//             onChangeText={setLastname}
//           />
//         </View>
//       </View>
      
//     );
//   }

//   function passwordInfo() {
//     return (
//       <View>
//         <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
//           <Ionicons name="key-outline" color={Colors.grayColor} size={18} />
//           <TextInput
//             placeholder="Please create password"
//             style={styles.textFieldStyle}
//             placeholderTextColor={Colors.grayColor}
//             value={password}
//             onChangeText={setPassword}
//           />
//         </View>

//         <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding}}>
//           <Ionicons name="key-outline" color={Colors.grayColor} size={18} />
//           <TextInput
//             placeholder="Please confirm password"
//             style={styles.textFieldStyle}
//             placeholderTextColor={Colors.grayColor}
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//           />
//         </View>
//       </View>

      
//     );
//   }

//   function emailInfo() {
//     return (
//       <View style={{ ...styles.valueBox, marginVertical: Sizes.fixPadding * 2 }}>
//         <Ionicons name="mail-outline" color={Colors.grayColor} size={18} />
//         <TextInput
//           placeholder="Enter your email address"
//           style={styles.textFieldStyle}
//           placeholderTextColor={Colors.grayColor}
//           keyboardType="email-address"
//           value={email}
//           onChangeText={setEmail}
//         />
//       </View>
//     );
//   }


//   function phoneNumberInfo() {
//     return (
//         <PhoneInput
//         defaultCode="ZA" 
//         layout="first-country"
//           onChangeText={(text) => {
//             const cleanedPhone = text.replace(/\D/g, "");
//             setPhoneNumber(cleanedPhone);
//           }}
//           onChangeCountry={(country) => {
//             // country.callingCode array holds the dial codes (e.g., ["27"])
//             setCountryCode(country.cca2);
//             if (country.callingCode && country.callingCode.length > 0) {
//               setCallingCode(country.callingCode[0]);
//               console.log("Country changed to dialing code:", country.callingCode[0]);
//             }
//           }}
//           countryPickerProps={{
//             withFlag: true,
//             withEmoji: true,
//           }}
//           containerStyle={styles.mobileNumberWrapStyle}
          
//                           // phoneInputStyle={styles.textFieldStyle}
//                           dialCodeTextStyle={{
//                             ...Fonts.blackColor15SemiBold,
//                             marginHorizontal: Sizes.fixPadding - 2
//                           }}
//                           // dialCodeTextStyle={styles.textFieldStyle}
//                           flagStyle={{ fontSize: 28 }}
//           textContainerStyle={{ backgroundColor: "transparent" }}
//         />
//     );
//   }

//   function registerButton() {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={handleRegister}
//         disabled={isLoading}
//         style={[
//           CommonStyles.button, 
//           { marginVertical: Sizes.fixPadding * 4 },
//           // 💡 Optional: Make the button look slightly faded/disabled while loading
//           isLoading && { opacity: 0.6 } 
//         ]}

//       >
//         {isLoading ? (
//         //If loading is true, show the spinner
//         <ActivityIndicator color={Colors.whiteColor || "#FFF"} size="small" />
//       ) : (
//         // If loading is false, show the regular text
//         <Text style={{ ...Fonts.whiteColor18Bold }}>Register</Text>
//       )}
//       </TouchableOpacity>
//     );
//   }

//   function registerDescription() {
//     return (
//       <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
//         <Text style={{ ...Fonts.blackColor20SemiBold }}>Register</Text>
//         <Text
//           style={{ ...Fonts.grayColor15Medium, textAlign: "center", marginTop: Sizes.fixPadding }}
//         >
//           Welcome, please create your account using your information
//         </Text>
//       </View>
//     );
//   }

//   function imageView() {
//     return (
//       <View style={styles.imageViewWrapStyle}>
//         <Image
//           source={require("../../assets/images/FIKA_ppLogo.png")}
//           style={{ width: "100%", height: "65%", resizeMode: "contain" }}
//         />
//       </View>
//     );
//   }
// };

// export default RegisterScreen;

// const styles = StyleSheet.create({
//   imageViewWrapStyle: {
//     height: screenHeight / 2.7,
//     backgroundColor: Colors.primaryColor,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: -40,
//   },
//   valueBox: {
//     backgroundColor: Colors.whiteColor,
//     paddingHorizontal: Sizes.fixPadding,
//     paddingVertical: Sizes.fixPadding + 5,
//     ...CommonStyles.shadow,
//     borderRadius: Sizes.fixPadding,
//     marginHorizontal: Sizes.fixPadding * 2,
//     ...CommonStyles.rowAlignCenter,
//   },
//   textFieldStyle: {
//     ...Fonts.blackColor15Medium,
//     height: 20,
//     padding: 0,
//     flex: 1,
//     marginLeft: Sizes.fixPadding,
//   },
//   mobileNumberWrapStyle: {
//     backgroundColor: Colors.whiteColor,
//     borderRadius: Sizes.fixPadding,
//     padding: Sizes.fixPadding - 7,
//     ...CommonStyles.shadow,
//     marginHorizontal: Sizes.fixPadding * 2,
//     marginTop: Sizes.fixPadding-10,
//     marginBottom: Sizes.fixPadding,
//     width:'auto'
//   },
// });


import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "All registration fields are required.");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Your passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      Alert.alert("Terms & Conditions", "Please read and agree to the Terms & Conditions to proceed.");
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
        user_type: "driver"
      };

      const response = await api.post('/users/register/', payload);
      
      if (response.status === 201) {
        const { access_token, refresh_token } = response.data;
        await SecureStore.setItemAsync('userToken', access_token);
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        Alert.alert("Success", "Driver registration request submitted!");
        router.push("/auth/loginScreen");
      }

    } catch (error) {
      console.log("--- AXIOS ERROR DIAGNOSTICS ---");
      console.log("Server Response Data:", error.response?.data);
    
      let userMessage = "Registration failed.";
      if (error.code === "ERR_NETWORK") {
        userMessage = "Network link failure. Please verify your internet connection stability.";
      } else if (error.response?.status === 400) {
        const serverErrors = error.response.data;
        userMessage = Object.values(serverErrors).flat().join("\n") || "Invalid verification details.";
      }
      Alert.alert("Registration Failed", userMessage);
  
    } compression: {
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
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {imageView()}
          <View style={styles.formCardContainer}>
            {registerDescription()}
            {nameInfo()}
            {emailInfo()}
            {phoneNumberInfo()}
            {passwordInfo()}
            {termsAndConditionsBox()}
            {registerButton()}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  function header() {
    return (
      <View style={styles.headerBar}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButtonAction}>
          <MaterialIcons name="arrow-back-ios" color={Colors.blackColor} size={18} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    );
  }

  function imageView() {
    return (
      <View style={styles.imageViewWrapStyle}>
        <Image
          source={require("../../assets/images/FIKA_ppLogo.png")}
          style={styles.logoImageStyle}
        />
      </View>
    );
  }

  function registerDescription() {
    return (
      <View style={styles.descriptionBlock}>
        <View style={styles.brandingCircleIcon}>
          <MaterialCommunityIcons name="steering" color={Colors.primaryColor} size={28} />
        </View>
        <Text style={styles.mainTitleText}>Driver Registration</Text>
        <Text style={styles.subTitleDescriptionText}>
          Create your professional credentials to access and fulfill client logistics requests.
        </Text>
      </View>
    );
  }

  function nameInfo() {
    return (
      <View style={styles.sideBySideRow}>
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
          placeholder="Corporate Email Address"
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

  function phoneNumberInfo() {
    return (
      <View style={styles.phoneInputBoxWrapper}>
        <PhoneInput
          ref={phoneInput}
          defaultCode="ZA"
          layout="first-country"
          onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ""))}
          onChangeCountry={(country) => {
            setCountryCode(country.cca2);
            if (country.callingCode?.length > 0) {
              setCallingCode(country.callingCode[0]);
            }
          }}
          countryPickerProps={{ withFlag: true, withEmoji: true }}
          containerStyle={styles.mobileNumberWrapStyle}
          textContainerStyle={{ backgroundColor: "transparent", paddingVertical: 0 }}
          dialCodeTextStyle={styles.phoneCodeLabelStyle}
          codeTextStyle={styles.phoneCodeLabelStyle}
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
            placeholder="Secure Password"
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

  function termsAndConditionsBox() {
    return (
      <View style={styles.termsAgreementBlock}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          style={styles.checkboxWrapperTouch}
        >
          <MaterialCommunityIcons 
            name={agreeToTerms ? "checkbox-marked" : "checkbox-blank-outline"} 
            color={agreeToTerms ? Colors.primaryColor : Colors.grayColor} 
            size={22} 
          />
        </TouchableOpacity>
        <View style={styles.termsTextWrapper}>
          <Text style={styles.legalLabelInlineText}>
            I hereby agree to the{" "}
            <Text onPress={() => router.push("termsAndConditions/termsAndConditionsScreen")} style={styles.interactiveLinkStyle}>
              Terms & Conditions
            </Text>
            {" "}and clarify acknowledgement of the{" "}
            <Text onPress={() => router.push("privacyPolicy/privacyPolicyScreen")} style={styles.interactiveLinkStyle}>
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
        style={[styles.primaryActionBtnStyle, isLoading && { opacity: 0.7 }]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>Apply as Driver</Text>
        )}
      </TouchableOpacity>
    );
  }
};

export default RegisterScreen;

// --- POLISHED DESIGN DRIVER APPLICATION SHEET ---
const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingTop: Sizes.fixPadding * 1.5,
    backgroundColor: Colors.primaryColor,
  },
  backButtonAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...CommonStyles.shadow,
  },
  imageViewWrapStyle: {
    height: screenHeight / 6,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: Sizes.fixPadding * 2.5,
    borderBottomRightRadius: Sizes.fixPadding * 2.5,
  },
  logoImageStyle: {
    width: "75%",
    height: "55%",
    resizeMode: "contain",
  },
  formCardContainer: {
    flex: 1,
    paddingHorizontal: Sizes.fixPadding * 2.5,
    paddingTop: Sizes.fixPadding * 0.5,
  },
  descriptionBlock: {
    alignItems: "center",
    marginVertical: Sizes.fixPadding * 1.5,
  },
  brandingCircleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Sizes.fixPadding - 2,
  },
  mainTitleText: {
    fontSize: 21,
    fontWeight: "700",
    color: Colors.blackColor,
    fontFamily: "Regular",
  },
  subTitleDescriptionText: {
    ...Fonts.grayColor14Medium,
    textAlign: "center",
    marginTop: Sizes.fixPadding - 6,
    paddingHorizontal: Sizes.fixPadding * 0.5,
    lineHeight: 19,
  },
  sideBySideRow: {
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
  phoneInputBoxWrapper: {
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
  phoneCodeLabelStyle: {
    ...Fonts.blackColor15SemiBold,
    fontSize: 15,
  },
  termsAgreementBlock: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.2,
    marginVertical: Sizes.fixPadding,
    alignItems: "flex-start",
  },
  checkboxWrapperTouch: {
    marginRight: Sizes.fixPadding - 2,
    marginTop: 1,
  },
  termsTextWrapper: {
    flex: 1,
  },
  legalLabelInlineText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    fontFamily: "Regular",
  },
  interactiveLinkStyle: {
    color: Colors.primaryColor,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  primaryActionBtnStyle: {
    backgroundColor: Colors.primaryColor,
    borderRadius: Sizes.fixPadding + 4,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Sizes.fixPadding * 1.2,
    ...CommonStyles.shadow,
  },
  actionButtonText: {
    ...Fonts.whiteColor18Bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});