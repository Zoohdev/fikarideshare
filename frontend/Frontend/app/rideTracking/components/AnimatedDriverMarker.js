import React, { memo, useEffect, useRef } from "react";
import { Animated, View, Image, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

// Ported from the teammate's map update: a single flat car.png image
// instead of the per-tier VehicleIcon silhouette, plus a soft pulsing ring
// (the prototype's fikaCarPulse keyframes) so the marker doesn't look
// static between GPS pings.
const AnimatedDriverMarker = ({ coordinate, heading = 0 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0, 0],
  });

  return (
    <Marker.Animated coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} flat rotation={0}>
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, { transform: [{ scale }], opacity }]} />
        <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
          <Image source={require("../../../assets/images/car.png")} style={styles.carImage} resizeMode="contain" />
        </View>
      </View>
    </Marker.Animated>
  );
};

export default memo(AnimatedDriverMarker);

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#141E1A",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  pulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(91,201,160,0.5)",
  },
  carImage: {
    width: 42,
    height: 42,
  },
});
