import { ScrollView, StyleSheet, Text, View, Image,TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import {
  Colors,
  Sizes,
  Fonts,
  screenWidth,
  CommonStyles,
} from "../../../constants/styles";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import api from "../../../services/api";
import Card from "../../../components/Card";

const WalletScreen = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [balance, setBalance] = useState(null);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (!isFocused) return;
    api.get("/payments/wallet/")
      .then((response) => {
        setBalance(response.data?.balance);
        setCurrency(response.data?.currency || "USD");
      })
      .catch((error) => console.error("Error fetching wallet balance:", error));
  }, [isFocused]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        {header()}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Sizes.fixPadding }}
        >
          {walletImage()}
          {balanceInfo()}
        </ScrollView>
      </View>
    </View>
  );

  function balanceInfo() {
    return (
      <Card style={styles.balanceInfoWrapper}>
        <View style={{ alignItems: "center", margin: Sizes.fixPadding * 4.0 }}>
          <Text style={{ ...Fonts.blackColor40Bold }}>
            {balance !== null ? `${Number(balance).toFixed(2)} ${currency}` : "..."}
          </Text>
          <Text style={{ ...Fonts.grayColor18Medium }}>Available balance</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { navigation.push("transactions/transactionsScreen") }}
          style={styles.optionWrapper}
        >
          <View style={styles.circle40}>
            <MaterialCommunityIcons
              name="swap-vertical"
              color={Colors.secondaryColor}
              size={22}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
              Transaction
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14Medium,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              View all transaction list
            </Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            color={Colors.blackColor}
            size={24}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { navigation.push("addAndSendMoney/addAndSendMoneyScreen", { addFor: "money" }) }}
          style={{
            ...styles.optionWrapper,
            marginVertical: Sizes.fixPadding * 2.0,
          }}
        >
          <View style={styles.circle40}>
            <MaterialCommunityIcons
              name="wallet-plus-outline"
              color={Colors.secondaryColor}
              size={20}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
              Add money
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14Medium,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              You can easily add money
            </Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            color={Colors.blackColor}
            size={24}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { navigation.push("addAndSendMoney/addAndSendMoneyScreen", { addFor: "bank" }) }}
          style={{ ...styles.optionWrapper }}
        >
          <View style={styles.circle40}>
            <MaterialCommunityIcons
              name="credit-card-plus-outline"
              color={Colors.secondaryColor}
              size={22}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
              Send to bank
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14Medium,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              Easily send money in bank
            </Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            color={Colors.blackColor}
            size={24}
          />
        </TouchableOpacity>
      </Card>
    );
  }

  function walletImage() {
    return (
      <Image
        source={require("../../../assets/images/wallet.png")}
        style={styles.walletImageStyle}
      />
    );
  }

  function header() {
    return (
      <View style={styles.header}>
        <Text style={{ ...Fonts.whiteColor20SemiBold }}>Wallet</Text>
      </View>
    );
  }
};

export default WalletScreen;

const styles = StyleSheet.create({
  balanceInfoWrapper: {
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  header: {
    backgroundColor: Colors.primaryColor,
    padding: Sizes.fixPadding * 2.0,
    alignItems: "center",
    justifyContent: "center",
  },
  walletImageStyle: {
    width: screenWidth / 2.0,
    height: screenWidth / 2.0,
    resizeMode: "contain",
    alignSelf: "center",
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginTop: Sizes.fixPadding * 2.0,
  },
  circle40: {
    width: 40.0,
    height: 40.0,
    borderRadius: 20.0,
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.shadow,
    alignItems: "center",
    justifyContent: "center",
  },
  optionWrapper: {
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
    ...CommonStyles.rowAlignCenter,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
  },
});
