import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { Snackbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const vehiclesList = [
  {
    id: "1",
    image: require("../../assets/images/vehicle/vehicle1.png"),
    name: "Mercedes-Benz AMG A35",
    capacityOfPerson: 2,
  },
  {
    id: "2",
    image: require("../../assets/images/vehicle/vehicle2.png"),
    name: "Toyota Matrix | KJ 5454 | Black colour",
    capacityOfPerson: 2,
  },
];

const UserVehiclesScreen = () => {

  const navigation = useNavigation();

  const [vehicles, setvehicles] = useState(vehiclesList);
  const [showSnackBar, setShowSnackBar] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"My vehicle"} navigation={navigation} />
        {vehiclesInfo()}
      </View>
      {addButton()}
      {snackBarInfo()}
    </View>
  );

  function snackBarInfo() {
    if (!showSnackBar) return null;
  
    return (
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          right: 20,
          backgroundColor: Colors.blackColor,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ ...Fonts.whiteColor14Medium }}>
          Vehicle Removed
        </Text>
      </View>
    );
  }
  
  function addButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.push("addVehicle/addVehicleScreen");
        }}
        style={styles.addButtonStyle}
      >
        <MaterialIcons name="add" color={Colors.whiteColor} size={40} />
      </TouchableOpacity>
    );
  }

  function deleteVehicle({ id }) {
    const copyData = vehicles;
    const newData = copyData.filter((item) => item.id !== id);
    setShowSnackBar(true);
    setvehicles(newData);
  }

  function vehiclesInfo() {
    const renderItem = ({ item }) => (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginBottom: Sizes.fixPadding * 2.0,
        }}
      >
        <ImageBackground
          source={item.image}
          style={{ width: "100%", height: 178.0 }}
          borderRadius={Sizes.fixPadding}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0)", "rgba(28, 28, 28, 0.5)"]}
            style={styles.vehicleImageOverlay}
          >
            <Ionicons
              name="trash"
              color={Colors.redColor}
              size={20}
              style={{ alignSelf: "flex-end" }}
              onPress={() => {
                deleteVehicle({ id: item.id });
              }}
            />
            <View>
              <Text numberOfLines={1} style={{ ...Fonts.whiteColor15SemiBold }}>
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: Sizes.fixPadding - 8.0,
                  ...Fonts.whiteColor15Medium,
                }}
              >
                {item.capacityOfPerson} person
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
    return (
      <FlatList
        data={vehicles}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Sizes.fixPadding * 2.0,
          paddingBottom: Sizes.fixPadding * 7.0,
        }}
      />
    );
  }
};

export default UserVehiclesScreen;

const styles = StyleSheet.create({
  vehicleImageOverlay: {
    width: "100%",
    height: "100%",
    borderRadius: Sizes.fixPadding,
    justifyContent: "space-between",
    padding: Sizes.fixPadding + 5.0,
  },
  addButtonStyle: {
    position: "absolute",
    bottom: 0,
    width: 52.0,
    height: 52.0,
    borderRadius: 26.0,
    backgroundColor: Colors.secondaryColor,
    alignSelf: "center",
    margin: Sizes.fixPadding * 2.0,
    alignItems: "center",
    justifyContent: "center",
  },
});
