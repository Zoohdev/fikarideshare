import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const DriverRegisterScreen = () => {

  const navigation = useNavigation();

  const [name, setname] = useState("");
  const [email, setemail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [licenseNumber, setlicenseNumber] = useState("");
  const [licenseExpiry, setlicenseExpiry] = useState("");
  const [carMake, setcarMake] = useState("");
  const [carModel, setcarModel] = useState("");
  const [plateNumber, setplateNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = "http://10.0.2.2:3000"; // Localhost for Android emulator

  const handleRegister = async () => {
    // Validate all fields are filled
    if (!name || !email || !phoneNumber || !licenseNumber || !licenseExpiry || !carMake || !carModel || !plateNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Validate license expiry date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(licenseExpiry)) {
      Alert.alert('Error', 'Please enter license expiry date in YYYY-MM-DD format');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/drivers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phoneNumber: phoneNumber,
          licenseNumber: licenseNumber,
          licenseExpiry: licenseExpiry,
          carMake: carMake,
          carModel: carModel,
          plateNumber: plateNumber
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store token and driver data
        await AsyncStorage.setItem('driverToken', data.token);
        await AsyncStorage.setItem('driverData', JSON.stringify(data.data));
        
        Alert.alert("Success ✅", "Registration completed successfully!", [
        { 
           text: "Go to Login", 
           onPress: () => navigation.replace("auth/loginScreen")
        }
       ]);

        } else {
          Alert.alert('Registration Failed', data.message || 'Please try again');
        }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to connect to server. Please check your internet connection.');
    } finally {
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
          contentContainerStyle={{}}
        >
          {imageView()}
          {registerInfo()}
        </ScrollView>
      </View>
    </View>
  );

  // Header
  function header() {
    return (
      <View
        style={{
          backgroundColor: Colors.primaryColor,
          padding: Sizes.fixPadding * 2.0,
        }}
      >
        <MaterialIcons
          name="arrow-back-ios"
          color={Colors.whiteColor}
          size={22}
          style={{ alignSelf: "flex-start" }}
          onPress={() => navigation.pop()}
        />
      </View>
    );
  }

  // Registration Content
  function registerInfo() {
    return (
      <View style={{ flex: 1 }}>
        {registerDescription()}
        {nameInfo()}
        {emailInfo()}
        {phoneNumberInfo()}
        {licenseNumberInfo()}
        {licenseExpiryInfo()}
        {carMakeInfo()}
        {carModelInfo()}
        {plateNumberInfo()}
        {registerButton()}
      </View>
    );
  }

  // Inputs
  function nameInfo() {
    return (
      <View style={styles.valueBox}>
        <Ionicons name="person-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Full name"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={name}
          onChangeText={setname}
        />
      </View>
    );
  }

  function emailInfo() {
    return (
      <View style={{ ...styles.valueBox, marginVertical: Sizes.fixPadding * 2 }}>
        <Ionicons name="mail-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Email address"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          keyboardType="email-address"
          value={email}
          onChangeText={setemail}
          autoCapitalize="none"
        />
      </View>
    );
  }

  function phoneNumberInfo() {
    return (
      <View style={styles.valueBox}>
        <Ionicons name="call-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Phone number"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>
    );
  }

  function licenseNumberInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="card-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Driver license number"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={licenseNumber}
          onChangeText={setlicenseNumber}
          autoCapitalize="characters"
        />
      </View>
    );
  }

  function licenseExpiryInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="calendar-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="License expiry date (YYYY-MM-DD)"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={licenseExpiry}
          onChangeText={setlicenseExpiry}
        />
      </View>
    );
  }

  function carMakeInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="car-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Car make (e.g. Toyota)"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={carMake}
          onChangeText={setcarMake}
        />
      </View>
    );
  }

  function carModelInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="car-sport-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Car model (e.g. Corolla)"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={carModel}
          onChangeText={setcarModel}
        />
      </View>
    );
  }

  function plateNumberInfo() {
    return (
      <View style={{ ...styles.valueBox, marginTop: Sizes.fixPadding }}>
        <Ionicons name="pricetag-outline" color={Colors.grayColor} size={18} />
        <TextInput
          placeholder="Number plate"
          style={styles.textFieldStyle}
          placeholderTextColor={Colors.grayColor}
          value={plateNumber}
          onChangeText={setplateNumber}
          autoCapitalize="characters"
        />
      </View>
    );
  }

  // Button
  function registerButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRegister}
        disabled={isLoading}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 4,
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.whiteColor} />
        ) : (
          <Text style={{ ...Fonts.whiteColor18Bold }}>Submit Registration</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Header Text
  function registerDescription() {
    return (
      <View style={{ alignItems: "center", margin: Sizes.fixPadding * 3 }}>
        <Text style={{ ...Fonts.blackColor20SemiBold }}>Driver Registration</Text>
        <Text
          style={{
            ...Fonts.grayColor15Medium,
            textAlign: "center",
            marginTop: Sizes.fixPadding,
          }}
        >
          Please complete your driver details to continue
        </Text>
      </View>
    );
  }

  // Image
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

export default DriverRegisterScreen;

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