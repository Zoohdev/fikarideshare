// import {
//   StyleSheet,
//   Text,
//   View,
//   FlatList,
//   ImageBackground,
//   TouchableOpacity,
// } from "react-native";
// import React, { useState } from "react";
// import { Colors, Fonts, Sizes } from "../../constants/styles";
// import MyStatusBar from "../../components/myStatusBar";
// import Header from "../../components/header";
// import { LinearGradient } from "expo-linear-gradient";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// // import { Snackbar } from "react-native-paper";
// import { useNavigation } from "@react-navigation/native";

// const vehiclesList = [
//   {
//     id: "1",
//     image: require("../../assets/images/vehicle/vehicle1.png"),
//     name: "Mercedes-Benz AMG A35",
//     capacityOfPerson: 2,
//   },
//   {
//     id: "2",
//     image: require("../../assets/images/vehicle/vehicle2.png"),
//     name: "Toyota Matrix | KJ 5454 | Black colour",
//     capacityOfPerson: 2,
//   },
// ];

// const UserVehiclesScreen = () => {

//   const navigation = useNavigation();

//   const [vehicles, setvehicles] = useState(vehiclesList);
//   const [showSnackBar, setShowSnackBar] = useState(false);

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <MyStatusBar />
//       <View style={{ flex: 1 }}>
//         <Header title={"My vehicle"} navigation={navigation} />
//         {vehiclesInfo()}
//       </View>
//       {addButton()}
//       {snackBarInfo()}
//     </View>
//   );

//   function snackBarInfo() {
//     if (!showSnackBar) return null;
  
//     return (
//       <View
//         style={{
//           position: "absolute",
//           bottom: 30,
//           left: 20,
//           right: 20,
//           backgroundColor: Colors.blackColor,
//           padding: 12,
//           borderRadius: 8,
//           alignItems: "center",
//         }}
//       >
//         <Text style={{ ...Fonts.whiteColor14Medium }}>
//           Vehicle Removed
//         </Text>
//       </View>
//     );
//   }
  
//   function addButton() {
//     return (
//       <TouchableOpacity
//         activeOpacity={0.8}
//         onPress={() => {
//           navigation.push("addVehicle/addVehicleScreen");
//         }}
//         style={styles.addButtonStyle}
//       >
//         <MaterialIcons name="add" color={Colors.whiteColor} size={40} />
//       </TouchableOpacity>
//     );
//   }

//   function deleteVehicle({ id }) {
//     const copyData = vehicles;
//     const newData = copyData.filter((item) => item.id !== id);
//     setShowSnackBar(true);
//     setvehicles(newData);
//   }

//   function vehiclesInfo() {
//     const renderItem = ({ item }) => (
//       <View
//         style={{
//           marginHorizontal: Sizes.fixPadding * 2.0,
//           marginBottom: Sizes.fixPadding * 2.0,
//         }}
//       >
//         <ImageBackground
//           source={item.image}
//           style={{ width: "100%", height: 178.0 }}
//           borderRadius={Sizes.fixPadding}
//         >
//           <LinearGradient
//             colors={["rgba(255, 255, 255, 0)", "rgba(28, 28, 28, 0.5)"]}
//             style={styles.vehicleImageOverlay}
//           >
//             <Ionicons
//               name="trash"
//               color={Colors.redColor}
//               size={20}
//               style={{ alignSelf: "flex-end" }}
//               onPress={() => {
//                 deleteVehicle({ id: item.id });
//               }}
//             />
//             <View>
//               <Text numberOfLines={1} style={{ ...Fonts.whiteColor15SemiBold }}>
//                 {item.name}
//               </Text>
//               <Text
//                 numberOfLines={1}
//                 style={{
//                   marginTop: Sizes.fixPadding - 8.0,
//                   ...Fonts.whiteColor15Medium,
//                 }}
//               >
//                 {item.capacityOfPerson} person
//               </Text>
//             </View>
//           </LinearGradient>
//         </ImageBackground>
//       </View>
//     );
//     return (
//       <FlatList
//         data={vehicles}
//         keyExtractor={(item) => `${item.id}`}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{
//           paddingTop: Sizes.fixPadding * 2.0,
//           paddingBottom: Sizes.fixPadding * 7.0,
//         }}
//       />
//     );
//   }
// };

// export default UserVehiclesScreen;

// const styles = StyleSheet.create({
//   vehicleImageOverlay: {
//     width: "100%",
//     height: "100%",
//     borderRadius: Sizes.fixPadding,
//     justifyContent: "space-between",
//     padding: Sizes.fixPadding + 5.0,
//   },
//   addButtonStyle: {
//     position: "absolute",
//     bottom: 0,
//     width: 52.0,
//     height: 52.0,
//     borderRadius: 26.0,
//     backgroundColor: Colors.secondaryColor,
//     alignSelf: "center",
//     margin: Sizes.fixPadding * 2.0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import api from "../../services/api";

const UserVehiclesScreen = () => {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchUserVehicles();
    }, [])
  );

  const fetchUserVehicles = async () => {
    try {
      const response = await api.get("/vehicles/garage/");
      
      // Check if data is paginated or nested
      const data = response.data.results ? response.data.results : response.data;
      console.log("API Response:", response.data);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error details:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to retrieve your vehicles.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVehicle = async (id) => {
    try {
      await api.delete(`/vehicles/garage/${id}/`);
      setVehicles((prev) => prev.filter((item) => item.id !== id));
      Alert.alert("Success", "Vehicle removed from your garage.");
    } catch (error) {
      Alert.alert("Error", "Failed to delete vehicle registration.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"My Garage"} navigation={navigation} />
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : (
          vehiclesInfo()
        )}
      </View>
      {addButton()}
    </View>
  );

  function addButton() {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("addVehicle/addVehicleScreen")} style={styles.addButtonStyle}>
        <MaterialIcons name="add" color={Colors.whiteColor} size={40} />
      </TouchableOpacity>
    );
  }

  function vehiclesInfo() {
    if (vehicles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-sport-outline" size={80} color={"#D0D0D0"} />
          <Text style={{ ...Fonts.grayColor16Medium, marginTop: Sizes.fixPadding }}>No vehicles registered yet.</Text>
        </View>
      );
    }

    const renderItem = ({ item }) => {
      const hasPhoto = !!item.photo_front;
      const cardSource = hasPhoto ? { uri: item.photo_front } : null;

      return (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("userVehicles/vehicleDetailScreen", { vehicleId: item.id })}
          >
            <ImageBackground source={cardSource} style={[styles.imageBackground, !hasPhoto && { backgroundColor: "#FFFFFF" }]} borderRadius={Sizes.fixPadding}>
              <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.9)"]} style={styles.vehicleImageOverlay}>
                
                <View style={styles.topRow}>
                  <View style={[styles.statusBadge, { backgroundColor: item.dekra_status === 'approved' ? Colors.greenColor : Colors.secondaryColor }]}>
                    <Text style={styles.badgeText}>{item.dekra_status?.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.deleteButtonBox}
                    onPress={() => {
                      Alert.alert("Remove Vehicle", "Are you sure you want to delete this vehicle?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteVehicle(item.id) }
                      ]);
                    }}
                  >
                    <Ionicons name="trash" color={Colors.redColor} size={18} />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text numberOfLines={1} style={{ ...Fonts.whiteColor18Bold }}>{item.make} {item.model} ({item.year})</Text>
                  <Text numberOfLines={1} style={{ ...Fonts.whiteColor14Medium, opacity: 0.8, marginTop: 4 }}>
                    Plate: {item.license_plate}  |  {item.color}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <FlatList
        data={vehicles}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Sizes.fixPadding * 2.0, paddingBottom: Sizes.fixPadding * 10.0 }}
      />
    );
  }
};

export default UserVehiclesScreen;

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 0.8, justifyContent: "center", alignItems: "center" },
  cardContainer: { marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding * 2.0, borderRadius: Sizes.fixPadding, elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  imageBackground: { width: "100%", height: 200.0 },
  vehicleImageOverlay: { width: "100%", height: "100%", borderRadius: Sizes.fixPadding, justifyContent: "space-between", padding: Sizes.fixPadding * 1.5 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  deleteButtonBox: { backgroundColor: "rgba(255,255,255,0.9)", padding: 8, borderRadius: 20 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "bold", color: Colors.whiteColor },
  addButtonStyle: { position: "absolute", bottom: 20, right: 20, width: 60.0, height: 60.0, borderRadius: 30.0, backgroundColor: Colors.primaryColor, alignItems: "center", justifyContent: "center", elevation: 8 },
});