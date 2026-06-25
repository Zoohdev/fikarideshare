import { View, Text, ActivityIndicator, Alert, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Colors, Fonts, Sizes, screenWidth } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import api from "../../services/api";

/**
 * Stripe Connect Express collects banking details on Stripe's own hosted
 * page - this screen only triggers onboarding and shows status, it never
 * collects raw account numbers itself (same reason card numbers go
 * through Stripe's CardField rather than a custom form).
 */
const BankInfoScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { amount } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    api
      .get("/payments/connect/status/")
      .then((response) => {
        setOnboarded(!!response.data?.onboarded);
        setPayoutsEnabled(!!response.data?.payouts_enabled);
      })
      .catch((error) => console.error("Error fetching payout status:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFocused) fetchStatus();
  }, [isFocused, fetchStatus]);

  const handleSetUpPayouts = async () => {
    setSubmitting(true);
    try {
      const response = await api.post("/payments/connect/onboard/");
      const onboardingUrl = response.data?.onboarding_url;
      if (!onboardingUrl) throw new Error("No onboarding link returned.");

      await WebBrowser.openAuthSessionAsync(onboardingUrl, "rideshare://connect-complete");
      fetchStatus();
    } catch (error) {
      Alert.alert("Couldn't start setup", error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Enter an amount", "Please go back and enter how much to withdraw.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/payments/payouts/", { amount });
      navigation.push("successfullyAddAndSend/successfullyAddAndSendScreen", { successFor: "bank", amount });
    } catch (error) {
      Alert.alert("Payout failed", error.response?.data?.error || "Could not send funds to your bank.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Payouts"} navigation={navigation} />
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : (
          <View style={{ margin: Sizes.fixPadding * 2.0 }}>
            <Image
              source={require("../../assets/images/wallet.png")}
              style={{
                width: screenWidth / 2.5,
                height: screenWidth / 2.5,
                resizeMode: "contain",
                alignSelf: "center",
                marginBottom: Sizes.fixPadding * 2.0,
              }}
            />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ ...Fonts.blackColor16SemiBold }}>Bank payouts</Text>
                <StatusBadge
                  status={payoutsEnabled ? "verified" : onboarded ? "pending" : "rejected"}
                  label={payoutsEnabled ? "Active" : onboarded ? "Pending review" : "Not set up"}
                />
              </View>
              <Text style={{ ...Fonts.grayColor14Medium, marginTop: Sizes.fixPadding }}>
                {payoutsEnabled
                  ? "Your bank account is verified with Stripe. Withdrawals are sent directly to it."
                  : "Set up payouts through Stripe's secure onboarding - we never see or store your bank details."}
              </Text>
            </Card>

            <View style={{ marginTop: Sizes.fixPadding * 3.0 }}>
              {payoutsEnabled ? (
                <Button
                  title={submitting ? "Processing..." : `Withdraw${amount ? ` ($${Number(amount).toFixed(2)})` : ""}`}
                  onPress={handleWithdraw}
                  loading={submitting}
                />
              ) : (
                <Button
                  title={submitting ? "Opening Stripe..." : onboarded ? "Finish payout setup" : "Set up payouts"}
                  onPress={handleSetUpPayouts}
                  loading={submitting}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default BankInfoScreen;
