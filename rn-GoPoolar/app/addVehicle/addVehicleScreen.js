import {
  ScrollView,
  StyleSheet,
  Text,
  View,
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

const AddVehicleScreen = () => {

  const navigation = useNavigation();

  const [vehicleName, setvehicleName] = useState("");
  const [vehicleType, setvehicleType] = useState("");
  const [regNo, setregNo] = useState("");
  const [color, setcolor] = useState("");
  const [seat, setseat] = useState("");
  const [facility, setfacility] = useState("");
  const [showVehicleImageSheet, setshowVehicleImageSheet] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Add vehicle"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {vehicleImageInfo()}
          {vehicleNameInfo()}
          {vehicleTypeInfo()}
          {registerNoInfo()}
          {vehicleColorInfo()}
          {seatOfferingInfo()}
          {facilitiesInfo()}
        </ScrollView>
      </View>
      {addButton()}
      <View>{changePicSheet()}</View>
    </View>
  );

  function changePicSheet() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVehicleImageSheet}
        onRequestClose={() => { setshowVehicleImageSheet(false); }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowVehicleImageSheet(false); }}
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
                  Add image
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
          setshowVehicleImageSheet(false);
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

  function addButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { navigation.pop() }}
        style={{
          ...CommonStyles.button,
          marginVertical: Sizes.fixPadding * 2.0,
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Add</Text>
      </TouchableOpacity>
    );
  }

  function facilitiesInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Facilities(i.e. AC, music)
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter facilities"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={facility}
            onChangeText={(value) => setfacility(value)}
          />
        </View>
      </View>
    );
  }

  function seatOfferingInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Seat offering
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter available seat"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            keyboardType="numeric"
            value={seat}
            onChangeText={(value) => setseat(value)}
          />
        </View>
      </View>
    );
  }

  function vehicleColorInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Vehicle colour
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter vehicle colour"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={color}
            onChangeText={(value) => setcolor(value)}
          />
        </View>
      </View>
    );
  }

  function registerNoInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Vehicle reg. number
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter vehicle reg.number"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={regNo}
            onChangeText={(value) => setregNo(value)}
          />
        </View>
      </View>
    );
  }

  function vehicleTypeInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Vehicle type
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter vehicle type"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={vehicleType}
            onChangeText={(value) => setvehicleType(value)}
          />
        </View>
      </View>
    );
  }

  function vehicleNameInfo() {
    return (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginTop: Sizes.fixPadding,
        }}
      >
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Vehicle name
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter vehicle name"
            style={styles.textFieldStyle}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            value={vehicleName}
            onChangeText={(value) => setvehicleName(value)}
          />
        </View>
      </View>
    );
  }

  function vehicleImageInfo() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setshowVehicleImageSheet(true)}
        style={styles.vehicleImageWrapper}
      >
        <Ionicons name="camera-outline" color={Colors.grayColor} size={35} />
        <Text
          numberOfLines={1}
          style={{
            ...Fonts.grayColor14SemiBold,
            marginTop: Sizes.fixPadding - 5.0,
          }}
        >
          Add vehicle image
        </Text>
      </TouchableOpacity>
    );
  }
};

export default AddVehicleScreen;

const styles = StyleSheet.create({
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
  },
  textFieldStyle: {
    ...Fonts.blackColor15Medium,
    height: 20.0,
    padding: 0,
  },
  vehicleImageWrapper: {
    backgroundColor: "#E7E7E7",
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 4.0,
    margin: Sizes.fixPadding * 2.0,
    alignItems: "center",
  },
  sheetStyle: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 2.0,
    borderTopRightRadius: Sizes.fixPadding * 2.0,
    paddingTop: Sizes.fixPadding * 2.5,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingBottom: Sizes.fixPadding * 1.5,
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
