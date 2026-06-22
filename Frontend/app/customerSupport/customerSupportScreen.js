import {
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  TextInput,
  Platform,
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
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "expo-router";

const CustomerSupportScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Customer support"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {constactInfo()}
          {callAndMailButton()}
          {nameInfo()}
          {emailInfo()}
          {messageInfo()}
        </ScrollView>
      </View>
      {submitButton()}
    </View>
  );

  function submitButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { navigation.pop() }}
        style={{ ...CommonStyles.button, margin: Sizes.fixPadding * 2.0 }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Submit</Text>
      </TouchableOpacity>
    );
  }

  function messageInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Message
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Write your message"
            style={{
              ...Fonts.blackColor15Medium,
              padding: 0,
              height: 100.0,
            }}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            multiline={true}
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }

  function emailInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Email address
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter your email address"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            keyboardType="email-address"
          />
        </View>
      </View>
    );
  }

  function nameInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Name
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter your name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
          />
        </View>
      </View>
    );
  }

  function callAndMailButton() {
    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: Sizes.fixPadding,
          marginHorizontal: Sizes.fixPadding,
        }}
      >
        <View style={styles.callAndMailButtonStyle}>
          <Ionicons name="call-outline" color={Colors.primaryColor} size={20} />
          <Text
            numberOfLines={1}
            style={{
              marginLeft: Sizes.fixPadding,
              ...Fonts.primaryColor16SemiBold,
            }}
          >
            Call us
          </Text>
        </View>
        <View style={styles.callAndMailButtonStyle}>
          <Ionicons name="mail-outline" color={Colors.primaryColor} size={20} />
          <Text
            numberOfLines={1}
            style={{
              marginLeft: Sizes.fixPadding,
              ...Fonts.primaryColor16SemiBold,
            }}
          >
            Mail us
          </Text>
        </View>
      </View>
    );
  }

  function constactInfo() {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          margin: Sizes.fixPadding * 3.0,
        }}
      >
        <Image
          source={require("../../assets/images/customer_support.png")}
          style={{
            width: screenWidth / 4.5,
            height: screenWidth / 4.5,
            resizeMode: "contain",
          }}
        />
        <Text
          style={{
            ...Fonts.blackColor18SemiBold,
            marginTop: Sizes.fixPadding * 2.0,
          }}
        >
          Get in touch
        </Text>
      </View>
    );
  }
};

export default CustomerSupportScreen;

const styles = StyleSheet.create({
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
  },
  callAndMailButtonStyle: {
    flex: 1,
    ...CommonStyles.shadow,
    ...CommonStyles.rowAlignCenter,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding + 5.0,
    justifyContent: "center",
    marginHorizontal: Sizes.fixPadding,
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    height: 20.0,
    padding: 0,
  },
});
