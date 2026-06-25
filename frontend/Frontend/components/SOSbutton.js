import React from "react";
import { StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSOSEmergency } from "../hooks/useSOSEmergency";

export default function SOSButton({ rideId }) {
  const { isActive, trigger, resolve } = useSOSEmergency();

  const handlePress = () => {
    if (isActive) {
      Alert.alert(
        "Emergency Active",
        "Mark this incident as resolved? This stops location sharing and uploads the recorded audio.",
        [
          { text: "Keep active", style: "cancel" },
          { text: "Mark as resolved", style: "destructive", onPress: resolve },
        ]
      );
      return;
    }

    Alert.alert(
      "TRIGGER SOS?",
      "This will immediately call 10111 and alert safety response teams. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "YES, TRIGGER SOS", style: "destructive", onPress: () => trigger(rideId) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.fabSOS, isActive ? styles.activeCrisis : styles.idleState]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isActive ? "warning" : "shield-half-outline"}
        size={28}
        color="#FFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabSOS: {
    position: "absolute",
    top: 60,
    left: 20, // Positioned on the left, opposite to chat
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  idleState: {
    backgroundColor: '#dc3545', // Danger Red
  },
  activeCrisis: {
    backgroundColor: '#000000', // Turns black when active to indicate mode shift
    borderWidth: 2,
    borderColor: '#dc3545'
  }
});
