import {
  ScrollView,
  Text,
  Image,
  View,
  Linking,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import {
  Colors,
  screenWidth,
  Fonts,
  Sizes,
  CommonStyles,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "expo-router";
import api from "../../services/api";

const SUPPORT_PHONE = "+27800000000";
const SUPPORT_EMAIL = "support@fika.app";

const CustomerSupportScreen = () => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing details", "Please fill in a subject and your message.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/support/tickets/", { subject, message });
      Alert.alert("Sent", "Your message has been sent to our support team.", [
        { text: "OK", onPress: () => navigation.pop() },
      ]);
    } catch (error) {
      Alert.alert("Couldn't send", error.response?.data?.error || "Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Customer support"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {contactInfo()}
          {callAndMailButton()}

          <View style={{ margin: Sizes.fixPadding * 2.0 }}>
            <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>
              Subject
            </Text>
            <TextField placeholder="What's this about?" value={subject} onChangeText={setSubject} />
          </View>

          <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
            <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>
              Message
            </Text>
            <TextField
              placeholder="Write your message"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              containerStyle={{ minHeight: 120 }}
            />
          </View>
        </ScrollView>
      </View>
      <Button
        title="Submit"
        onPress={handleSubmit}
        loading={submitting}
        style={{ margin: Sizes.fixPadding * 2.0 }}
      />
    </View>
  );

  function callAndMailButton() {
    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: Sizes.fixPadding,
          marginHorizontal: Sizes.fixPadding,
        }}
      >
        <TouchableOpacity
          style={styles.callAndMailButtonStyle}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
        >
          <Ionicons name="call-outline" color={Colors.primaryColor} size={20} />
          <Text numberOfLines={1} style={{ marginLeft: Sizes.fixPadding, ...Fonts.primaryColor16SemiBold }}>
            Call us
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callAndMailButtonStyle}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        >
          <Ionicons name="mail-outline" color={Colors.primaryColor} size={20} />
          <Text numberOfLines={1} style={{ marginLeft: Sizes.fixPadding, ...Fonts.primaryColor16SemiBold }}>
            Mail us
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function contactInfo() {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", margin: Sizes.fixPadding * 3.0 }}>
        <Image
          source={require("../../assets/images/customer_support.png")}
          style={{ width: screenWidth / 4.5, height: screenWidth / 4.5, resizeMode: "contain" }}
        />
        <Text style={{ ...Fonts.blackColor18SemiBold, marginTop: Sizes.fixPadding * 2.0 }}>
          Get in touch
        </Text>
      </View>
    );
  }
};

export default CustomerSupportScreen;

const styles = {
  callAndMailButtonStyle: {
    flex: 1,
    ...CommonStyles.card,
    ...CommonStyles.rowAlignCenter,
    padding: Sizes.fixPadding + 5.0,
    justifyContent: "center",
    marginHorizontal: Sizes.fixPadding,
  },
};
