// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   TextInput,
//   TouchableOpacity,
//   Modal,
// } from "react-native";
// import React, { useState } from "react";
// import { Colors, Sizes, Fonts, CommonStyles } from "../../constants/styles";
// import MyStatusBar from "../../components/myStatusBar";
// import Header from "../../components/header";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { useNavigation } from "expo-router";

// const EditProfileScreen = () => {

//   const navigation = useNavigation();

//   const [userName, setuserName] = useState("Johnwilson");
//   const [email, setEmail] = useState("john@mail.com");
//   const [mobileNo, setMobileNo] = useState("+91 1234567890");
//   const [showChangeProfileSheet, setshowChangeProfileSheet] = useState(false);

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <MyStatusBar />
//       <View style={{ flex: 1 }}>
//         <Header title={"Edit profile"} navigation={navigation} />
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           automaticallyAdjustKeyboardInsets={true}
//         >
//           {profilePic()}
//           {userNameInfo()}
//           {emailInfo()}
//           {mobileNoInfo()}
//         </ScrollView>
//       </View>
//       {updateButton()}
//       <View>{changePicSheet()}</View>
//     </View>
//   );

//   function changePicSheet() {
//     return (
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showChangeProfileSheet}
//         onRequestClose={() => { setshowChangeProfileSheet(false); }}
//       >
//         <TouchableOpacity
//           activeOpacity={1}
//           onPress={() => { setshowChangeProfileSheet(false); }}
//           style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
//         >
//           <View style={{ justifyContent: "flex-end", flex: 1 }}>
//             <TouchableOpacity
//               activeOpacity={1}
//               onPress={() => { }}
//             >
//               <View style={{ ...styles.sheetStyle }}>
//                 <Text
//                   style={{
//                     ...Fonts.blackColor18SemiBold,
//                     marginBottom: Sizes.fixPadding,
//                   }}
//                 >
//                   Change profile image
//                 </Text>
//                 {chagePicOptionSort({
//                   icon: "camera-alt",
//                   option: "Camera",
//                   color: Colors.primaryColor,
//                 })}
//                 {chagePicOptionSort({
//                   icon: "photo",
//                   option: "Gallery",
//                   color: Colors.greenColor,
//                 })}
//                 {chagePicOptionSort({
//                   icon: "delete",
//                   option: "Remove image",
//                   color: Colors.redColor,
//                 })}
//               </View>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     );
//   }

//   function chagePicOptionSort({ icon, option, color }) {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={() => {
//           setshowChangeProfileSheet(false);
//         }}
//         style={{
//           ...CommonStyles.rowAlignCenter,
//           marginVertical: Sizes.fixPadding,
//         }}
//       >
//         <View style={styles.circle40}>
//           <MaterialIcons name={icon} color={color} size={22} />
//         </View>
//         <Text
//           numberOfLines={1}
//           style={{
//             ...Fonts.blackColor16Medium,
//             flex: 1,
//             marginLeft: Sizes.fixPadding + 5.0,
//           }}
//         >
//           {option}
//         </Text>
//       </TouchableOpacity>
//     );
//   }

//   function updateButton() {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={() => { navigation.pop() }}
//         style={{ ...CommonStyles.button, margin: Sizes.fixPadding * 2.0 }}
//       >
//         <Text style={{ ...Fonts.whiteColor18Bold }}>Update</Text>
//       </TouchableOpacity>
//     );
//   }

//   function mobileNoInfo() {
//     return (
//       <View style={{ margin: Sizes.fixPadding * 2.0 }}>
//         <Text style={{ ...Fonts.blackColor15SemiBold }}>Mobile number</Text>
//         <TextInput
//           placeholder="Enter Mobile number"
//           style={styles.textFieldStyle}
//           value={mobileNo}
//           onChangeText={(value) => setMobileNo(value)}
//           placeholderTextColor={Colors.grayColor}
//           cursorColor={Colors.primaryColor}
//           selectionColor={Colors.primaryColor}
//           keyboardType="phone-pad"
//           numberOfLines={1}
//         />
//       </View>
//     );
//   }

//   function emailInfo() {
//     return (
//       <View
//         style={{
//           marginHorizontal: Sizes.fixPadding * 2.0,
//           marginVertical: Sizes.fixPadding,
//         }}
//       >
//         <Text style={{ ...Fonts.blackColor15SemiBold }}>Email address</Text>
//         <TextInput
//           placeholder="Enter Email address"
//           style={styles.textFieldStyle}
//           value={email}
//           onChangeText={(value) => setEmail(value)}
//           placeholderTextColor={Colors.grayColor}
//           cursorColor={Colors.primaryColor}
//           selectionColor={Colors.primaryColor}
//           keyboardType="email-address"
//           numberOfLines={1}
//         />
//       </View>
//     );
//   }

//   function userNameInfo() {
//     return (
//       <View style={{ margin: Sizes.fixPadding * 2.0 }}>
//         <Text style={{ ...Fonts.blackColor15SemiBold }}>User name</Text>
//         <TextInput
//           placeholder="Enter User name"
//           style={styles.textFieldStyle}
//           value={userName}
//           onChangeText={(value) => setuserName(value)}
//           placeholderTextColor={Colors.grayColor}
//           cursorColor={Colors.primaryColor}
//           selectionColor={Colors.primaryColor}
//           numberOfLines={1}
//         />
//       </View>
//     );
//   }

//   function profilePic() {
//     return (
//       <View style={styles.profilePicWrapper}>
//         <Image
//           source={require("../../assets/images/user/user1.jpeg")}
//           style={{ width: 100.0, height: 100.0, borderRadius: 50.0 }}
//         />
//         <TouchableOpacity
//           activeOpacity={0.9}
//           onPress={() => {
//             setshowChangeProfileSheet(true);
//           }}
//           style={styles.changePhotoCircleWrapper}
//         >
//           <Ionicons
//             name="camera-outline"
//             color={Colors.secondaryColor}
//             size={20}
//           />
//         </TouchableOpacity>
//       </View>
//     );
//   }
// };

// export default EditProfileScreen;

// const styles = StyleSheet.create({
//   sheetStyle: {
//     backgroundColor: Colors.whiteColor,
//     borderTopLeftRadius: Sizes.fixPadding * 2.0,
//     borderTopRightRadius: Sizes.fixPadding * 2.0,
//     paddingTop: Sizes.fixPadding * 2.5,
//     paddingHorizontal: Sizes.fixPadding * 2.0,
//     paddingBottom: Sizes.fixPadding * 1.5
//   },
//   changePhotoCircleWrapper: {
//     width: 40.0,
//     height: 40.0,
//     borderRadius: 20.0,
//     backgroundColor: Colors.bodyBackColor,
//     position: "absolute",
//     right: -5.0,
//     bottom: -5.0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   profilePicWrapper: {
//     alignItems: "center",
//     justifyContent: "center",
//     margin: Sizes.fixPadding * 3.0,
//     alignSelf: "center",
//   },
//   textFieldStyle: {
//     ...Fonts.blackColor15Medium,
//     marginTop: Sizes.fixPadding - 2.0,
//     padding: 0,
//     paddingBottom: Sizes.fixPadding - 5.0,
//     borderBottomColor: Colors.lightGrayColor,
//     borderBottomWidth: 1.0,
//   },
//   circle40: {
//     width: 40.0,
//     height: 40.0,
//     borderRadius: 20.0,
//     backgroundColor: Colors.whiteColor,
//     ...CommonStyles.shadow,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Colors, Sizes, Fonts, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api";
import { useProfile } from "../context/ProfileContext";
import SOSButton from "../../components/SOSbutton";

const EditProfileScreen = () => {
  const navigation = useNavigation();
  
  // Consume data context and profile updates hook
  const { profileData, setProfileData, fetchProfileDetails } = useProfile();

  // Form Inputs local states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  
  // Interface interaction control properties
  const [showChangeProfileSheet, setshowChangeProfileSheet] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // Sync profileData attributes into form variables cleanly upon component render
  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
      setEmail(profileData.email || "");
      setMobileNo(profileData.phone_number || "");
      setSelectedImageUri(profileData.profile_photo || null);
    }
  }, [profileData]);

  // Image Selection 1: Activate device native camera instance
  const handleTakeFromCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert("Permission Denied", "Camera hardware access is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        setIsImageDeleted(false);
      }
    } catch (err) {
      console.log("❌ Camera execution error:", err);
    } finally {
      setshowChangeProfileSheet(false);
    }
  };

  // Image Selection 2: Open native storage picker layout
  const handleChooseFromGallery = async () => {
    try {
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!galleryPermission.granted) {
        Alert.alert("Permission Denied", "Media folder permissions are required to select photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        setIsImageDeleted(false);
      }
    } catch (err) {
      console.log("❌ Gallery access processing fault:", err);
    } finally {
      setshowChangeProfileSheet(false);
    }
  };

  // Image Selection 3: Handle image removal
  const handleRemoveImage = () => {
    setSelectedImageUri(null);
    setIsImageDeleted(true);
    setshowChangeProfileSheet(false);
  };

  // Submit Text attributes modifications alongside updated asset buffers
  const handleProfileUpdateSubmit = async () => {
    try {
      setIsUpdating(true);

      // Instantiating standard MultiPart configuration multi-segment payloads
      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);

      // Profile validation for backend storage file processing logic
      if (isImageDeleted) {
        // If user deleted the photo, pass an empty string to clear out the ImageField
        formData.append("profile_photo", "");
      } else if (selectedImageUri && selectedImageUri !== profileData?.profile_photo) {
        // Resolve filename extension from localized device context paths string mappings
        const localUriFilename = selectedImageUri.split("/").pop();
        const extensionMatches = /\.(\w+)$/.exec(localUriFilename);
        const resolvedMimeType = extensionMatches ? `image/${extensionMatches[1]}` : `image/jpeg`;

        formData.append("profile_photo", {
          uri: selectedImageUri,
          name: localUriFilename || "profile_avatar.jpg",
          type: resolvedMimeType,
        });
      }

      // Execute updates using standard patch requests on the profile endpoint
      const response = await api.patch("/users/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        // Synchronize updated database values with your global context object state
        setProfileData(response.data);
        Alert.alert("Success", "Your profile details have been securely updated.");
        navigation.pop();
      }
    } catch (error) {
      console.log("❌ Profile update failed:", error.response?.data || error.message);
      Alert.alert("Error", "Could not complete the request. Ensure inputs are valid.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Edit profile"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {profilePic()}
          {firstNameInfo()}
          {lastNameInfo()}
          {emailInfo()}
          {mobileNoInfo()}
        </ScrollView>
      </View>
      {updateButton()}
      <View>{changePicSheet()}</View>
    </View>
  );

  function changePicSheet() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showChangeProfileSheet}
        onRequestClose={() => { setshowChangeProfileSheet(false); }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowChangeProfileSheet(false); }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity activeOpacity={1} onPress={() => { }}>
              <View style={{ ...styles.sheetStyle }}>
                <Text style={{ ...Fonts.blackColor18SemiBold, marginBottom: Sizes.fixPadding }}>
                  Change profile image
                </Text>
                
                {chagePicOptionSort({
                  icon: "camera-alt",
                  option: "Camera",
                  color: Colors.primaryColor,
                  onPress: handleTakeFromCamera,
                })}
                {chagePicOptionSort({
                  icon: "photo",
                  option: "Gallery",
                  color: Colors.greenColor,
                  onPress: handleChooseFromGallery,
                })}
                {chagePicOptionSort({
                  icon: "delete",
                  option: "Remove image",
                  color: Colors.redColor,
                  onPress: handleRemoveImage,
                })}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function chagePicOptionSort({ icon, option, color, onPress }) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          ...CommonStyles.rowAlignCenter,
          marginVertical: Sizes.fixPadding,
        }}
      >
        <View style={styles.circle40}>
          <MaterialIcons name={icon} color={color} size={22} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            ...Fonts.blackColor16Medium,
            flex: 1,
            marginLeft: Sizes.fixPadding + 5.0,
          }}
        >
          {option}
        </Text>
      </TouchableOpacity>
    );
  }

  function updateButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleProfileUpdateSubmit}
        disabled={isUpdating}
        style={{ 
          ...CommonStyles.button, 
          margin: Sizes.fixPadding * 2.0,
          backgroundColor: isUpdating ? Colors.secondaryColor : Colors.primaryColor 
        }}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={Colors.whiteColor} />
        ) : (
          <Text style={{ ...Fonts.whiteColor18Bold }}>Update</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Set editable={false} and styled text to make it clear it's read-only
  // Also changed keyboardType to "default" because input cannot be focused
  function mobileNoInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, color: Colors.grayColor }}>
          Mobile number 
        </Text>
        <TextInput
          style={[styles.textFieldStyle, styles.disabledInputStyle]}
          value={mobileNo}
          editable={false} 
          placeholderTextColor={Colors.grayColor}
          numberOfLines={1}
        />
      </View>
    );
  }

  // Set editable={false} and styled text to make it clear it's read-only
  // Also changed keyboardType to "default" because input cannot be focused
  function emailInfo() {
    return (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginVertical: Sizes.fixPadding,
        }}
      >
        <Text style={{ ...Fonts.blackColor15SemiBold, color: Colors.grayColor }}>
          Email address 
        </Text>
        <TextInput
          style={[styles.textFieldStyle, styles.disabledInputStyle]}
          value={email}
          editable={false} 
          placeholderTextColor={Colors.grayColor}
          numberOfLines={1}
        />
      </View>
    );
  }

  function firstNameInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.blackColor15SemiBold }}>First name</Text>
        <TextInput
          placeholder="Enter First name"
          style={styles.textFieldStyle}
          value={firstName}
          onChangeText={(value) => setFirstName(value)}
          placeholderTextColor={Colors.grayColor}
          cursorColor={Colors.primaryColor}
          selectionColor={Colors.primaryColor}
          numberOfLines={1}
        />
      </View>
    );
  }

  function lastNameInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.blackColor15SemiBold }}>Last name</Text>
        <TextInput
          placeholder="Enter Last name"
          style={styles.textFieldStyle}
          value={lastName}
          onChangeText={(value) => setLastName(value)}
          placeholderTextColor={Colors.grayColor}
          cursorColor={Colors.primaryColor}
          selectionColor={Colors.primaryColor}
          numberOfLines={1}
        />
      </View>
    );
  }

  function profilePic() {
    // Determine avatar image source based on selected states or fallback placeholders
    const dynamicImageSource = selectedImageUri 
      ? { uri: selectedImageUri } 
      : require("../../assets/images/user/user1.jpeg");

    return (
      <View style={styles.profilePicWrapper}>
        <Image
          source={dynamicImageSource}
          style={{ width: 100.0, height: 100.0, borderRadius: 50.0 }}
        />
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setshowChangeProfileSheet(true);
          }}
          style={styles.changePhotoCircleWrapper}
        >
          <Ionicons
            name="camera-outline"
            color={Colors.secondaryColor}
            size={20}
          />
        </TouchableOpacity>
      </View>
    );
  }
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  sheetStyle: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 2.0,
    borderTopRightRadius: Sizes.fixPadding * 2.0,
    paddingTop: Sizes.fixPadding * 2.5,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingBottom: Sizes.fixPadding * 1.5
  },
  changePhotoCircleWrapper: {
    width: 40.0,
    height: 40.0,
    borderRadius: 20.0,
    backgroundColor: Colors.bodyBackColor,
    position: "absolute",
    right: -5.0,
    bottom: -5.0,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePicWrapper: {
    alignItems: "center",
    justifyContent: "center",
    margin: Sizes.fixPadding * 3.0,
    alignSelf: "center",
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    marginTop: Sizes.fixPadding - 2.0,
    padding: 0,
    paddingBottom: Sizes.fixPadding - 5.0,
    borderBottomColor: Colors.lightGrayColor,
    borderBottomWidth: 1.0,
  },
  disabledInputStyle: {
    color: "#a0a0a0", // Visually tint read-only properties
    borderBottomColor: "#e5e5e5",
  },
  circle40: {
    width: 40.0,
    height: 40.0,
    borderRadius: 20.0,
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.shadow,
    alignItems: "center",
    justifyContent: "center",
  },
});