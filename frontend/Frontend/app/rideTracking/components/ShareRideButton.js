import React from "react";

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Share,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

const ShareRideButton = ({
  trackingUrl,
}) => {
  const handleShare =
    async () => {
      try {
        await Share.share({
          message: `Track my ride live:\n${trackingUrl}`,
        });
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleShare}
    >
      <Ionicons
        name="share-social"
        size={20}
        color="#fff"
      />

      <Text style={styles.text}>
        Share Ride
      </Text>
    </TouchableOpacity>
  );
};

export default ShareRideButton;

const styles = StyleSheet.create({
  button: {
    height: 50,

    borderRadius: 15,

    backgroundColor: "#FF6B00",

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",
  },

  text: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
  },
});