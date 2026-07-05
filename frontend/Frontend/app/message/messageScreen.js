import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState } from "react";
import {
  Colors,
  Sizes,
  CommonStyles,
  Fonts,
  screenWidth,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";

const MessageScreen = () => {

  const userMessages = [
    {
      id: "1",
      message: "Hello Jecob good morning",
      isSender: false,
      time: "9:15 PM",
    },
    {
      id: "2",
      message: "Hii, Good morning",
      isSender: true,
      time: "9:15 PM",
    },
    {
      id: "3",
      message: "Hello ,What time you reach my place",
      isSender: false,
      time: "9:20 PM",
    },
    {
      id: "4",
      message: "I will  be there around at 10:00am .please be ready",
      isSender: true,
      time: "9:20 PM",
    },
    {
      id: "5",
      message: "Okay. i will be there on time",
      isSender: false,
      time: "9:21 PM",
    },
  ];

  const navigation = useNavigation();

  const [messagesList, setMessagesList] = useState(userMessages);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "height" : null}
      style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}
    >
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        {header()}
        {messages()}
      </View>
      {typeMessage()}
    </KeyboardAvoidingView>
  );

  function header() {
    return (
      <View style={styles.header}>
        <MaterialIcons
          name="arrow-back-ios"
          color={Colors.whiteColor}
          size={24}
          onPress={() => { navigation.pop() }}
        />
        <View
          style={{
            ...CommonStyles.rowAlignCenter,
            flex: 1,
            marginLeft: Sizes.fixPadding - 5.0,
          }}
        >
          <Image
            source={require("../../assets/images/user/user2.png")}
            style={{ width: 40.0, height: 40.0, borderRadius: 20.0 }}
          />
          <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.whiteColor14SemiBold }}>
              Jenny Wilson
            </Text>
            <Text numberOfLines={1} style={{ ...Fonts.whiteColor12Medium }}>
              Ride on 25 june 2023
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function messages() {
    const renderItem = ({ item }) => {
      return (
        <View
          style={{
            ...(!item.isSender ? { flexDirection: "row" } : null),
            alignItems: item.isSender == true ? "flex-end" : "flex-start",
            marginHorizontal: Sizes.fixPadding * 2.0,
            marginVertical: Sizes.fixPadding + 2.5,
          }}
        >
          {item.isSender ? null : (
            <Image
              source={require("../../assets/images/user/user2.png")}
              style={styles.receiverImage}
            />
          )}
          <View
            style={{
              ...styles.messageWrapStyle,
              borderBottomRightRadius: item.isSender ? 0 : Sizes.fixPadding,
              borderTopLeftRadius: item.isSender ? Sizes.fixPadding : 0,
              backgroundColor: item.isSender
                ? Colors.lightSecondaryColor
                : Colors.whiteColor,
            }}
          >
            <Text style={{ ...Fonts.blackColor14Medium }}>{item.message}</Text>
            <Text
              style={{
                ...Fonts.grayColor12Medium,
                textAlign: "right",
                marginTop: Sizes.fixPadding - 5.0,
              }}
            >
              {item.time}
            </Text>
          </View>
        </View>
      );
    };
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          inverted
          data={messagesList}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "column-reverse",
            paddingBottom: Sizes.fixPadding * 2.0,
            paddingTop: Sizes.fixPadding * 2.0,
          }}
        />
      </View>
    );
  }

  function addMessage({ message }) {
    const oldMessages = messagesList;

    let date = Date();
    let hour = new Date(date).getHours();
    let minute = new Date(date).getMinutes();
    let AmPm = hour >= 12 ? "PM" : "AM";
    let finalhour = hour > 12 ? hour - 12 : hour;
    let displayHour =
      finalhour.toString().length == 1 ? `0${finalhour}` : finalhour;
    let displayMinute = minute.toString().length == 1 ? `0${minute}` : minute;

    const newMessage = {
      id: messagesList.length + 1,
      message: message,
      time: `${displayHour}:${displayMinute} ${AmPm}`,
      isSender: true,
    };

    oldMessages.push(newMessage);
    setMessagesList(oldMessages);
  }

  function typeMessage() {
    const [message, setMessage] = useState("");
    return (
      <View style={styles.typeMessageWrapStyle}>
        <TextInput
          cursorColor={Colors.primaryColor}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message here..."
          style={styles.messageFiedlStyle}
          placeholderTextColor={Colors.grayColor}
          selectionColor={Colors.primaryColor}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (message != "") {
              addMessage({ message: message });
              setMessage("");
            }
          }}
          style={styles.sendIconWrapper}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={Colors.whiteColor}
            style={{ marginLeft: Sizes.fixPadding - 5.0 }}
          />
        </TouchableOpacity>
      </View>
    );
  }
};

export default MessageScreen;

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.rowAlignCenter,
  },
  addCommentBox: {
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.shadow,
    ...CommonStyles.rowAlignCenter,
    paddingVertical: Sizes.fixPadding,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    borderColor: '#ececec'
  },
  sendIconWrapper: {
    backgroundColor: Colors.secondaryColor,
    width: 50.0,
    height: 50.0,
    borderRadius: Sizes.fixPadding - 5.0,
    alignItems: "center",
    justifyContent: "center",
  },
  typeMessageWrapStyle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Sizes.fixPadding,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  messageFiedlStyle: {
    flex: 1,
    ...Fonts.blackColor14Medium,
    marginRight: Sizes.fixPadding,
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding + 2.0,
    height: 50.0,
    borderColor: Colors.secondaryColor,
    borderWidth: 1.0,
    borderRadius: Sizes.fixPadding,
  },
  messageWrapStyle: {
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding,
    maxWidth: screenWidth - 150.0,
  },
  receiverImage: {
    width: 30.0,
    height: 30.0,
    borderRadius: 15.0,
    marginRight: Sizes.fixPadding - 3.0,
  },
});
