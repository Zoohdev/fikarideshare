// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useIsFocused } from "@react-navigation/native";
// import { useNavigation } from "expo-router";
// import * as SecureStore from "expo-secure-store";
// import React, { useEffect, useState } from "react";
// import {
//   Image,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// import { API_HOST } from "../../../constants/apiConfig";
// import { Colors, CommonStyles, Fonts, Sizes } from "../../../constants/styles";
// import { useProfile } from "../../context/ProfileContext";

// const ProfileScreen = () => {

//   const navigation = useNavigation();
//   const isFocused = useIsFocused();
//   const { profileData, fetchProfileDetails, clearProfileData } = useProfile();

//   const [showLogoutDialog, setshowLogoutDialog] = useState(false);

//   useEffect(() => {
//     if (isFocused) {
//       fetchProfileDetails();
//     }
//   }, [isFocused]);

//   const avatarUrl = profileData?.profile_photo
//     ? (profileData.profile_photo.startsWith("http")
//         ? profileData.profile_photo
//         : `http://${API_HOST}${profileData.profile_photo}`)
//     : null;

//   const memberSince = profileData?.created_at
//     ? new Date(profileData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
//     : null;

//   const handleLogout = async () => {
//     setshowLogoutDialog(false);
//     try {
//       await SecureStore.deleteItemAsync("userToken");
//       await SecureStore.deleteItemAsync("refreshToken");
//       await AsyncStorage.multiRemove(["userData", "userId", "token"]);
//     } catch (error) {
//       console.error("Error clearing session:", error);
//     }
//     clearProfileData();
//     navigation.push("auth/loginScreen");
//   };

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
//                   onPress={handleLogout}
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
//         {profileOptionSort({
//           icon: "car-outline",
//           option: "My vehicle",
//           detail: "Add vehicle information",
//           onPress: () => {
//             navigation.push("userVehicles/userVehiclesScreen");
//           },
//         })}
//         {divider()}
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
//     return (
//       <View>
//         <View
//           style={{
//             ...CommonStyles.rowAlignCenter,
//             margin: Sizes.fixPadding * 2.0,
//           }}
//         >
//           <Image
//             source={avatarUrl ? { uri: avatarUrl } : require("../../../assets/images/user/user1.jpeg")}
//             style={{ width: 70.0, height: 70.0, borderRadius: 35.0 }}
//           />
//           <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding + 3.0 }}>
//             <Text style={{ ...Fonts.blackColor17SemiBold }}>
//               {profileData?.full_name || "Loading..."}
//             </Text>
//             <Text style={{ ...Fonts.grayColor16SemiBold }}>
//               {profileData?.email || ""}
//             </Text>
//           </View>
//           <MaterialCommunityIcons
//             name="square-edit-outline"
//             color={Colors.secondaryColor}
//             size={24}
//             onPress={() => {
//               navigation.push("editProfile/editProfileScreen");
//             }}
//           />
//         </View>

//         {profileData && (
//           <View style={styles.detailsCard}>
//             <View style={styles.detailsRow}>
//               <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.grayColor} />
//               <Text style={styles.detailsText}>{profileData.phone_number}</Text>
//             </View>
//             <View style={styles.detailsRow}>
//               <MaterialCommunityIcons name="star" size={16} color={Colors.secondaryColor} />
//               <Text style={styles.detailsText}>
//                 {Number(profileData.average_rating).toFixed(1)} rating ({profileData.total_ratings} ratings)
//               </Text>
//             </View>
//             <View style={styles.detailsRow}>
//               <MaterialCommunityIcons
//                 name={profileData.is_verified ? "shield-check" : "shield-alert-outline"}
//                 size={16}
//                 color={profileData.is_verified ? Colors.greenColor : Colors.redColor}
//               />
//               <Text style={styles.detailsText}>
//                 {profileData.is_verified ? "Verified account" : `KYC: ${profileData.kyc_status?.replaceAll("_", " ")}`}
//               </Text>
//             </View>
//             <View style={styles.detailsRow}>
//               <MaterialCommunityIcons name="account-outline" size={16} color={Colors.grayColor} />
//               <Text style={styles.detailsText}>
//                 {profileData.user_type?.charAt(0).toUpperCase() + profileData.user_type?.slice(1)}
//               </Text>
//             </View>
//             {memberSince && (
//               <View style={styles.detailsRow}>
//                 <MaterialCommunityIcons name="calendar-outline" size={16} color={Colors.grayColor} />
//                 <Text style={styles.detailsText}>Member since {memberSince}</Text>
//               </View>
//             )}
//           </View>
//         )}
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
//   detailsCard: {
//     backgroundColor: Colors.whiteColor,
//     marginHorizontal: Sizes.fixPadding * 2.0,
//     marginBottom: Sizes.fixPadding * 2.0,
//     borderRadius: Sizes.fixPadding,
//     padding: Sizes.fixPadding + 5.0,
//     ...CommonStyles.shadow,
//   },
//   detailsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: Sizes.fixPadding - 5.0,
//   },
//   detailsText: {
//     ...Fonts.grayColor14Medium,
//     marginLeft: Sizes.fixPadding,
//   },
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
import { useIsFocused } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Colors, CommonStyles, Fonts, Sizes } from "../../../constants/styles";
import { useProfile } from "../../context/ProfileContext";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { profileData, fetchProfileDetails, clearProfileData } = useProfile();

  const [showLogoutDialog, setshowLogoutDialog] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isAnonymousMode, setIsAnonymousMode] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchProfileDetails();
    }
  }, [isFocused]);

  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const handleLogout = async () => {
    setshowLogoutDialog(false);
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await AsyncStorage.multiRemove(["userData", "userId", "token"]);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
    clearProfileData();
    navigation.push("auth/loginScreen");
  };

  const toggleAnonymousMode = () => {
    setIsAnonymousMode(!isAnonymousMode);
    setShowAvatarMenu(false);
    Alert.alert(
      "Privacy State Changed",
      `Profile identity mask is now ${!isAnonymousMode ? "Enabled" : "Disabled"}.`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      {header()}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {profileCardInfo()}
        {profileOptions()}
      </ScrollView>
      {logoutDialog()}
      {avatarSelectionSheet()}
    </View>
  );

  function header() {
    return (
      <View style={styles.headerStyle}>
        <Text style={styles.headerTitleText}>Account Profile</Text>
      </View>
    );
  }

  function profileCardInfo() {
    return (
      <View style={styles.premiumCardContainer}>
        {/* CENTERED ANONYMOUS AVATAR ELEMENT */}
        <View style={styles.centeredAvatarSection}>
          <TouchableOpacity 
            activeOpacity={0.85} 
            onPress={() => setShowAvatarMenu(true)} 
            style={styles.avatarCircleContainer}
          >
            {isAnonymousMode ? (
              <FontAwesome6 name="user-ninja" size={32} color={Colors.primaryColor} />
            ) : (
              <FontAwesome6 name="user-astronaut" size={32} color="#475569" />
            )}
            <View style={styles.editPencilBadge}>
              <MaterialCommunityIcons name="camera" size={11} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileNameText}>
            {isAnonymousMode ? "Anonymous User" : (profileData?.full_name || "Active Member")}
          </Text>
          <Text style={styles.profileEmailText}>
            {isAnonymousMode ? "identity encrypted" : (profileData?.email || "No email bound")}
          </Text>

          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigation.push("editProfile/editProfileScreen")}
            style={styles.editProfilePillButton}
          >
            <MaterialCommunityIcons name="account-edit-outline" color={Colors.primaryColor} size={16} />
            <Text style={styles.editPillText}>Edit Settings</Text>
          </TouchableOpacity>
        </View>

        {profileData && (
          <View style={styles.metaDataGrid}>
            <View style={styles.detailsRow}>
              <MaterialCommunityIcons name="phone" size={15} color="#94A3B8" />
              <Text style={styles.detailsText}>{profileData.phone_number}</Text>
            </View>
            
            <View style={styles.detailsRow}>
              <MaterialCommunityIcons name="star" size={15} color="#F59E0B" />
              <Text style={styles.detailsText}>
                {Number(profileData.average_rating || 5.0).toFixed(1)} Rating ({profileData.total_ratings || 0} reviews)
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <MaterialCommunityIcons
                name={profileData.is_verified ? "shield-check" : "shield-alert"}
                size={15}
                color={profileData.is_verified ? "#10B981" : "#EF4444"}
              />
              <Text style={[styles.detailsText, { fontWeight: "600" }]}>
                {profileData.is_verified ? "Verified Account" : `KYC Status: ${profileData.kyc_status?.replace(/_/g, " ")}`}
              </Text>
            </View>

            {memberSince && (
              <View style={[styles.detailsRow, { marginBottom: 0 }]}>
                <MaterialCommunityIcons name="calendar-month" size={15} color="#94A3B8" />
                <Text style={styles.detailsText}>Joined {memberSince}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  function profileOptions() {
    return (
      <View style={styles.optionsListWrapper}>
        {profileOptionSort({
          icon: "car-cog",
          option: "My Vehicle",
          detail: "Add or manage transport documentation",
          onPress: () => navigation.push("userVehicles/userVehiclesScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "chart-timeline-variant",
          option: "Ride History",
          detail: "Review pricing paths & past routes",
          onPress: () => navigation.push("rideHistory/rideHistoryScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "file-document-outline",
          option: "Terms & Conditions",
          detail: "Our user governance protocols",
          onPress: () => navigation.push("termsAndConditions/termsAndConditionsScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "shield-lock-outline",
          option: "Privacy Policy",
          detail: "Data access safety measures",
          onPress: () => navigation.push("privacyPolicy/privacyPolicyScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "help-circle-outline",
          option: "Help & FAQs",
          detail: "Instant operational clarity solutions",
          onPress: () => navigation.push("faq/faqScreen"),
        })}
        {divider()}
        {profileOptionSort({
          icon: "face-agent",
          option: "Customer Support",
          detail: "24/7 internal communications hub",
          onPress: () => navigation.push("customerSupport/customerSupportScreen"),
        })}
        {divider()}
        {logoutInfo()}
      </View>
    );
  }

  function profileOptionSort({ icon, option, detail, onPress }) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.optionRowLink}>
        <View style={styles.optionLeftCircle}>
          <MaterialCommunityIcons name={icon} size={20} color={Colors.primaryColor} />
        </View>
        <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding * 1.2 }}>
          <Text style={styles.optionMainTitle}>{option}</Text>
          <Text style={styles.optionSubDetail}>{detail}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
      </TouchableOpacity>
    );
  }

  function logoutInfo() {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => setshowLogoutDialog(true)} style={styles.optionRowLink}>
        <View style={[styles.optionLeftCircle, { backgroundColor: "#FEF2F2" }]}>
          <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
        </View>
        <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding * 1.2 }}>
          <Text style={[styles.optionMainTitle, { color: "#EF4444" }]}>Logout</Text>
          <Text style={styles.optionSubDetail}>Safely end your current active device session</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
      </TouchableOpacity>
    );
  }

  function divider() {
    return <View style={styles.listDividerLine} />;
  }

  function avatarSelectionSheet() {
    return (
      <Modal animationType="fade" transparent={true} visible={showAvatarMenu} onRequestClose={() => setShowAvatarMenu(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowAvatarMenu(false)} style={styles.modalScrimContainer}>
          <View style={styles.bottomSheetCard}>
            <Text style={styles.sheetTitleText}>Profile Appearance</Text>
            <Text style={styles.sheetSubtitleText}>Toggle an elite anonymous appearance state mask layout.</Text>
            
            <TouchableOpacity activeOpacity={0.8} onPress={toggleAnonymousMode} style={styles.sheetActionButton}>
              <MaterialCommunityIcons name="incognito" size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.sheetActionText}>
                {isAnonymousMode ? "Disable Anonymous Mode" : "Switch to Anonymous Ninja"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAvatarMenu(false)} style={styles.sheetCancelButton}>
              <Text style={styles.sheetCancelText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function logoutDialog() {
    return (
      <Modal animationType="slide" transparent={true} visible={showLogoutDialog} onRequestClose={() => setshowLogoutDialog(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setshowLogoutDialog(false)} style={styles.modalScrimContainer}>
          <View style={styles.dialogCardWrapper}>
            <View style={styles.warningIconCircle}>
              <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.dialogMainConfirmHeading}>Confirm Account Logout</Text>
            <Text style={styles.dialogSecondaryNotice}>Are you sure you want to log out? You will need to re-verify your secure credentials to re-enter your dashboard interface.</Text>
            
            <View style={styles.dialogSplitRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setshowLogoutDialog(false)} style={styles.dialogNegativeAction}>
                <Text style={styles.dialogNegativeText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.dialogPositiveAction}>
                <Text style={styles.dialogPositiveText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
};

export default ProfileScreen;

// --- PREMIUM RE-ENGINEERED CENTRIC UI SPECIFICATIONS ---
const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: Sizes.fixPadding * 2.5,
    paddingBottom: Sizes.fixPadding * 4.5,
    paddingTop: Sizes.fixPadding * 2.0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitleText: {
    ...Fonts.whiteColor20SemiBold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  premiumCardContainer: {
    backgroundColor: Colors.whiteColor,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginTop: -Sizes.fixPadding * 3.0,
    borderRadius: 24,
    padding: Sizes.fixPadding * 2.2,
    ...CommonStyles.shadow,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  centeredAvatarSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Sizes.fixPadding,
  },
  avatarCircleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editPencilBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryColor,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.blackColor,
    fontFamily: "Regular",
    marginTop: Sizes.fixPadding * 1.2,
  },
  profileEmailText: {
    fontSize: 12.5,
    color: "#64748B",
    marginTop: 2,
    textTransform: "lowercase",
  },
  editProfilePillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: Sizes.fixPadding * 1.5,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: Sizes.fixPadding * 1.2,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryColor,
    marginLeft: 6,
  },
  metaDataGrid: {
    marginTop: Sizes.fixPadding * 1.5,
    paddingTop: Sizes.fixPadding * 1.5,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Sizes.fixPadding - 2,
  },
  detailsText: {
    fontSize: 13.5,
    color: "#475569",
    marginLeft: Sizes.fixPadding * 1.2,
  },
  optionsListWrapper: {
    backgroundColor: Colors.whiteColor,
    borderRadius: 24,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginTop: Sizes.fixPadding * 1.5,
    padding: Sizes.fixPadding * 1.5,
    ...CommonStyles.shadow,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  optionRowLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Sizes.fixPadding * 0.4,
  },
  optionLeftCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionMainTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.blackColor,
  },
  optionSubDetail: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  listDividerLine: {
    backgroundColor: "#F1F5F9",
    height: 1.0,
    marginVertical: Sizes.fixPadding * 1.2,
    marginLeft: 48,
  },
  modalScrimContainer: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
  },
  bottomSheetCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Sizes.fixPadding * 2.5,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  sheetSubtitleText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  sheetActionButton: {
    backgroundColor: Colors.primaryColor,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginVertical: 6,
  },
  sheetActionText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
  sheetCancelButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Sizes.fixPadding,
  },
  sheetCancelText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  dialogCardWrapper: {
    width: "86%",
    borderRadius: 24,
    padding: Sizes.fixPadding * 2.5,
    alignSelf: "center",
    backgroundColor: Colors.whiteColor,
    alignItems: "center",
    ...CommonStyles.shadow,
  },
  warningIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Sizes.fixPadding * 1.5,
  },
  dialogMainConfirmHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  dialogSecondaryNotice: {
    fontSize: 13.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginTop: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  dialogSplitRow: {
    flexDirection: "row",
    width: "100%",
  },
  dialogNegativeAction: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Sizes.fixPadding,
  },
  dialogNegativeText: {
    color: "#475569",
    fontWeight: "600",
  },
  dialogPositiveAction: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  dialogPositiveText: {
    color: "#FFF",
    fontWeight: "600",
  },
});