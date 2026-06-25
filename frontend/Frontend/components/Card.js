import { View } from "react-native";
import React from "react";
import { CommonStyles } from "../constants/styles";

/** Flat bordered surface for grouping content - see CommonStyles.card. */
const Card = ({ style, children }) => {
  return <View style={[CommonStyles.card, style]}>{children}</View>;
};

export default Card;
