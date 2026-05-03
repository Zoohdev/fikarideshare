import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const paymentMethodsList = [
  {
    id: "1",
    paymentIcon: require("../../assets/images/payment/credit_card.png"),
    paymentType: "Credit card",
  },
  {
    id: "2",
    paymentIcon: require("../../assets/images/payment/paypal.png"),
    paymentType: "Paypal",
  },
  {
    id: "3",
    paymentIcon: require("../../assets/images/payment/google_pay.png"),
    paymentType: "Google pay",
  },
  {
    id: "4",
    paymentIcon: require("../../assets/images/payment/visa.png"),
    paymentType: "Visa card",
  },
];

const PaymentMethodsScreen = () => {

  const navigation = useNavigation();

  const [selectedMethodIndex, setselectedMethodIndex] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Payment method"} navigation={navigation} />
        {paymentMethods()}
      </View>
      {addAmountButton()}
    </View>
  );

  function addAmountButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { navigation.push("creditCard/creditCardScreen") }}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 2.0,
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Add amount ($50.00)</Text>
      </TouchableOpacity>
    );
  }

  function paymentMethods() {
    const renderItem = ({ item, index }) => (
      <View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setselectedMethodIndex(index)}
          style={{
            ...CommonStyles.rowAlignCenter,
            marginHorizontal: Sizes.fixPadding * 2.0,
          }}
        >
          <Image
            source={item.paymentIcon}
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
            {item.paymentType}
          </Text>
          <View
            style={{
              ...styles.radioButton,
              borderColor:
                selectedMethodIndex == index
                  ? Colors.secondaryColor
                  : "#F9F8F8",
              borderWidth: selectedMethodIndex == index ? 7.0 : 0,
            }}
          ></View>
        </TouchableOpacity>
        {index == paymentMethodsList.length - 1 ? null : (
          <View
            style={{
              backgroundColor: Colors.lightGrayColor,
              height: 1.0,
              marginVertical: Sizes.fixPadding * 1.5,
            }}
          />
        )}
      </View>
    );
    return (
      <FlatList
        data={paymentMethodsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
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
});
