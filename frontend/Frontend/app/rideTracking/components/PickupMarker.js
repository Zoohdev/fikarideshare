import React, { memo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";

// Photo-ring pickup marker (the "FIKA Premium" prototype's confirmed final
// pick over a generic teal pin) - the rider's own photo or initials in a
// gold-ringed circle, with a small rotated-square pointer beneath it,
// instead of an anonymous person-in-a-circle icon.
function initialsFrom(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const PickupMarker = ({ coordinate, photoUrl, name }) => {
  if (!coordinate) return null;

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }}>
      <View style={styles.wrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <LinearGradient
            colors={["#0F4536", "#0A2E24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.initials}>{initialsFrom(name)}</Text>
          </LinearGradient>
        )}
        <View style={styles.pointer} />
      </View>
    </Marker>
  );
};

export default memo(PickupMarker);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    shadowColor: "#141E1A",
    shadowOpacity: 0.4,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: "#D4AF37",
  },
  initials: {
    color: "#FAF7F2",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
    fontFamily: "Montserrat_Bold",
  },
  pointer: {
    width: 14,
    height: 14,
    backgroundColor: "#D4AF37",
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
    marginTop: -8,
  },
});
