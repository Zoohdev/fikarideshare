import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const privacyPolicySections = [
  {
    heading: "A. Scope",
    body: "This notice applies when you use FIKA’s apps or websites to provide transportation, delivery, or other products or services.\n\nThis notice describes how we collect and use your data if you provide, or apply to provide, products or services through FIKA’s apps or websites.\n\nThis notice specifically applies if you:\n• Provide, or start or complete an application to provide, transportation to riders via their FIKA account or through partner transportation companies (a “Driver”).\n• Provide, or start or complete an application to provide, shopping or delivery services via the FIKA app (a “Delivery Person”).\n• Are an owner or employee of restaurants or merchants on the FIKA platform (a “Merchant”).\n\nThis notice also governs FIKA’s collection and use of account data from administrators of FIKA for Business customers (“Enterprise Business Customers”).\n\nThis notice does not apply to individuals who use FIKA to request and receive (instead of providing) services, such as riders or order recipients. A separate privacy notice for riders and recipients applies to them. Those who use FIKA to either request, receive, or provide services are collectively referred to as “users” in this notice.\n\nOur privacy practices are subject to applicable laws in South Africa, including the Protection of Personal Information Act, 2013 (POPIA). Therefore, if you travel across national borders, FIKA’s data processing practices described in this notice may differ from those within South Africa.",
  },
  {
    heading: "II.A. The Data We Collect — Data You Provide",
    body: "FIKA collects data that you provide, when you use our services, and from other sources. This includes information you provide when creating or using your account.\n\na. Account Information: address, banking information, email address, first and last name, login name and password, phone number, profile picture, tax ID/SSN (for payments and background checks).\n\nb. Background Check Information: criminal record (where permitted by law), driver history, license status, right to work.\n\nc. Demographic Data: date of birth/age (for eligibility verification), gender (e.g., for safety features like Women Rider Preference).\n\nd. Identity Verification Information: government-issued ID (driver’s license, passport), user-submitted selfies.\n\ne. User Content: customer support communications, ratings or feedback, photos or recordings uploaded for support or delivery confirmation.",
  },
  {
    heading: "II.A. The Data We Collect — Data Collected When You Use Our Services",
    body: "This includes information generated during your use of the FIKA app.\n\na. Location Data: precise and approximate location data (when the app is open).\n\nb. Trip/Delivery Information: date, time, distance, and route; earnings and fare details; pickup and drop-off addresses; statistics (e.g., acceptance rates, cancellation rates).\n\nc. Usage Data: app features used, browser type, crash reports, access times.\n\nd. Device Data: hardware model, IP address, operating system, mobile network information.\n\ne. Communications Data: call and message logs (with notification of recording).\n\nf. Biometric Data: facial verification data (to prevent fraud and verify identity).",
  },
  {
    heading: "II.A. The Data We Collect — Data from Other Sources",
    body: "We may receive information from:\n• Law enforcement or government authorities (e.g., for licensing or investigations).\n• Service providers (e.g., background check companies, insurance providers).\n• Partner transportation companies or fleets you work with.\n• Business partners (e.g., payment processors, financial institutions).\n• Other users (e.g., in connection with referrals, claims, or disputes).",
  },
  {
    heading: "II.B. How We Use Your Data",
    body: "FIKA uses your data to:\n1. Provide our services, including creating your account, matching you with riders, calculating fares, processing payments, and providing customer support.\n2. Enhance safety and security, including verifying your identity, conducting background checks, detecting fraudulent behavior, and providing live support during trips.\n3. For marketing and advertising, such as sending you promotional communications and displaying personalized ads (you can opt out).\n4. Enable communications between you and riders/recipients.\n5. For research and development to improve our services.\n6. Comply with legal obligations and handle claims or disputes.",
  },
  {
    heading: "II.C. Data Sharing and Disclosure",
    body: "FIKA may share your data with:\n• Other users (e.g., riders see your first name, profile photo, vehicle details, and rating).\n• Service providers and business partners (e.g., payment processors, cloud storage providers, marketing agencies).\n• FIKA subsidiaries and affiliates.\n• Law enforcement or government authorities where required by South African law.\n• Other parties with your consent or as necessary to provide our services.",
  },
  {
    heading: "II.D. Data Retention and Deletion",
    body: "We retain your data for as long as necessary to provide our services and comply with legal obligations under South African law (e.g., tax laws require retaining financial records for 5 years). You can request account deletion through the FIKA app. After deletion, we may retain certain data for legal, security, or fraud prevention purposes.",
  },
  {
    heading: "III. Your Rights and Choices (Choice and Transparency)",
    body: "Under POPIA, you have certain rights regarding your personal information. You can:\n• Access and Portability: view and download your data through the FIKA app.\n• Correction: update your personal information in the app’s settings.\n• Deletion: request deletion of your account.\n• Objection: object to certain processing activities, such as direct marketing.\n• Complaints: lodge a complaint with the Information Regulator of South Africa.\n\nHow to exercise your choices:\n• Privacy Settings: control location sharing and notifications in the Privacy menu of the FIKA app.\n• Marketing Communications: opt out of marketing emails and push notifications in your account settings.\n• Device Permissions: adjust permissions (e.g., location, camera) through your mobile device settings.",
  },
  {
    heading: "IV.A. Data Controller",
    body: "FIKA is the responsible party (controller) for your personal information in South Africa.",
  },
  {
    heading: "IV.B. Legal Bases for Processing",
    body: "We process your data based on the following legal grounds as per POPIA:\n• Performance of a Contract: to provide our services to you.\n• Legal Obligation: to comply with South African laws.\n• Legitimate Interests: for purposes like fraud prevention and service improvement (where your rights are not overridden).\n• Consent: for certain activities like specific marketing communications, where we will ask for your consent.",
  },
  {
    heading: "IV.C. Cross-Border Data Transfers",
    body: "FIKA may transfer your data to other countries for processing, but we will ensure it is protected by appropriate safeguards as required by POPIA, such as using agreements that require the recipient to protect your information.",
  },
  {
    heading: "IV.D. Updates to This Notice",
    body: "We may update this notice periodically. We will notify you of significant changes through the FIKA app or via email. Continued use of our services after changes constitutes acceptance of the updated notice.",
  },
];

const PrivacyPolicyDriversScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Privacy Notice (Drivers)"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Sizes.fixPadding * 3.0 }}
        >
          {appIcon()}
          {privacyPolicyInfo()}
        </ScrollView>
      </View>
    </View>
  );

  function privacyPolicyInfo() {
    return (
      <View>
        {privacyPolicySections.map((section, index) => (
          <View key={`${index}`} style={styles.sectionContainer}>
            <Text style={styles.sectionHeadingStyle}>{section.heading}</Text>
            <Text style={styles.privacyPolicyTextStyle}>{section.body}</Text>
          </View>
        ))}
      </View>
    );
  }

  function appIcon() {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          margin: Sizes.fixPadding * 2.0,
        }}
      >
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.appIcon}
        />
        <Text style={{ ...Fonts.secondaryColor24SemiBold }}>Fika</Text>
      </View>
    );
  }
};

export default PrivacyPolicyDriversScreen;

const styles = StyleSheet.create({
  appIcon: {
    height: 80.0,
    width: "100%",
    resizeMode: "contain",
    marginVertical: -Sizes.fixPadding,
  },
  sectionContainer: {
    marginBottom: Sizes.fixPadding * 1.5,
  },
  sectionHeadingStyle: {
    ...Fonts.blackColor16SemiBold,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding - 5.0,
  },
  privacyPolicyTextStyle: {
    ...Fonts.grayColor14Medium,
    marginHorizontal: Sizes.fixPadding * 2.0,
    lineHeight: 21,
  },
});
