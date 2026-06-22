import {
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React from "react";
import {
  Colors,
  screenWidth,
  Fonts,
  Sizes,
  CommonStyles,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useLocalSearchParams, useNavigation } from "expo-router";

const AddAndSendMoneyScreen = () => {

  const navigation = useNavigation();

  const { addFor } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header
          title={addFor == "money" ? "Add money" : "Send to bank"}
          navigation={navigation}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {walletImage()}
          {amountInfo()}
          {continueButton()}
        </ScrollView>
      </View>
    </View>
  );

  function continueButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          addFor == "money"
            ? navigation.push("paymentMethods/paymentMethodsScreen")
            : navigation.push("bankInfo/bankInfoScreen");
        }}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 2.0,
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Continue</Text>
      </TouchableOpacity>
    );
  }

  function amountInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          {addFor == "money"
            ? "Add amount"
            : "Add amount to send"}
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter amount to add"
            style={{
              ...Fonts.blackColor15Medium,
              height: 20.0,
              padding: 0,
            }}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  }

  function walletImage() {
    return (
      <Image
        source={require("../../assets/images/wallet.png")}
        style={styles.walletImageStyle}
      />
    );
  }
};

export default AddAndSendMoneyScreen;

const styles = StyleSheet.create({
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
  },
  walletImageStyle: {
    width: screenWidth / 2.0,
    height: screenWidth / 2.0,
    resizeMode: "contain",
    alignSelf: "center",
    margin: Sizes.fixPadding * 2.0,
  },
});
