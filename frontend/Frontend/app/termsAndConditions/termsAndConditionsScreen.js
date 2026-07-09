import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const termsAndConditions = [
  {
    heading: "Contractual Relationship",
    body: "These Terms of Use (“Terms”) govern the access or use by you, an individual, from within the Republic of South Africa, of applications, websites, content, products, and services (the “Services”) made available by FIKA, a private company duly incorporated in accordance with the company laws of South Africa.\n\nPLEASE READ THESE TERMS CAREFULLY BEFORE ACCESSING OR USING THE SERVICES.\n\nYour access and use of the Services constitutes your agreement to be bound by these Terms, which establishes a contractual relationship between you and FIKA. If you do not agree to these Terms, you may not access or use the Services. These Terms expressly supersede prior agreements or arrangements with you. FIKA may immediately terminate these Terms or any Services with respect to you, or generally cease offering or deny access to the Services or any portion thereof, at any time for any reason.\n\nSupplemental terms may apply to certain Services, such as policies for a particular event, activity or promotion, and such supplemental terms will be disclosed to you in connection with the applicable Services. Supplemental terms are in addition to, and shall be deemed a part of, the Terms for the purposes of the applicable Services. Supplemental terms shall prevail over these Terms in the event of a conflict with respect to the applicable Services.\n\nFIKA may amend the Terms related to the Services from time to time. Amendments will be effective upon FIKA’s posting of such updated Terms at this location or the amended policies or supplemental terms on the applicable Service. Your continued access or use of the Services after such posting constitutes your consent to be bound by the Terms, as amended.\n\nOur collection and use of personal information in connection with the Services is as provided in FIKA’s Privacy Policy located at www.fikatransit.com. FIKA may provide to a claims processor or an insurer any necessary information (including your contact information) if there is a complaint, dispute or conflict, which may include an accident, involving you and a Third Party Provider and such information or data is necessary to resolve the complaint, dispute or conflict.",
  },
  {
    heading: "The Services",
    body: "The Services constitute a technology platform that enables users of FIKA’s mobile applications or websites provided as part of the Services (each, an “Application”) to arrange and schedule transportation and/or logistics services with independent third party providers of such services, including independent third party transportation providers under agreement with FIKA or certain of FIKA’s affiliates (“Third Party Providers”). Unless otherwise agreed by FIKA in a separate written agreement with you, the Services are made available solely for your personal, non-commercial use.\n\nYOU ACKNOWLEDGE THAT FIKA DOES NOT PROVIDE TRANSPORTATION OR LOGISTICS SERVICES OR FUNCTION AS A TRANSPORTATION CARRIER AND THAT ALL SUCH TRANSPORTATION OR LOGISTICS SERVICES ARE PROVIDED BY INDEPENDENT THIRD PARTY CONTRACTORS WHO ARE NOT EMPLOYED BY FIKA OR ANY OF ITS AFFILIATES.",
  },
  {
    heading: "License",
    body: "Subject to your compliance with these Terms, FIKA grants you a limited, non-exclusive, non-sublicensable, revocable, non-transferrable license to: (i) access and use the Applications on your personal device solely in connection with your use of the Services; and (ii) access and use any content, information and related materials that may be made available through the Services, in each case solely for your personal, non-commercial use. Any rights not expressly granted herein are reserved by FIKA and FIKA’s licensors.",
  },
  {
    heading: "Restrictions",
    body: "You may not: (i) remove any copyright, trademark or other proprietary notices from any portion of the Services; (ii) reproduce, modify, prepare derivative works based upon, distribute, license, lease, sell, resell, transfer, publicly display, publicly perform, transmit, stream, broadcast or otherwise exploit the Services except as expressly permitted by FIKA; (iii) decompile, reverse engineer or disassemble the Services except as may be permitted by applicable law; (iv) link to, mirror or frame any portion of the Services; (v) cause or launch any programs or scripts for the purpose of scraping, indexing, surveying, or otherwise data mining any portion of the Services or unduly burdening or hindering the operation and/or functionality of any aspect of the Services; or (vi) attempt to gain unauthorized access to or impair any aspect of the Services or its related systems or networks.",
  },
  {
    heading: "Provision of the Services",
    body: "You acknowledge that portions of the Services may be made available under FIKA’s various brands or request options associated with transportation, including the transportation request brands currently referred to as “FIKA Go,” “FIKA Comfort,” “FIKA XL,” and “FIKA Black.” You also acknowledge that the Services may be made available under such brands or request options by or in connection with independent Third Party Providers.",
  },
  {
    heading: "Third Party Services and Content",
    body: "The Services may be made available or accessed in connection with third party services and content (including advertising) that FIKA does not control. You acknowledge that different terms of use and privacy policies may apply to your use of such third party services and content. FIKA does not endorse such third party services and content and in no event shall FIKA be responsible or liable for any products or services of such third party providers.",
  },
  {
    heading: "Ownership",
    body: "The Services and all rights therein are and shall remain FIKA’s property or the property of FIKA’s licensors. Neither these Terms nor your use of the Services convey or grant to you any rights: (i) in or related to the Services except for the limited license granted above; or (ii) to use or reference in any manner FIKA’s company names, logos, product and service names, trademarks or services marks or those of FIKA’s licensors.",
  },
  {
    heading: "User Accounts",
    body: "In order to use most aspects of the Services, you must register for and maintain an active personal user Services account (“Account”). You must be at least 18 years of age to obtain an Account. Account registration requires you to submit to FIKA certain personal information, such as your name, address, mobile phone number and age, as well as at least one valid payment method. You agree to maintain accurate, complete, and up-to-date information in your Account. Your failure to maintain accurate, complete, and up-to-date Account information, including having an invalid or expired payment method on file, may result in your inability to access and use the Services or FIKA’s termination of these Terms with you. You are responsible for all activity that occurs under your Account, and you agree to maintain the security and secrecy of your Account username and password at all times. Unless otherwise permitted by FIKA in writing, you may only possess one Account.",
  },
  {
    heading: "User Requirements and Conduct",
    body: "The Service is not available for use by persons under the age of 18. You may not authorize third parties to use your Account and you may not allow persons under the age of 18 to receive transportation services from Third Party Providers unless they are accompanied by you. You may not assign or otherwise transfer your Account to any other person or entity. You agree to comply with all applicable laws of South Africa when using the Services, and you may only use the Services for lawful purposes. You will not, in your use of the Services, cause nuisance, annoyance, inconvenience, or property damage, whether to the Third Party Provider or any other party.",
  },
  {
    heading: "Text Messaging",
    body: "By creating an Account, you agree that the Services may send you text (SMS) messages as part of the normal business operation of your use of the Services. You may opt-out of receiving text (SMS) messages from FIKA at any time by updating your notification preferences in your Account settings. You acknowledge that opting out of receiving text (SMS) messages may impact your use of the Services.",
  },
  {
    heading: "Promotional Codes",
    body: "FIKA may, in FIKA’s sole discretion, create promotional codes that may be redeemed for Account credit, or other features or benefits related to the Services, subject to any additional terms that FIKA establishes (“Promo Codes”). You agree that Promo Codes: (i) must be used for the intended audience and purpose, and in a lawful manner; (ii) may not be duplicated, sold or transferred in any manner; (iii) may be disabled by FIKA at any time for any reason without liability to FIKA; (iv) are not valid for cash; and (v) may expire prior to your use. FIKA reserves the right to withhold or deduct credits or other features or benefits obtained through the use of Promo Codes if FIKA determines that the use or redemption of the Promo Code was in error, fraudulent, illegal, or in violation of these Terms.",
  },
  {
    heading: "User Provided Content",
    body: "FIKA may, in FIKA’s sole discretion, permit you from time to time to submit, upload, publish or otherwise make available to FIKA through the Services textual, audio, and/or visual content and information, including commentary and feedback related to the Services (“User Content”). Any User Content provided by you remains your property. However, by providing User Content to FIKA, you grant FIKA a worldwide, perpetual, irrevocable, transferable, royalty-free license to use, copy, modify, create derivative works of, distribute, publicly display, publicly perform, and otherwise exploit such User Content in all formats and distribution channels in connection with the Services and FIKA’s business.\n\nYou represent and warrant that: (i) you either are the sole and exclusive owner of all User Content or you have all rights, licenses, consents and releases necessary to grant FIKA the license to the User Content as set forth above; and (ii) neither the User Content nor your submission, uploading, publishing or otherwise making available of such User Content nor FIKA’s use of the User Content as permitted herein will infringe, misappropriate or violate a third party’s intellectual property or proprietary rights, or rights of publicity or privacy, or result in the violation of any applicable law or regulation.\n\nYou agree to not provide User Content that is defamatory, libelous, hateful, violent, obscene, pornographic, unlawful, or otherwise offensive, as determined by FIKA in its sole discretion. FIKA may, but shall not be obligated to, review, monitor, or remove User Content, at FIKA’s sole discretion and at any time and for any reason, without notice to you.",
  },
  {
    heading: "Network Access and Devices",
    body: "You are responsible for obtaining the data network access necessary to use the Services. Your mobile network’s data and messaging rates and fees may apply if you access or use the Services from a wireless-enabled device and you shall be responsible for such rates and fees. You are responsible for acquiring and updating compatible hardware or devices necessary to access and use the Services and Applications and any updates thereto. FIKA does not guarantee that the Services, or any portion thereof, will function on any particular hardware or devices. In addition, the Services may be subject to malfunctions and delays inherent in the use of the Internet and electronic communications.",
  },
  {
    heading: "Payment",
    body: "You understand that use of the Services may result in charges to you for the services or goods you receive from a Third Party Provider (“Charges”). After you have received services or goods obtained through your use of the Service, FIKA will facilitate your payment of the applicable Charges on behalf of the Third Party Provider as such Third Party Provider’s limited payment collection agent. Payment of the Charges in such manner shall be considered the same as payment made directly by you to the Third Party Provider. Charges may include other applicable fees, tolls, and/or surcharges including a booking fee, national and local tolls, and will be inclusive of applicable taxes where required by law. Charges paid by you are final and non-refundable, unless otherwise determined by FIKA.\n\nAll Charges are due immediately and payment will be facilitated by FIKA using the preferred payment method designated in your Account, after which FIKA will send you a receipt. If your primary Account payment method is determined to be expired, invalid or otherwise not able to be charged, you agree that FIKA may use a secondary payment method in your Account, if available.\n\nFIKA reserves the right to establish, remove and/or revise Charges for any or all services or goods obtained through the use of the Services at any time in FIKA’s sole discretion. Further, you acknowledge and agree that Charges applicable in certain geographical areas may increase substantially during times of high demand. FIKA will use reasonable efforts to inform you of Charges that may apply, provided that you will be responsible for Charges incurred under your Account regardless of your awareness of such Charges or the amounts thereof. You may elect to cancel your request for services or goods from a Third Party Provider at any time prior to such Third Party Provider’s arrival, in which case you may be charged a cancellation fee.\n\nThis payment structure is intended to fully compensate the Third Party Provider for the services or goods provided. You understand and agree that, while you are free to provide additional payment as a gratuity to any Third Party Provider, you are under no obligation to do so. Gratuities are voluntary. After you have received services or goods obtained through the Service, you will have the opportunity to rate your experience.",
  },
  {
    heading: "Repair or Cleaning Fees",
    body: "You shall be responsible for the cost of repair for damage to, or necessary cleaning of, Third Party Provider vehicles and property resulting from use of the Services under your Account in excess of normal “wear and tear” (“Repair or Cleaning”). In the event that a Third Party Provider reports the need for Repair or Cleaning, and such request is verified by FIKA in its reasonable discretion, FIKA reserves the right to facilitate payment for the reasonable cost of such Repair or Cleaning on behalf of the Third Party Provider using your payment method designated in your Account. Such amounts will be transferred by FIKA to the applicable Third Party Provider and are non-refundable.",
  },
  {
    heading: "Disclaimer",
    body: "The Services are provided “as is” and “as available.” FIKA disclaims all representations and warranties, express, implied or statutory, not expressly set out in these Terms. FIKA makes no guarantee regarding the reliability, timeliness, quality, suitability or availability of the Services or any services or goods requested through the use of the Services. FIKA does not guarantee the quality, suitability, safety or the ability of Third Party Providers. You agree that the entire risk arising out of your use of the Services remains solely with you, to the maximum extent permitted under applicable law.",
  },
  {
    heading: "Limitation of Liability",
    body: "FIKA shall not be liable for indirect, incidental, special, exemplary, punitive or consequential damages, including lost profits, lost data, personal injury or property damage related to, in connection with, or otherwise resulting from any use of the Services. FIKA shall not be liable for any damages, liability or losses arising out of: (i) your use of or reliance on the Services or your inability to access or use the Services; or (ii) any transaction or relationship between you and any Third Party Provider. In no event shall FIKA’s total liability to you in connection with the Services for all damages, losses and causes of action exceed five thousand South African rand (ZAR 5,000).\n\nThe limitations and disclaimer in this section do not purport to limit liability or alter your rights as a consumer that cannot be excluded under applicable South African law.",
  },
  {
    heading: "Indemnity",
    body: "You agree to indemnify and hold FIKA and its officers, directors, employees and agents harmless from any and all claims, demands, losses, liabilities, and expenses (including attorneys’ fees) arising out of or in connection with: (i) your use of the Services or services or goods obtained through your use of the Services; (ii) your breach or violation of any of these Terms; (iii) FIKA’s use of your User Content; or (iv) your violation of the rights of any third party, including Third Party Providers.",
  },
  {
    heading: "Lost Property",
    body: "You understand and agree that it is your responsibility to ensure that you remove your property from the vehicle of a Third Party Provider when disembarking. Should you leave your property in the vehicle, the Third Party Provider may hand over your property to you or to FIKA.\n\nWhilst you may expect Third Party Providers to hand over your property, FIKA shall not be held liable in the event of the Third Party Provider not handing over your property. Moreover, FIKA shall not be liable for the loss or damage to your property whilst it is in transit.\n\nWhilst FIKA will take reasonable steps to establish the owner of property left in a Third Party Provider’s vehicle if returned to FIKA, when your property is in FIKA’s possession, you understand and agree that: (i) FIKA will only keep your property for a maximum period of three months from the date on which it was received; and (ii) should you fail to collect your property from FIKA before the expiry of this three month period, FIKA will be entitled to deal with your property as it deems fit and you shall have no claim whatsoever against FIKA in respect of your unclaimed property.",
  },
  {
    heading: "Governing Law; Dispute Resolution",
    body: "These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiations. Should this fail, the dispute may be referred to arbitration in Johannesburg, South Africa, in accordance with the rules of the Arbitration Foundation of Southern Africa (AFSA), by an arbitrator appointed by AFSA. The arbitration shall be conducted in English. Notwithstanding the above, nothing in this clause shall prevent either party from seeking urgent interim relief in a court of competent jurisdiction.",
  },
  {
    heading: "Claims of Copyright Infringement",
    body: "Claims of copyright infringement should be sent to FIKA’s designated agent at the address provided below.",
  },
  {
    heading: "Notice",
    body: "FIKA may give notice by means of a general notice on the Services, electronic mail to your email address in your Account, or by written communication sent to your address as set forth in your Account. You may give notice to FIKA by written communication to FIKA’s registered address, South Africa.",
  },
  {
    heading: "General",
    body: "You may not assign or transfer these Terms in whole or in part without FIKA’s prior written approval. You give your approval to FIKA for it to assign or transfer these Terms in whole or in part. No joint venture, partnership, employment or agency relationship exists between you, FIKA or any Third Party Provider as a result of these Terms or use of the Services. If any provision of these Terms is held to be illegal, invalid or unenforceable, the remainder of the Terms shall remain in full force and effect. These Terms constitute the entire agreement and understanding of the parties with respect to its subject matter.",
  },
];

const TermsAndConditionsScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Terms and Conditions"} navigation={navigation} />
        {termsAndConditionsInfo()}
      </View>
    </View>
  );

  function termsAndConditionsInfo() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding + 5.0, paddingBottom: Sizes.fixPadding * 3.0 }}
      >
        {termsAndConditions.map((section, index) => (
          <View key={`${index}`} style={styles.sectionContainer}>
            <Text style={styles.sectionHeadingStyle}>{section.heading}</Text>
            <Text style={styles.termsAndConditionTextStyle}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: Sizes.fixPadding * 1.5,
  },
  sectionHeadingStyle: {
    ...Fonts.blackColor16SemiBold,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding - 5.0,
  },
  termsAndConditionTextStyle: {
    ...Fonts.grayColor14Medium,
    marginHorizontal: Sizes.fixPadding * 2.0,
    lineHeight: 21,
  },
});
