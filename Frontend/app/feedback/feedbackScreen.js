import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function FeedbackScreen() {

  const params = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const submitFeedback = async () => {

    if (!rating) {
      Alert.alert(
        "Rating Required",
        "Please rate your ride."
      );
      return;
    }

    console.log({
      trip_id: params.trip_id,
      driver_id: params.driver_id,
      rating,
      feedback,
    });

    Alert.alert(
      "Thank You",
      "Your feedback has been submitted."
    );

    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        {/* <Image
          source={
            params.driver_image
              ? { uri: params.driver_image }
              : require("../../assets/images/user.png")
          }
          style={styles.driverImage}
        /> */}

        <Text style={styles.title}>
          Rate Your Ride
        </Text>

        <Text style={styles.driverName}>
          {params.driver_name}
        </Text>

        <Text style={styles.subtitle}>
          How was your trip today?
        </Text>

        {/* Stars */}
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (

            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
            >
              <Ionicons
                name={
                  star <= rating
                    ? "star"
                    : "star-outline"
                }
                size={42}
                color="#FFB800"
              />
            </TouchableOpacity>

          ))}
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsContainer}>

          {[
            "Friendly Driver",
            "Clean Vehicle",
            "Safe Driving",
            "On Time",
            "Comfortable Ride",
          ].map((tag) => (

            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() =>
                setFeedback(
                  feedback
                    ? feedback + ", " + tag
                    : tag
                )
              }
            >
              <Text style={styles.tagText}>
                {tag}
              </Text>
            </TouchableOpacity>

          ))}

        </View>

        {/* Feedback Box */}
        <TextInput
          style={styles.input}
          multiline
          placeholder="Tell us more about your experience..."
          value={feedback}
          onChangeText={setFeedback}
        />

      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitFeedback}
      >
        <Text style={styles.submitText}>
          Submit Feedback
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },

  driverImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 30,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  driverName: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: "600",
  },

  subtitle: {
    color: "#666",
    marginTop: 8,
    marginBottom: 30,
  },

  starContainer: {
    flexDirection: "row",
    marginBottom: 25,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },

  tag: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 5,
  },

  tagText: {
    fontWeight: "600",
  },

  input: {
    width: "100%",
    height: 140,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 16,
    padding: 15,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#FF9F1C",
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  submitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});