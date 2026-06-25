import React, { memo } from "react";
import {
  Image,
  View,
  StyleSheet,
} from "react-native";

import { Marker } from "react-native-maps";

const RiderProfileMarker = ({
  coordinate,
  imageUrl,
}) => {
  return (
    <Marker coordinate={coordinate}>
      <View style={styles.markerContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: imageUrl,
            }}
            style={styles.image}
          />
        </View>

        <View style={styles.pointer} />
      </View>
    </Marker>
  );
};

export default memo(
  RiderProfileMarker
);

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
  },

  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",

    shadowOpacity: 0.15,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowRadius: 8,

    elevation: 4,
  },

  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  pointer: {
    width: 12,
    height: 12,
    backgroundColor: "#fff",

    transform: [
      {
        rotate: "45deg",
      },
    ],

    marginTop: -6,
  },
});