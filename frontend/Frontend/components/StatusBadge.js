import { View, Text } from "react-native";
import React from "react";
import { Colors, Sizes } from "../constants/styles";

const TONE_COLORS = {
  success: { bg: "#E7F6EC", text: Colors.greenColor },
  warning: { bg: Colors.lightSecondaryColor, text: Colors.secondaryColor },
  error: { bg: "#FBE9E7", text: Colors.redColor },
  neutral: { bg: Colors.bodyBackColor, text: Colors.mutedTextColor },
};

// Known backend status values mapped to a tone, so callers can just pass
// the raw status string (ride/payment/KYC/payout) without picking a tone.
const STATUS_TONE = {
  completed: "success",
  verified: "success",
  accepted: "success",
  paid: "success",
  active: "success",
  pending: "warning",
  in_progress: "warning",
  authorized: "warning",
  processing: "warning",
  requires_action: "warning",
  failed: "error",
  rejected: "error",
  cancelled: "error",
  declined: "error",
};

/** Pill label for ride / payment / KYC / payout status strings. */
const StatusBadge = ({ status, label, tone }) => {
  const resolvedTone = tone || STATUS_TONE[String(status).toLowerCase()] || "neutral";
  const { bg, text } = TONE_COLORS[resolvedTone];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderRadius: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding,
        paddingVertical: Sizes.fixPadding * 0.4,
      }}
    >
      <Text style={{ color: text, fontSize: 12.0, fontFamily: "Montserrat_SemiBold" }}>
        {label || String(status).replace(/_/g, " ")}
      </Text>
    </View>
  );
};

export default StatusBadge;
