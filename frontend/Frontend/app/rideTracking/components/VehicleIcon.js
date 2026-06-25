import React, { memo } from "react";
import Svg, { Path, Circle, G } from "react-native-svg";

// Per-tier car silhouette, ported from the "FIKA Premium" claude.ai/design
// prototype's carIcon(kind, color) generator. One component used both as
// the live driver map marker (AnimatedDriverMarker) and the vehicle-type
// icon in the "choose a ride" list - distinct silhouettes per tier instead
// of the same car glyph recolored, so tiers are visually distinguishable
// at a glance.
const SHAPES = {
  economy: {
    body: "M8 32 L11 21 Q13 16 20 15 L31 11 Q37 9 44 10 L56 12 Q63 14 67 20 L74 24 Q78 26 77 32 Z",
    wheels: [22, 60],
    windows: ["M23 14 L43 12 L41 19 L20 20 Z"],
  },
  comfort: {
    body: "M5 33 L8 23 Q10 18 18 17 L30 12 Q37 10 46 11 L62 12 Q71 14 76 20 L83 25 Q86 27 85 33 Z",
    wheels: [24, 66],
    windows: ["M24 15 L46 13 L44 20 L21 21 Z"],
  },
  premium: {
    body: "M4 33 L6 26 Q8 21 18 20 L34 13 Q46 9 60 11 L74 14 Q84 17 87 25 Q89 30 86 33 Z",
    wheels: [24, 67],
    windows: ["M24 18 L50 14 L48 21 L22 22 Z"],
    pinstripe: "M8 27 L84 24",
  },
  xl: {
    body: "M9 33 L9 16 Q9 11 16 11 L62 11 Q72 11 77 17 L84 24 Q87 27 86 33 Z",
    wheels: [25, 65],
    windows: ["M16 14 L37 13 L37 22 L15 22 Z", "M41 13 L60 14 L66 22 L41 22 Z"],
  },
};

const Wheel = ({ cx }) => (
  <G>
    <Circle cx={cx} cy={34} r={7} fill="#1C1C1E" />
    <Circle cx={cx} cy={34} r={3} fill="#D4AF37" />
  </G>
);

const VehicleIcon = ({ type = "economy", color = "#0A2E24", size = 56 }) => {
  const shape = SHAPES[type] || SHAPES.economy;
  const height = (size / 92) * 44;

  return (
    <Svg width={size} height={height} viewBox="0 0 92 44">
      <Path d={shape.body} fill={color} />
      {shape.windows.map((d, i) => (
        <Path key={i} d={d} fill="#9FD0DF" opacity={0.9} />
      ))}
      {shape.pinstripe && (
        <Path d={shape.pinstripe} stroke="#D4AF37" strokeWidth={1.6} fill="none" />
      )}
      <Wheel cx={shape.wheels[0]} />
      <Wheel cx={shape.wheels[1]} />
    </Svg>
  );
};

export default memo(VehicleIcon);
