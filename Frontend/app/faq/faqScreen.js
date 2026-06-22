import { StyleSheet, Text, View, FlatList } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const dummyAnswer =
  "Lorem ipsum dolor sit amet, consecte adipiscindf elitj. Eu scelerisque neque nevesti bulumaugued enullalkll quis mauris. solliciegesta pellentesqueg adipiscing. Leo aliquam, aliquam novalaoreethg";

const faqsList = [
  {
    id: "1",
    question: "How to find ride?",
    answer: dummyAnswer,
  },
  {
    id: "2",
    question: "How to find ride?",
    answer: dummyAnswer,
  },
  {
    id: "3",
    question: "How to add money in wallet?",
    answer: dummyAnswer,
  },
  {
    id: "4",
    question: "How to chat with rider?",
    answer: dummyAnswer,
  },
  {
    id: "5",
    question: "How to send money in bank?",
    answer: dummyAnswer,
  },
  {
    id: "6",
    question: "How to add my vehicle?",
    answer: dummyAnswer,
  },
];

const FaqScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"FAQs"} navigation={navigation} />
        {faqsInfo()}
      </View>
    </View>
  );

  function faqsInfo() {
    const renderItem = ({ item, index }) => (
      <View>
        <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
          <Text style={{ ...Fonts.blackColor16SemiBold }}>{item.question}</Text>
          <Text
            style={{
              ...Fonts.grayColor15Medium,
              marginTop: Sizes.fixPadding - 5.0,
            }}
          >
            {item.answer}
          </Text>
        </View>
        {index == faqsList.length - 1 ? null : (
          <View style={styles.divider}></View>
        )}
      </View>
    );
    return (
      <FlatList
        data={faqsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }
};

export default FaqScreen;

const styles = StyleSheet.create({
  divider: {
    backgroundColor: Colors.lightGrayColor,
    height: 1.0,
    marginVertical: Sizes.fixPadding * 1.5,
  },
});
