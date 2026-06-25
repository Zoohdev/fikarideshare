import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const termsAndConditions = [
  "Experience a new way to travel with our reliable ride-sharing platform. Whether you need a quick trip across town or a scheduled ride to the airport, we connect you with nearby drivers at a moment's notice. Our focus is on providing safe, affordable, and convenient transportation options that fit seamlessly into your daily routine. With real-time tracking and easy payment, getting from point A to point B has never been simpler.",
  "Join a community of millions who have chosen our service for their daily commute and special nights out. By sharing rides, we help reduce traffic congestion and lower carbon emissions, contributing to a greener planet. Our drivers are verified and dedicated to making your journey comfortable and stress-free. With competitive pricing and no surge surprises, you can always count on a fair fare when you ride with us.",
  "Your safety is our priority, which is why every ride is equipped with features like ride tracking, driver identification, and 24/7 customer support. Whether you're heading to work or returning home late at night, you can share your trip details with loved ones for added peace of mind. We are committed to setting the standard for urban mobility by combining technology with a human touch. Download the app today and see where we can take you.",
  "Experience a new way to travel with our reliable ride-sharing platform. Whether you need a quick trip across town or a scheduled ride to the airport, we connect you with nearby drivers at a moment's notice. Our focus is on providing safe, affordable, and convenient transportation options that fit seamlessly into your daily routine. With real-time tracking and easy payment, getting from point A to point B has never been simpler.",
  "Join a community of millions who have chosen our service for their daily commute and special nights out. By sharing rides, we help reduce traffic congestion and lower carbon emissions, contributing to a greener planet. Our drivers are verified and dedicated to making your journey comfortable and stress-free. With competitive pricing and no surge surprises, you can always count on a fair fare when you ride with us.",
  "Your safety is our priority, which is why every ride is equipped with features like ride tracking, driver identification, and 24/7 customer support. Whether you're heading to work or returning home late at night, you can share your trip details with loved ones for added peace of mind. We are committed to setting the standard for urban mobility by combining technology with a human touch. Download the app today and see where we can take you."
];

const TermsAndConditionsScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Terms and condition"} navigation={navigation} />
        {termsAndConditionsInfo()}
      </View>
    </View>
  );

  function termsAndConditionsInfo() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding + 5.0 }}
      >
        {termsAndConditions.map((item, index) => (
          <Text key={`${index}`} style={styles.termsAndConditionTextStyle}>
            {item}
          </Text>
        ))}
      </ScrollView>
    );
  }
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create({
  termsAndConditionTextStyle: {
    ...Fonts.grayColor14Medium,
    marginVertical: Sizes.fixPadding - 5.0,
    marginHorizontal: Sizes.fixPadding * 2.0,
  },
});
