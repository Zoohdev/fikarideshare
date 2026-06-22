import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const BankInfoScreen = () => {

  const navigation = useNavigation();

  const [bankName, setbankName] = useState("");
  const [branchCode, setbranchCode] = useState("");
  const [accountNo, setaccountNo] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Bank information"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {accountHolderInfo()}
          {bankNameInfo()}
          {branchCodeInfo()}
          {accountNumberInfo()}
        </ScrollView>
      </View>
      {sendToButton()}
    </View>
  );

  function sendToButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.push("successfullyAddAndSend/successfullyAddAndSendScreen", { successFor: "bank" });
        }}
        style={{ ...CommonStyles.button, margin: Sizes.fixPadding * 2.0 }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Send to bank (100.00)</Text>
      </TouchableOpacity>
    );
  }

  function accountNumberInfo() {
    return (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginBottom: Sizes.fixPadding * 2.0,
        }}
      >
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Account number
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter account number"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            keyboardType="numeric"
            value={accountNo}
            onChangeText={(value) => setaccountNo(value)}
          />
        </View>
      </View>
    );
  }

  function branchCodeInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Branch code
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter branch code"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={branchCode}
            onChangeText={(value) => setbranchCode(value)}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  }

  function bankNameInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Bank name
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter bank name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={bankName}
            onChangeText={(value) => setbankName(value)}
          />
        </View>
      </View>
    );
  }

  function accountHolderInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Account holder name
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter account holder name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
          />
        </View>
      </View>
    );
  }
};

export default BankInfoScreen;

const styles = StyleSheet.create({
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    height: 20.0,
    padding: 0,
  },
});
