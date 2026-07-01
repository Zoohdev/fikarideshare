import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path, Rect } from "react-native-svg";

// Gold teardrop pin with a flag glyph - paired with PickupMarker's photo
// ring so pickup/dropoff read as a deliberate set instead of two
// unrelated assets (previously a flat destination.png image).
const DropoffMarker = ({ coordinate }) => {
  if (!coordinate) return null;

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }}>
      <View style={styles.wrap}>
        <Svg width={50} height={62} viewBox="0 0 40 50">
          <Path
            d="M20 49 C20 49 4 30 4 18 a16 16 0 0 1 32 0 C36 30 20 49 20 49 Z"
            fill="#E8A33D"
          />
          <Path
            d="M20 49 C20 49 4 30 4 18 a16 16 0 0 1 32 0 C36 30 20 49 20 49 Z"
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2}
          />
          <Path d="M14 11 h13 l-3 4 l3 4 h-13 z" fill="#FAF7F2" />
          <Rect x={13.2} y={10} width={2} height={15} rx={1} fill="#FAF7F2" />
        </Svg>
      </View>
    </Marker>
  );
};

export default memo(DropoffMarker);

const styles = StyleSheet.create({
  wrap: {
    shadowColor: "#141E1A",
    shadowOpacity: 0.32,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
  },
});
