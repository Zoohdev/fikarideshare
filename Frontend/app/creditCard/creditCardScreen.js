import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import api from "../../services/api";

const CreditCardScreen = () => {

  const navigation = useNavigation();
  const { amount } = useLocalSearchParams();
  const { createPaymentMethod } = useStripe();

  const [cardComplete, setCardComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveCard = async () => {
    if (!cardComplete) {
      Alert.alert("Incomplete card", "Please fill in all card details.");
      return;
    }

    setSubmitting(true);
    try {
      // Stripe's CardField collects card details directly in its own native
      // UI - the app never sees the raw card number/CVV, only the resulting
      // payment method id and (non-sensitive) brand/last4/expiry.
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: "Card",
      });

      if (error) {
        Alert.alert("Card error", error.message);
        return;
      }

      await api.post("/payments/methods/", {
        method_type: "card",
        provider_payment_method_id: paymentMethod.id,
      });

      if (amount) {
        // Came from the wallet top-up flow - go back so the user can
        // confirm the amount against the card they just saved.
        navigation.goBack();
      } else {
        navigation.push("successfullyAddAndSend/successfullyAddAndSendScreen", { successFor: "money" });
      }
    } catch (err) {
      console.error("Error saving card:", err);
      Alert.alert("Error", err.response?.data?.error || "Could not save this card.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Add card"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
        >
          <View style={{ margin: Sizes.fixPadding * 2.0 }}>
            <Text style={{ ...Fonts.grayColor16Medium, marginBottom: Sizes.fixPadding }}>
              Card details
            </Text>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: "4242 4242 4242 4242" }}
              cardStyle={styles.cardField}
              style={styles.cardFieldContainer}
              onCardChange={(details) => setCardComplete(details.complete)}
            />
          </View>
        </ScrollView>
      </View>
      {continueButton()}
    </View>
  );

  function continueButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSaveCard}
        disabled={submitting}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 2.0,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.whiteColor} />
        ) : (
          <Text style={{ ...Fonts.whiteColor18Bold }}>Save card</Text>
        )}
      </TouchableOpacity>
    );
  }
};

export default CreditCardScreen;

const styles = StyleSheet.create({
  cardFieldContainer: {
    width: "100%",
    height: 50,
  },
  cardField: {
    backgroundColor: Colors.whiteColor,
    textColor: Colors.blackColor,
    borderRadius: 8,
  },
});
