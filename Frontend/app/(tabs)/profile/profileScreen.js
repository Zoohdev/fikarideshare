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
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { API_HOST } from "../../../constants/apiConfig";
import { Colors, CommonStyles, Fonts, Sizes } from "../../../constants/styles";
import { useProfile } from "../../context/ProfileContext";

// --- REUSABLE SUB-COMPONENTS ---

const Header = () => (
  <View style={styles.headerContainer}>
    <Text style={{ ...Fonts.whiteColor20SemiBold, textAlign: "center" }}>
      Profile
    </Text>
  </View>
);

const Divider = () => <View style={styles.dividerStyle} />;

const ProfileOptionItem = ({ icon, option, detail, onPress, isRed = false }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={{ flexDirection: "row" }}
  >
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color={isRed ? Colors.redColor : Colors.blackColor}
    />
    <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
      <Text
        numberOfLines={1}
        style={isRed ? Fonts.redColor16SemiBold : Fonts.blackColor16SemiBold}
      >
        {option}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          ...Fonts.grayColor14Medium,
          marginTop: Sizes.fixPadding - 8.0,
        }}
      >
        {detail}
      </Text>
    </View>
    <MaterialCommunityIcons
      name="chevron-right"
      size={24}
      color={Colors.blackColor}
      style={{ alignSelf: "center" }}
    />
  </TouchableOpacity>
);

// --- MAIN PROFILE SCREEN ---

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { profileData, fetchProfileDetails, clearProfileData } = useProfile();
  const [showLogoutDialog, setshowLogoutDialog] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchProfileDetails();
    }
  }, [isFocused]);

  const avatarUrl = profileData?.profile_photo
    ? profileData.profile_photo.startsWith("http")
      ? profileData.profile_photo
      : `http://${API_HOST}${profileData.profile_photo}`
    : null;

  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        <Header />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Identity Row */}
          <View style={styles.profileIdentityRow}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("../../../assets/images/user/user1.jpeg")
              }
              style={styles.avatarImage}
            />
            <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding + 3.0 }}>
              <Text style={{ ...Fonts.blackColor17SemiBold }}>
                {profileData?.full_name || "Loading..."}
              </Text>
              <Text style={{ ...Fonts.grayColor16SemiBold }}>
                {profileData?.email || ""}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="square-edit-outline"
              color={Colors.secondaryColor}
              size={24}
              onPress={() => {
                navigation.push("editProfile/editProfileScreen");
              }}
            />
          </View>

          {/* Metadata Grid Cards */}
          {profileData && (
            <View style={styles.detailsCard}>
              {profileData.phone_number && (
                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.grayColor} />
                  <Text style={styles.detailsText}>{profileData.phone_number}</Text>
                </View>
              )}
              
              <View style={styles.detailsRow}>
                <MaterialCommunityIcons name="star" size={16} color={Colors.secondaryColor} />
                <Text style={styles.detailsText}>
                  {Number(profileData.average_rating || 0).toFixed(1)} rating ({profileData.total_ratings || 0} ratings)
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <MaterialCommunityIcons
                  name={profileData.is_verified ? "shield-check" : "shield-alert-outline"}
                  size={16}
                  color={profileData.is_verified ? Colors.greenColor : Colors.redColor}
                />
                <Text style={styles.detailsText}>
                  {profileData.is_verified 
                    ? "Verified account" 
                    : `KYC: ${profileData.kyc_status ? profileData.kyc_status.replaceAll("_", " ") : "Pending"}`
                  }
                </Text>
              </View>

              {profileData.user_type && (
                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons name="account-outline" size={16} color={Colors.grayColor} />
                  <Text style={styles.detailsText}>
                    {profileData.user_type.charAt(0).toUpperCase() + profileData.user_type.slice(1)}
                  </Text>
                </View>
              )}

              {memberSince && (
                <View style={styles.detailsRow}>
                  <MaterialCommunityIcons name="calendar-outline" size={16} color={Colors.grayColor} />
                  <Text style={styles.detailsText}>Member since {memberSince}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Navigation Options List */}
          <View style={styles.optionsWrapper}>
            <ProfileOptionItem
              icon="car-outline"
              option="My vehicle"
              detail="Add vehicle information"
              onPress={() => navigation.push("userVehicles/userVehiclesScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="history"
              option="Ride history"
              detail="See your ride history"
              onPress={() => navigation.push("rideHistory/rideHistoryScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="text-box-outline"
              option="Terms and condition"
              detail="Know our terms and condition"
              onPress={() => navigation.push("termsAndConditions/termsAndConditionsScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="shield-alert-outline"
              option="Privacy policy"
              detail="Know our policy"
              onPress={() => navigation.push("privacyPolicy/privacyPolicyScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="help-circle-outline"
              option="FAQs"
              detail="Get your question answer"
              onPress={() => navigation.push("faq/faqScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="headphones"
              option="Customer support"
              detail="Connect us for any issue"
              onPress={() => navigation.push("customerSupport/customerSupportScreen")}
            />
            <Divider />
            <ProfileOptionItem
              icon="logout-variant"
              option="Logout"
              detail="Logout your account"
              isRed={true}
              onPress={() => setshowLogoutDialog(true)}
            />
          </View>
        </ScrollView>
      </View>

      {/* Logout Prompt Backdrop Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutDialog}
        onRequestClose={() => setshowLogoutDialog(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setshowLogoutDialog(false)}
          style={styles.modalBackdrop}
        >
          <View style={{ justifyContent: "center", flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.dialogStyle}
            >
              <View style={styles.dialogTextContainer}>
                <Text style={{ ...Fonts.blackColor16SemiBold, textAlign: "center" }}>
                  Are you sure you want to logout this account?
                </Text>
              </View>
              <View style={styles.dialogActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setshowLogoutDialog(false)}
                  style={styles.dialogButton}
                >
                  <Text style={{ ...Fonts.whiteColor18SemiBold }}>No</Text>
                </TouchableOpacity>
                <View style={styles.dialogButtonSeparator} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleLogout}
                  style={styles.dialogButton}
                >
                  <Text style={{ ...Fonts.whiteColor18SemiBold }}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

// --- OPTIMIZED CLEAN STYLESHEET ---

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.primaryColor,
    padding: Sizes.fixPadding * 2.0,
  },
  profileIdentityRow: {
    ...CommonStyles.rowAlignCenter,
    margin: Sizes.fixPadding * 2.0,
  },
  avatarImage: { 
    width: 70.0, 
    height: 70.0, 
    borderRadius: 35.0 
  },
  dividerStyle: {
    backgroundColor: Colors.lightGrayColor,
    height: 1.0,
    marginVertical: Sizes.fixPadding * 2.0,
  },
  optionsWrapper: {
    backgroundColor: Colors.whiteColor,
    padding: Sizes.fixPadding * 2.0,
  },
  detailsCard: {
    backgroundColor: Colors.whiteColor,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Sizes.fixPadding - 5.0,
  },
  detailsText: {
    ...Fonts.grayColor14Medium,
    marginLeft: Sizes.fixPadding,
  },
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  dialogTextContainer: {
    marginVertical: Sizes.fixPadding * 2.5,
    marginHorizontal: Sizes.fixPadding * 2.0,
  },
  dialogActionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  dialogButtonSeparator: { 
    backgroundColor: Colors.whiteColor, 
    width: 2.0,
    alignSelf: 'stretch'
  },
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
    alignSelf: "center",
    backgroundColor: Colors.whiteColor,
  },
});