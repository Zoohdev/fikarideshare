import React, { memo } from "react";
import { Image, View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

const AnimatedDriverMarker = ({
  coordinate,
  heading = 0,
}) => {
  return (
    <Marker.Animated
      coordinate={coordinate}
      anchor={{
        x: 0.5,
        y: 0.5,
      }}
      flat
      rotation={heading}
    >
      <View style={styles.container}>
        <Image
          source={require("../../../assets/images/car-marker.png")}
          resizeMode="contain"
          style={[
            styles.car,
            {
              transform: [
                {
                  rotate: `${heading}deg`,
                },
              ],
            },
          ]}
        />
      </View>
    </Marker.Animated>
  );
};

export default memo(AnimatedDriverMarker);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  car: {
    width: 52,
    height: 52,
  },
});