import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { Colors, Sizes, Fonts, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";

const EditProfileScreen = () => {

  const navigation = useNavigation();

  const [userName, setuserName] = useState("Johnwilson");
  const [email, setEmail] = useState("john@mail.com");
  const [mobileNo, setMobileNo] = useState("+91 1234567890");
  const [showChangeProfileSheet, setshowChangeProfileSheet] = useState(false);

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
          {userNameInfo()}
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
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
            >
              <View style={{ ...styles.sheetStyle }}>
                <Text
                  style={{
                    ...Fonts.blackColor18SemiBold,
                    marginBottom: Sizes.fixPadding,
                  }}
                >
                  Change profile image
                </Text>
                {chagePicOptionSort({
                  icon: "camera-alt",
                  option: "Camera",
                  color: Colors.primaryColor,
                })}
                {chagePicOptionSort({
                  icon: "photo",
                  option: "Gallery",
                  color: Colors.greenColor,
                })}
                {chagePicOptionSort({
                  icon: "delete",
                  option: "Remove image",
                  color: Colors.redColor,
                })}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function chagePicOptionSort({ icon, option, color }) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setshowChangeProfileSheet(false);
        }}
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
        onPress={() => { navigation.pop() }}
        style={{ ...CommonStyles.button, margin: Sizes.fixPadding * 2.0 }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Update</Text>
      </TouchableOpacity>
    );
  }

  function mobileNoInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.blackColor15SemiBold }}>Mobile number</Text>
        <TextInput
          placeholder="Enter Mobile number"
          style={styles.textFieldStyle}
          value={mobileNo}
          onChangeText={(value) => setMobileNo(value)}
          placeholderTextColor={Colors.grayColor}
          cursorColor={Colors.primaryColor}
          selectionColor={Colors.primaryColor}
          keyboardType="phone-pad"
          numberOfLines={1}
        />
      </View>
    );
  }

  function emailInfo() {
    return (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginVertical: Sizes.fixPadding,
        }}
      >
        <Text style={{ ...Fonts.blackColor15SemiBold }}>Email address</Text>
        <TextInput
          placeholder="Enter Email address"
          style={styles.textFieldStyle}
          value={email}
          onChangeText={(value) => setEmail(value)}
          placeholderTextColor={Colors.grayColor}
          cursorColor={Colors.primaryColor}
          selectionColor={Colors.primaryColor}
          keyboardType="email-address"
          numberOfLines={1}
        />
      </View>
    );
  }

  function userNameInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.blackColor15SemiBold }}>User name</Text>
        <TextInput
          placeholder="Enter User name"
          style={styles.textFieldStyle}
          value={userName}
          onChangeText={(value) => setuserName(value)}
          placeholderTextColor={Colors.grayColor}
          cursorColor={Colors.primaryColor}
          selectionColor={Colors.primaryColor}
          numberOfLines={1}
        />
      </View>
    );
  }

  function profilePic() {
    return (
      <View style={styles.profilePicWrapper}>
        <Image
          source={require("../../assets/images/user/user1.jpeg")}
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
