import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

const DriverInfoCard = ({
  driverName,
  driverPhoto,
  rating,
  vehicleModel,
  vehicleNumber,
  onCall,
  onChat,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Image
          source={{
            uri: driverPhoto,
          }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.name}>
            {driverName}
          </Text>

          <Text style={styles.rating}>
            ⭐ {rating}
          </Text>

          <Text style={styles.vehicle}>
            {vehicleModel}
          </Text>

          <Text style={styles.vehicleNumber}>
            {vehicleNumber}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onChat}
        >
          <Ionicons
            name="chatbubble"
            size={22}
            color="#FF6B00"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onCall}
        >
          <Ionicons
            name="call"
            size={22}
            color="#FF6B00"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DriverInfoCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,

    elevation: 5,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  info: {
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  rating: {
    marginTop: 2,
    color: "#555",
  },

  vehicle: {
    marginTop: 4,
    fontSize: 13,
    color: "#444",
  },

  vehicleNumber: {
    fontSize: 13,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3EB",

    justifyContent: "center",
    alignItems: "center",

    marginLeft: 10,
  },
});