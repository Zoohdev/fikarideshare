import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

const VerificationCodeCard = ({
  code = "",
}) => {
  const digits = code
    .toString()
    .split("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Verification Code
      </Text>

      <View style={styles.row}>
        {digits.map(
          (digit, index) => (
            <View
              key={index}
              style={styles.box}
            >
              <Text
                style={styles.digit}
              >
                {digit}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
};

export default VerificationCodeCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 16,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,

    elevation: 5,
  },

  title: {
    fontWeight: "700",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  box: {
    width: 55,
    height: 55,

    borderWidth: 1,
    borderColor: "#E5E5E5",

    borderRadius: 12,

    justifyContent: "center",
    alignItems: "center",
  },

  digit: {
    fontSize: 22,
    fontWeight: "700",
  },
});