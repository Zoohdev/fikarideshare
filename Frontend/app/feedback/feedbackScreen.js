import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "../../services/api";

export default function FeedbackScreen() {

  const params = useLocalSearchParams();
  const rideId = params.rideId;

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [driverName, setDriverName] = useState(params.driver_name || "");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  useEffect(() => {
    api.get("/ratings/categories/")
      .then((response) => setCategories(response.data || []))
      .catch((error) => console.error("Error fetching rating categories:", error));

    if (rideId) {
      api.get(`/rides/trips/${rideId}/`)
        .then((response) => setDriverName(response.data?.driver?.full_name || ""))
        .catch((error) => console.error("Error fetching ride for feedback:", error));
    }
  }, [rideId]);

  const toggleTag = (category) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(category.id)
        ? prev.filter((id) => id !== category.id)
        : [...prev, category.id]
    );
    setFeedback((prev) => (prev ? `${prev}, ${category.name}` : category.name));
  };

  const submitFeedback = async () => {

    if (!rating) {
      Alert.alert(
        "Rating Required",
        "Please rate your ride."
      );
      return;
    }

    if (!rideId) {
      Alert.alert("Error", "We couldn't tell which ride this feedback is for.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/ratings/submit/", {
        ride: rideId,
        score: rating,
        comment: feedback,
        category_ids: selectedCategoryIds,
      });

      Alert.alert(
        "Thank You",
        "Your feedback has been submitted."
      );

      router.replace("/(tabs)/home/homeScreen");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Could not submit your feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        <Text style={styles.title}>
          Rate Your Ride
        </Text>

        {driverName ? (
          <Text style={styles.driverName}>
            {driverName}
          </Text>
        ) : null}

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

          {categories.map((category) => (

            <TouchableOpacity
              key={category.id}
              style={[
                styles.tag,
                selectedCategoryIds.includes(category.id) && styles.tagSelected,
              ]}
              onPress={() => toggleTag(category)}
            >
              <Text style={styles.tagText}>
                {category.name}
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
        style={[styles.submitButton, submitting && { opacity: 0.6 }]}
        onPress={submitFeedback}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Submitting..." : "Submit Feedback"}
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

  tagSelected: {
    backgroundColor: "#FFE7C2",
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
