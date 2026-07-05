import { Text, View, FlatList } from "react-native";
import React from "react";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import { useNavigation } from "expo-router";

const transactionsList = [
  {
    id: "1",
    title: "Paid to rider",
    date: "25 jan 2023",
    amount: "$24.00",
    isIncome: false,
  },
  {
    id: "2",
    title: "Add to wallet",
    date: "25 jan 2023",
    amount: "$30.00",
    isIncome: true,
  },
  {
    id: "3",
    title: "Receive from ride taker",
    date: "25 jan 2023",
    amount: "$10.00",
    isIncome: true,
  },
  {
    id: "4",
    title: "Paid to rider",
    date: "25 jan 2023",
    amount: "$15.00",
    isIncome: false,
  },
  {
    id: "5",
    title: "Add ro wallet",
    date: "25 jan 2023",
    amount: "$30.00",
    isIncome: true,
  },
  {
    id: "6",
    title: "Paid to rider",
    date: "25 jan 2023",
    amount: "$10.00",
    isIncome: false,
  },
  {
    id: "7",
    title: "Receive from ride taker",
    date: "25 jan 2023",
    amount: "$150.00",
    isIncome: true,
  },
  {
    id: "8",
    title: "Receive from ride taker",
    date: "25 jan 2023",
    amount: "$20.00",
    isIncome: true,
  },
  {
    id: "9",
    title: "Paid to rider",
    date: "25 jan 2023",
    amount: "$25.00",
    isIncome: false,
  },
  {
    id: "10",
    title: "Receive from ride taker",
    date: "25 jan 2023",
    amount: "$24.00",
    isIncome: true,
  },
  {
    id: "11",
    title: "Paid to rider",
    date: "25 jan 2023",
    amount: "$24.00",
    isIncome: false,
  },
  {
    id: "12",
    title: "Receive from ride taker",
    date: "25 jan 2023",
    amount: "$24.00",
    isIncome: true,
  },
];

const TransactionsScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Transaction"} navigation={navigation} />
        {transactionInfo()}
      </View>
    </View>
  );

  function transactionInfo() {
    const renderItem = ({ item, index }) => (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <View style={{ ...CommonStyles.rowAlignCenter }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor15SemiBold }}>
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor13SemiBold,
                marginTop: Sizes.fixPadding - 7.0,
              }}
            >
              Jenny wilsom | {item.date}
            </Text>
          </View>
          <Text
            style={
              item.isIncome
                ? { ...Fonts.greenColor16SemiBold }
                : { ...Fonts.redColor16SemiBold }
            }
          >
            {item.amount}
          </Text>
        </View>
        {index == transactionsList.length - 1 ? null : (
          <View
            style={{
              backgroundColor: Colors.grayColor,
              height: 1.0,
              marginVertical: Sizes.fixPadding * 2.0,
            }}
          />
        )}
      </View>
    );
    return (
      <FlatList
        data={transactionsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
      />
    );
  }
};

export default TransactionsScreen;
