import React, { useEffect, useRef, memo } from "react";
import { Animated, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";

const SIZE = 150;
const DURATION = 2400;

// Two staggered pulsing rings under the pickup marker while a ride is
// "searching" for a driver - the prototype's fikaRadar keyframes
// (scale 0.35->2.4, opacity 0.55->0). Previously there was no visual
// distinction on the map between "searching" and "idle".
function Ring({ delay }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 2.4] });
  const opacity = progress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.55, 0, 0],
  });

  return (
    <Animated.View
      style={[styles.ring, { transform: [{ scale }], opacity }]}
      pointerEvents="none"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <RadialGradient id="radar" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#5BC9A0" stopOpacity={0.4} />
            <Stop offset="70%" stopColor="#5BC9A0" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#radar)" />
      </Svg>
    </Animated.View>
  );
}

const SearchingRadar = ({ coordinate }) => {
  if (!coordinate) return null;

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={-1}>
      <Ring delay={0} />
      <Ring delay={1200} />
    </Marker>
  );
};

export default memo(SearchingRadar);

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    left: -SIZE / 2,
    top: -SIZE / 2,
    width: SIZE,
    height: SIZE,
  },
});
