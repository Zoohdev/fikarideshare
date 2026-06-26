import React from "react";
import Svg, { Path, Circle, Ellipse, Rect, G, Text as SvgText } from "react-native-svg";

// Ported from the "FIKA Onboarding" claude.ai/design prototype's inline
// SVGs - one illustration per slide, kept here (not a shared component
// folder) since they're only ever used by onboardingScreen.js.

export function FastReliableIllustration() {
  return (
    <Svg width={220} height={220} viewBox="0 0 300 300">
      <Ellipse cx={150} cy={236} rx={118} ry={20} fill="#0A2E24" opacity={0.06} />
      <G stroke="#D4AF37" strokeWidth={5} strokeLinecap="round" opacity={0.45}>
        <Path d="M20 156 H62" />
        <Path d="M8 180 H46" />
        <Path d="M28 204 H64" />
      </G>
      <Path
        d="M70 200 L84 152 Q90 134 112 132 L150 122 Q172 118 192 122 L226 130 Q252 136 266 160 L278 184 Q284 198 276 208 L74 208 Q66 206 70 200 Z"
        fill="#E8A33D"
      />
      <Path d="M98 154 Q102 142 118 140 L148 134 L146 166 L90 168 Z" fill="#0A2E24" />
      <Path d="M156 134 L188 136 Q208 140 218 158 L150 162 Z" fill="#0A2E24" />
      <Path d="M74 198 L276 198" stroke="#C99A2E" strokeWidth={2} opacity={0.5} />
      <Circle cx={118} cy={208} r={23} fill="#1C1C1E" />
      <Circle cx={118} cy={208} r={9} fill="#D4AF37" />
      <Circle cx={228} cy={208} r={23} fill="#1C1C1E" />
      <Circle cx={228} cy={208} r={9} fill="#D4AF37" />
      <G transform="translate(176 36)">
        <Path d="M20 49 C20 49 4 30 4 18 a16 16 0 0 1 32 0 C36 30 20 49 20 49 Z" fill="#0A2E24" />
        <Circle cx={20} cy={18} r={7} fill="#E8A33D" />
      </G>
      <G transform="translate(60 92)">
        <Circle r={17} fill="#D4AF37" />
        <Path d="M-7 0 L-2 6 L8 -6" stroke="#0A2E24" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

export function YourRouteIllustration() {
  return (
    <Svg width={220} height={220} viewBox="0 0 300 300">
      <Ellipse cx={150} cy={240} rx={120} ry={20} fill="#0A2E24" opacity={0.06} />
      <Rect x={92} y={40} width={124} height={208} rx={22} fill="#0A2E24" />
      <Rect x={100} y={56} width={108} height={176} rx={12} fill="#F5F0E8" />
      <G stroke="#E4DAC7" strokeWidth={6} strokeLinecap="round">
        <Path d="M100 110 H208" />
        <Path d="M100 168 H208" />
        <Path d="M138 56 V232" />
        <Path d="M178 56 V232" />
      </G>
      <Rect x={148} y={116} width={26} height={22} rx={3} fill="#86C083" opacity={0.65} />
      <Rect x={106} y={174} width={26} height={22} rx={3} fill="#5DA9C7" opacity={0.5} />
      <Path
        d="M118 214 C118 178 158 176 156 138 C155 116 176 100 188 86"
        stroke="#0A2E24"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        opacity={0.18}
      />
      <Path
        d="M118 214 C118 178 158 176 156 138 C155 116 176 100 188 86"
        stroke="#E8A33D"
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={118} cy={214} r={6} fill="#0A2E24" stroke="#fff" strokeWidth={2.5} />
      <G transform="translate(168 56)">
        <Path d="M20 49 C20 49 4 30 4 18 a16 16 0 0 1 32 0 C36 30 20 49 20 49 Z" fill="#E8A33D" />
        <Circle cx={20} cy={18} r={7} fill="#FAF7F2" />
      </G>
      <G transform="translate(40 196)">
        <Path
          d="M4 30 L10 14 Q12 8 22 8 L48 8 Q58 8 63 14 L70 24 Q73 28 71 32 L6 32 Q2 32 4 30 Z"
          fill="#D4AF37"
        />
        <Path d="M18 12 L40 12 L40 22 L14 22 Z" fill="#0A2E24" />
        <Circle cx={22} cy={32} r={7} fill="#1C1C1E" />
        <Circle cx={56} cy={32} r={7} fill="#1C1C1E" />
      </G>
    </Svg>
  );
}

export function PaySeatIllustration() {
  return (
    <Svg width={220} height={220} viewBox="0 0 300 300">
      <Ellipse cx={150} cy={238} rx={122} ry={20} fill="#0A2E24" opacity={0.06} />
      <G transform="translate(74 168) scale(0.82)" opacity={0.55}>
        <Rect x={-20} y={-34} width={40} height={48} rx={13} fill="#D9D3C8" />
        <Rect x={-27} y={8} width={54} height={20} rx={9} fill="#D9D3C8" />
        <Rect x={-31} y={-10} width={11} height={34} rx={5.5} fill="#C9C9C9" />
        <Rect x={20} y={-10} width={11} height={34} rx={5.5} fill="#C9C9C9" />
      </G>
      <G transform="translate(226 168) scale(0.82)" opacity={0.55}>
        <Rect x={-20} y={-34} width={40} height={48} rx={13} fill="#D9D3C8" />
        <Rect x={-27} y={8} width={54} height={20} rx={9} fill="#D9D3C8" />
        <Rect x={-31} y={-10} width={11} height={34} rx={5.5} fill="#C9C9C9" />
        <Rect x={20} y={-10} width={11} height={34} rx={5.5} fill="#C9C9C9" />
      </G>
      <G transform="translate(150 150)">
        <Rect x={-24} y={-40} width={48} height={56} rx={15} fill="#E8A33D" />
        <Rect x={-32} y={10} width={64} height={24} rx={11} fill="#E8A33D" />
        <Rect x={-37} y={-12} width={13} height={40} rx={6.5} fill="#D4AF37" />
        <Rect x={24} y={-12} width={13} height={40} rx={6.5} fill="#D4AF37" />
        <Rect x={-15} y={-30} width={30} height={36} rx={9} fill="#F0C778" opacity={0.55} />
      </G>
      <G transform="translate(150 72)">
        <Rect x={-30} y={-18} width={60} height={36} rx={18} fill="#0A2E24" />
        <SvgText x={0} y={6} textAnchor="middle" fontFamily="Montserrat_Bold" fontSize={18} fontWeight="800" fill="#E8A33D">
          $8
        </SvgText>
        <Path d="M-6 16 L0 24 L6 16 Z" fill="#0A2E24" />
      </G>
      <G transform="translate(186 124)">
        <Circle r={17} fill="#D4AF37" />
        <Path d="M-7 0 L-2 6 L8 -6" stroke="#0A2E24" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}
