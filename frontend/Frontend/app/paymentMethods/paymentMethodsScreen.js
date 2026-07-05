import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";
import api from "../../services/api";

const PaymentMethodsScreen = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { amount } = useLocalSearchParams();

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchMethods = useCallback(() => {
    setLoading(true);
    api.get("/payments/methods/")
      .then((response) => {
        const list = response.data || [];
        setMethods(list);
        const defaultMethod = list.find((m) => m.is_default) || list[0];
        setSelectedId(defaultMethod?.id ?? null);
      })
      .catch((error) => console.error("Error fetching payment methods:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchMethods();
    }
  }, [isFocused, fetchMethods]);

  const handleAddAmount = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Enter an amount", "Please go back and enter how much to add.");
      return;
    }
    if (!selectedId) {
      Alert.alert("No payment method", "Add a card first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/payments/wallet/topup/", { amount });

      if (response.status === 202) {
        Alert.alert("Authentication required", "Additional verification is needed for this card - please try a different one.");
        return;
      }

      navigation.push("successfullyAddAndSend/successfullyAddAndSendScreen", { successFor: "money", amount });
    } catch (error) {
      console.error("Error topping up wallet:", error);
      Alert.alert("Payment failed", error.response?.data?.error || "Could not complete the payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Payment method"} navigation={navigation} />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : (
          paymentMethods()
        )}
      </View>
      {addAmountButton()}
    </View>
  );

  function addAmountButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAddAmount}
        disabled={submitting}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 2.0,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>
          {submitting
            ? "Processing..."
            : `Add amount${amount ? ` ($${Number(amount).toFixed(2)})` : ""}`}
        </Text>
      </TouchableOpacity>
    );
  }

  function addNewCardRow() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.push("creditCard/creditCardScreen", { amount })}
        style={{
          ...CommonStyles.rowAlignCenter,
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginBottom: Sizes.fixPadding,
        }}
      >
        <Image
          source={require("../../assets/images/payment/credit_card.png")}
          style={{ width: 30.0, height: 40.0, resizeMode: "contain" }}
        />
        <Text
          numberOfLines={1}
          style={{
            ...Fonts.primaryColor16SemiBold,
            flex: 1,
            marginHorizontal: Sizes.fixPadding + 5.0,
          }}
        >
          Add new card
        </Text>
      </TouchableOpacity>
    );
  }

  function paymentMethods() {
    if (methods.length === 0) {
      return (
        <View>
          <View style={styles.center}>
            <Text style={{ ...Fonts.grayColor16SemiBold }}>No saved cards yet</Text>
          </View>
          {addNewCardRow()}
        </View>
      );
    }

    const renderItem = ({ item, index }) => (
      <View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedId(item.id)}
          style={{
            ...CommonStyles.rowAlignCenter,
            marginHorizontal: Sizes.fixPadding * 2.0,
          }}
        >
          <Image
            source={require("../../assets/images/payment/credit_card.png")}
            style={{ width: 30.0, height: 40.0, resizeMode: "contain" }}
          />
          <Text
            numberOfLines={1}
            style={{
              ...Fonts.blackColor16Medium,
              flex: 1,
              marginHorizontal: Sizes.fixPadding + 5.0,
            }}
          >
            {item.display_name}
          </Text>
          <View
            style={{
              ...styles.radioButton,
              borderColor:
                selectedId === item.id
                  ? Colors.secondaryColor
                  : "#F9F8F8",
              borderWidth: selectedId === item.id ? 7.0 : 0,
            }}
          ></View>
        </TouchableOpacity>
        <View
          style={{
            backgroundColor: Colors.lightGrayColor,
            height: 1.0,
            marginVertical: Sizes.fixPadding * 1.5,
          }}
        />
      </View>
    );
    return (
      <FlatList
        data={methods}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
        ListFooterComponent={addNewCardRow()}
      />
    );
  }
};

export default PaymentMethodsScreen;

const styles = StyleSheet.create({
  radioButton: {
    backgroundColor: "#F9F8F8",
    width: 20.0,
    height: 20.0,
    borderRadius: 10.0,
    ...CommonStyles.shadow,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Sizes.fixPadding * 4.0,
  },
});
