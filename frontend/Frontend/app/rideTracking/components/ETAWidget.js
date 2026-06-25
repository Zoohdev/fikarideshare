import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

const ETAWidget = ({
  duration = 0,
  distance = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons
          name="time"
          size={18}
          color="#FF6B00"
        />

        <Text style={styles.time}>
          {Math.ceil(duration)} min away
        </Text>
      </View>

      <Text style={styles.distance}>
        {distance.toFixed(1)} km
      </Text>
    </View>
  );
};

export default ETAWidget;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",

    borderRadius: 20,

    paddingVertical: 12,

    paddingHorizontal: 16,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowRadius: 10,

    elevation: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  time: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  distance: {
    fontWeight: "600",
    color: "#555",
  },
});