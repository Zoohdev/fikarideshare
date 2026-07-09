
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   TouchableOpacity,
//   Modal,
//   ActivityIndicator,
// } from "react-native";
// import React, { useState, useCallback } from "react";
// import { Colors, Fonts, Sizes, CommonStyles } from "../../../constants/styles";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useNavigation, useFocusEffect } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as SecureStore from "expo-secure-store";
// import api from "../../../services/api";

// const ProfileScreen = () => {
//   const navigation = useNavigation();

//   const [showLogoutDialog, setshowLogoutDialog] = useState(false);
//   const [profileData, setProfileData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // useFocusEffect triggers every single time this tab becomes active/clicked
//   useFocusEffect(
//     useCallback(() => {
//       fetchProfileDetails();
      
//       return () => {
//         // Optional cleanup when leaving the tab
//       };
//     }, [])
//   );

//   const fetchProfileDetails = async () => {
//     try {
//       setLoading(true);
//       // Retrieve the encrypted authentication token
//       const token = await SecureStore.getItemAsync("userToken");

//       const response = await api.get("/profile/", );

//       if (response.status === 200 && response.data) {
//         setProfileData(response.data);
//         console.log(response.data)
//       } else {
//         console.log("❌ Profile fetch returned an unexpected status:", response.status);
//       }
//     } catch (error) {
//       // Axios errors capture responses under error.response
//       console.log(
//         "❌ Error fetching profile details from endpoint:", 
//         error.response?.status || error.message
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogoutAction = async () => {
//     try {
//       setshowLogoutDialog(false);

//       // 1. Clear secure keychains and unencrypted identification payloads
//       await SecureStore.deleteItemAsync("user_token");
//       await AsyncStorage.removeItem("riderId");

//       // 2. Clear real-time background connections securely
//       if (socket.connected) {
//         socket.disconnect();
//         console.log("📡 Socket connection closed upon manual logout sequence.");
//       }

//       // 3. Reset the core navigation stack to block hardware back button re-entry
//       navigation.reset({
//         index: 0,
//         routes: [{ name: "auth/loginScreen" }],
//       });
//     } catch (error) {
//       console.log("❌ Critical error thrown during manual signout execution:", error);
//     }
//   };

//   // Display a fallback structural spinner wrapper while fetching backend objects
//   if (loading && !profileData) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bodyBackColor }}>
//         <ActivityIndicator size="large" color={Colors.primaryColor} />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <View style={{ flex: 1 }}>
//         {header()}
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {profileInfo()}
//           {profileOptions()}
//         </ScrollView>
//       </View>
//       {logoutDialog()}
//     </View>
//   );

//   function logoutDialog() {
//     return (
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showLogoutDialog}
//         onRequestClose={() => { setshowLogoutDialog(false) }}
//       >
//         <TouchableOpacity
//           activeOpacity={1}
//           onPress={() => { setshowLogoutDialog(false) }}
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
//         >
//           <View style={{ justifyContent: "center", flex: 1 }}>
//             <TouchableOpacity
//               activeOpacity={1}
//               onPress={() => { }}
//               style={{ ...styles.dialogStyle }}
//             >
//               <View
//                 style={{
//                   marginVertical: Sizes.fixPadding * 2.5,
//                   marginHorizontal: Sizes.fixPadding * 2.0,
//                 }}
//               >
//                 <Text style={{ ...Fonts.blackColor16SemiBold, textAlign: "center" }}>
//                   Are you sure you want to logout this account?
//                 </Text>
//               </View>
//               <View style={{ ...CommonStyles.rowAlignCenter }}>
//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={() => {
//                     setshowLogoutDialog(false);
//                   }}
//                   style={styles.dialogButton}
//                 >
//                   <Text style={{ ...Fonts.whiteColor18SemiBold }}>No</Text>
//                 </TouchableOpacity>
//                 <View style={{ backgroundColor: Colors.whiteColor, width: 2.0 }} />
//                 <TouchableOpacity
//                   activeOpacity={0.8}
//                   onPress={handleLogoutAction}
//                   style={styles.dialogButton}
//                 >
//                   <Text style={{ ...Fonts.whiteColor18SemiBold }}>Logout</Text>
//                 </TouchableOpacity>
//               </View>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     );
//   }

//   function profileOptions() {
//     return (
//       <View
//         style={{
//           backgroundColor: Colors.whiteColor,
//           padding: Sizes.fixPadding * 2.0,
//         }}
//       >
//         {/* Render vehicle row dynamically if the active profile model marks them as a driver */}
//         {profileData?.is_driver && profileOptionSort({
//           icon: "car-outline",
//           option: "My vehicle",
//           detail: "Add vehicle information",
//           onPress: () => {
//             navigation.push("userVehicles/userVehiclesScreen");
//           },
//         })}
//         {profileData?.is_driver && divider()}
        
//         {profileOptionSort({
//           icon: "history",
//           option: "Ride history",
//           detail: "See your ride history",
//           onPress: () => {
//             navigation.push("rideHistory/rideHistoryScreen");
//           },
//         })}
//         {divider()}
//         {profileOptionSort({
//           icon: "text-box-outline",
//           option: "Terms and condition",
//           detail: "Know our terms and condition",
//           onPress: () => {
//             navigation.push("termsAndConditions/termsAndConditionsScreen");
//           },
//         })}
//         {divider()}
//         {profileOptionSort({
//           icon: "shield-alert-outline",
//           option: "Privacy policy",
//           detail: "Know our policy",
//           onPress: () => {
//             navigation.push("privacyPolicy/privacyPolicyScreen");
//           },
//         })}
//         {divider()}
//         {profileOptionSort({
//           icon: "help-circle-outline",
//           option: "FAQs",
//           detail: "Get your question answer",
//           onPress: () => {
//             navigation.push("faq/faqScreen");
//           },
//         })}
//         {divider()}
//         {profileOptionSort({
//           icon: "headphones",
//           option: "Customer support",
//           detail: "Connect us for any issue",
//           onPress: () => {
//             navigation.push("customerSupport/customerSupportScreen");
//           },
//         })}
//         {divider()}
//         {logoutInfo()}
//       </View>
//     );
//   }

//   function logoutInfo() {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={() => {
//           setshowLogoutDialog(true);
//         }}
//         style={{ flexDirection: "row" }}
//       >
//         <MaterialCommunityIcons
//           name={"logout-variant"}
//           size={20}
//           color={Colors.redColor}
//         />
//         <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
//           <Text numberOfLines={1} style={{ ...Fonts.redColor16SemiBold }}>
//             Logout
//           </Text>
//           <Text
//             numberOfLines={1}
//             style={{
//               ...Fonts.grayColor14Medium,
//               marginTop: Sizes.fixPadding - 8.0,
//             }}
//           >
//             Logout your account
//           </Text>
//         </View>
//         <MaterialCommunityIcons
//           name={"chevron-right"}
//           size={24}
//           color={Colors.blackColor}
//           style={{ alignSelf: "center" }}
//         />
//       </TouchableOpacity>
//     );
//   }

//   function divider() {
//     return (
//       <View
//         style={{
//           backgroundColor: Colors.lightGrayColor,
//           height: 1.0,
//           marginVertical: Sizes.fixPadding * 2.0,
//         }}
//       ></View>
//     );
//   }

//   function profileOptionSort({ icon, option, detail, onPress }) {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={onPress}
//         style={{ flexDirection: "row" }}
//       >
//         <MaterialCommunityIcons
//           name={icon}
//           size={20}
//           color={Colors.blackColor}
//         />
//         <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
//           <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
//             {option}
//           </Text>
//           <Text
//             numberOfLines={1}
//             style={{
//               ...Fonts.grayColor14Medium,
//               marginTop: Sizes.fixPadding - 8.0,
//             }}
//           >
//             {detail}
//           </Text>
//         </View>
//         <MaterialCommunityIcons
//           name={"chevron-right"}
//           size={24}
//           color={Colors.blackColor}
//           style={{ alignSelf: "center" }}
//         />
//       </TouchableOpacity>
//     );
//   }

//   function profileInfo() {
//     // Select the remote picture path if saved on the database, fallback to local bundle asset if NULL
//     const imageSource = profileData?.profile_photo
//       ? { uri: profileData.profile_photo }
//       : require("../../../assets/images/user/user1.jpeg");

//     return (
//       <View
//         style={{
//           ...CommonStyles.rowAlignCenter,
//           margin: Sizes.fixPadding * 2.0,
//         }}
//       >
//         <Image
//           source={imageSource}
//           style={{ width: 70.0, height: 70.0, borderRadius: 35.0 }}
//         />
//         <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding + 3.0 }}>
//           {/* Renders full_name model method, falls back to structural interpolation if needed */}
//           <Text style={{ ...Fonts.blackColor17SemiBold }}>
//             {profileData?.full_name || `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim() || "User Profile"}
//           </Text>
//           <Text style={{ ...Fonts.grayColor16SemiBold }}>
//             {profileData?.email || "No email assigned"}
//           </Text>
//         </View>
//         <MaterialCommunityIcons
//           name="square-edit-outline"
//           color={Colors.secondaryColor}
//           size={24}
//           onPress={() => {
//             // Forward existing data to pre-fill the edit layout inputs
//             navigation.push("editProfile/editProfileScreen", { currentProfile: profileData });
//           }}
//         />
//       </View>
//     );
//   }

//   function header() {
//     return (
//       <View
//         style={{
//           backgroundColor: Colors.primaryColor,
//           padding: Sizes.fixPadding * 2.0,
//         }}
//       >
//         <Text style={{ ...Fonts.whiteColor20SemiBold, textAlign: "center" }}>
//           Profile
//         </Text>
//       </View>
//     );
//   }
// };

// export default ProfileScreen;

// const styles = StyleSheet.create({
//   dialogButton: {
//     flex: 1,
//     backgroundColor: Colors.secondaryColor,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: Sizes.fixPadding + 2.0,
//   },
//   dialogStyle: {
//     width: "80%",
//     borderRadius: Sizes.fixPadding,
//     padding: 0,
//     overflow: "hidden",
//     alignSelf: 'center',
//     backgroundColor: Colors.whiteColor
//   },
// });


import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Colors, CommonStyles, Fonts, Sizes } from "../../../constants/styles";
import { useProfile } from "../../context/ProfileContext";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [showLogoutDialog, setshowLogoutDialog] = useState(false);

  // Consume everything from your global Context cloud safely!
  const { profileData, fetchProfileDetails, loading, clearProfileData } = useProfile();

  // useFocusEffect triggers every single time this tab becomes active/clicked
  useFocusEffect(
    useCallback(() => {
      fetchProfileDetails();
      return () => {};
    }, [fetchProfileDetails])
  );

  const handleLogoutAction = async () => {
    try {
      setshowLogoutDialog(false);

      // 1. Clear secure tokens
      await SecureStore.deleteItemAsync("userToken");
      await AsyncStorage.removeItem("riderId");

      // 2. Clear your global profile cloud context state
      clearProfileData();

      // 3. Reset the core navigation stack to prevent backing in
      navigation.reset({
        index: 0,
        routes: [{ name: "auth/loginScreen" }],
      });
    } catch (error) {
      console.log("❌ Critical error thrown during manual signout execution:", error);
    }
  };

  // Display loader if context is fetching and no data is ready yet
  if (loading && !profileData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bodyBackColor }}>
        <ActivityIndicator size="large" color={Colors.primaryColor} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        {header()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {profileInfo()}
          {profileOptions()}
        </ScrollView>
      </View>
      {logoutDialog()}
    </View>
  );

  function logoutDialog() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutDialog}
        onRequestClose={() => { setshowLogoutDialog(false) }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowLogoutDialog(false) }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "center", flex: 1 }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ ...styles.dialogStyle }}>
              <View style={{ marginVertical: Sizes.fixPadding * 2.5, marginHorizontal: Sizes.fixPadding * 2.0 }}>
                <Text style={{ ...Fonts.blackColor16SemiBold, textAlign: "center" }}>
                  Are you sure you want to logout this account?
                </Text>
              </View>
              <View style={{ ...CommonStyles.rowAlignCenter }}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setshowLogoutDialog(false)} style={styles.dialogButton}>
                  <Text style={{ ...Fonts.whiteColor18SemiBold }}>No</Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: Colors.whiteColor, width: 2.0 }} />
                <TouchableOpacity activeOpacity={0.8} onPress={handleLogoutAction} style={styles.dialogButton}>
                  <Text style={{ ...Fonts.whiteColor18SemiBold }}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function profileOptions() {
    return (
      <View style={{ backgroundColor: Colors.whiteColor, padding: Sizes.fixPadding * 2.0 }}>
        {profileData?.is_driver && profileOptionSort({
          icon: "car-outline",
          option: "My vehicle",
          detail: "Add vehicle information",
          onPress: () => navigation.push("userVehicles/userVehiclesScreen"),
        })}
        {profileData?.is_driver && divider()}
        
        {profileOptionSort({
          icon: "history",
          option: "Ride history",
          detail: "See your ride history",
          onPress: () => navigation.push("rideHistory/rideHistoryScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "card-account-details-outline",
          option: "KYC",
          detail: "Check/Update KYC details",
          onPress: () => navigation.push("kyc/KYCIdentityScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "card-account-details-outline",
          option: "Driving License",
          detail: "Verify your driving license",
          onPress: () => navigation.push("DriverLicense/DriverLicenseScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "text-box-outline",
          option: "Terms and condition",
          detail: "Know our terms and condition",
          onPress: () => navigation.push("termsAndConditions/termsAndConditionsScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "shield-alert-outline",
          option: "Privacy policy",
          detail: "Know our policy",
          onPress: () => navigation.push("privacyPolicyDrivers/privacyPolicyDriversScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "help-circle-outline",
          option: "FAQs",
          detail: "Get your question answer",
          onPress: () => navigation.push("faq/faqScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "headphones",
          option: "Customer support",
          detail: "Connect us for any issue",
          onPress: () => navigation.push("customerSupport/customerSupportScreen"),
        })}
        {divider()}
        {logoutInfo()}
      </View>
    );
  }

  function profileOptionSort({ icon, option, detail, onPress }) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flexDirection: "row" }}>
        <MaterialCommunityIcons name={icon} size={20} color={Colors.blackColor} />
        <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
          <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>{option}</Text>
          <Text numberOfLines={1} style={{ ...Fonts.grayColor14Medium, marginTop: Sizes.fixPadding - 8.0 }}>{detail}</Text>
        </View>
        <MaterialCommunityIcons name={"chevron-right"} size={24} color={Colors.blackColor} style={{ alignSelf: "center" }} />
      </TouchableOpacity>
    );
  }

  function logoutInfo() {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => setshowLogoutDialog(true)} style={{ flexDirection: "row" }}>
        <MaterialCommunityIcons name={"logout-variant"} size={20} color={Colors.redColor} />
        <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
          <Text numberOfLines={1} style={{ ...Fonts.redColor16SemiBold }}>Logout</Text>
          <Text numberOfLines={1} style={{ ...Fonts.grayColor14Medium, marginTop: Sizes.fixPadding - 8.0 }}>Logout your account</Text>
        </View>
        <MaterialCommunityIcons name={"chevron-right"} size={24} color={Colors.blackColor} style={{ alignSelf: "center" }} />
      </TouchableOpacity>
    );
  }

  function divider() {
    return <View style={{ backgroundColor: Colors.lightGrayColor, height: 1.0, marginVertical: Sizes.fixPadding * 2.0 }} />;
  }

  function profileInfo() {
    const imageSource = profileData?.profile_photo
      ? { uri: profileData.profile_photo }
      : require("../../../assets/images/user/user1.jpeg");

    return (
      <View style={{ ...CommonStyles.rowAlignCenter, margin: Sizes.fixPadding * 2.0 }}>
        <Image source={imageSource} style={{ width: 70.0, height: 70.0, borderRadius: 35.0 }} />
        <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding + 3.0 }}>
          <Text style={{ ...Fonts.blackColor17SemiBold }}>
            {profileData?.full_name || `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim() || "User Profile"}
          </Text>
          <Text style={{ ...Fonts.grayColor16SemiBold }}>
            {profileData?.email || "No email assigned"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="square-edit-outline"
          color={Colors.secondaryColor}
          size={24}
          onPress={() => navigation.push("editProfile/editProfileScreen", { currentProfile: profileData })}
        />
      </View>
    );
  }

  function header() {
    return (
      <View style={{ backgroundColor: Colors.primaryColor, padding: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.whiteColor20SemiBold, textAlign: "center" }}>Profile</Text>
      </View>
    );
  }
};

export default ProfileScreen;

const styles = StyleSheet.create({
  dialogButton: {
    flex: 1,
    backgroundColor: Colors.secondaryColor,
    alignItems: "center",
    justifyContent: "center",
    padding: Sizes.fixPadding + 2.0,
  },
  dialogStyle: {
    width: "80%",
    borderRadius: Sizes.fixPadding,
    padding: 0,
    overflow: "hidden",
    alignSelf: 'center',
    backgroundColor: Colors.whiteColor
  },
});