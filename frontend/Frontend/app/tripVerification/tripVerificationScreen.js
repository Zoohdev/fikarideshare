import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";

const TripVerificationScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();

  const {
    trip_id,
    trip_code,
    riders,
    sequence,
    driver,
    eta,
  } = route.params;

  const [code, setCode] =
    useState("");

  const verifyRideCode = async () => {

    if (!code.trim()) {

      Alert.alert(
        "Error",
        "Please enter verification code"
      );

      return;
    }

    // LOCAL CHECK

    if (
      code.trim() === trip_code
    ) {

      navigation.replace(
        "endRide/endRideScreen",
        {
          trip_id,
          riders,
          sequence,
          driver,
          eta,
        }
      );

      return;
    }

    Alert.alert(
      "Invalid Code",
      "Ride code does not match"
    );
  };

  return (
    <View style={styles.container}>

      <MyStatusBar />

      <Header
        title="Verify Ride"
        navigation={navigation}
      />

      <View style={styles.content}>

        <Text style={styles.title}>
          Enter Ride Code
        </Text>

        <Text style={styles.subtitle}>
          Ask passenger for the trip
          verification code
        </Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter Code"
          style={styles.input}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={verifyRideCode}
        >
          <Text style={styles.buttonText}>
            Verify & Start Ride
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default TripVerificationScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
  },

  button: {
    height: 55,
    backgroundColor: "#FF8811",
    marginTop: 25,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});