import { Text, View, FlatList, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import { useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import api from "../../services/api";

const SOURCE_LABELS = {
  topup: "Wallet top-up",
  ride_payment: "Ride payment",
  refund: "Refund",
  promotion: "Promotion",
  referral: "Referral bonus",
};

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [transactions, setTransactions] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    api
      .get("/payments/wallet/")
      .then((response) => {
        setTransactions(response.data?.transactions || []);
        setCurrency(response.data?.currency || "USD");
      })
      .catch((error) => console.error("Error fetching transactions:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFocused) fetchTransactions();
  }, [isFocused, fetchTransactions]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Transactions"} navigation={navigation} />
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ ...Fonts.grayColor16SemiBold }}>No transactions yet</Text>
          </View>
        ) : (
          transactionInfo()
        )}
      </View>
    </View>
  );

  function transactionInfo() {
    const renderItem = ({ item, index }) => {
      const isIncome = item.transaction_type === "credit" || item.transaction_type === "release";
      return (
        <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ ...Fonts.blackColor15SemiBold }}>
                {item.description || SOURCE_LABELS[item.source] || item.source}
              </Text>
              <Text
                numberOfLines={1}
                style={{ ...Fonts.grayColor13SemiBold, marginTop: Sizes.fixPadding - 7.0 }}
              >
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={isIncome ? { ...Fonts.greenColor16SemiBold } : { ...Fonts.redColor16SemiBold }}>
              {isIncome ? "+" : "-"}
              {currency} {Number(item.amount).toFixed(2)}
            </Text>
          </View>
          {index === transactions.length - 1 ? null : (
            <View
              style={{
                backgroundColor: Colors.borderColor,
                height: 1.0,
                marginVertical: Sizes.fixPadding * 2.0,
              }}
            />
          )}
        </View>
      );
    };
    return (
      <FlatList
        data={transactions}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
      />
    );
  }
};

export default TransactionsScreen;
