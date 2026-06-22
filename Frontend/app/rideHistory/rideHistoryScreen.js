import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import DashedLine from "react-native-dashed-line";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "expo-router";

const ridesList = [
  {
    id: "1",
    profile: require("../../assets/images/user/user17.png"),
    name: "Savannah Nguyen",
    date: "18 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "2",
    profile: require("../../assets/images/user/user16.png"),
    name: "Leslie Alexander",
    date: "18 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "3",
    profile: require("../../assets/images/user/user2.png"),
    name: "Guy Hawkins",
    date: "19 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "4",
    profile: require("../../assets/images/user/user3.png"),
    name: "Devon Lane",
    date: "20 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "5",
    profile: require("../../assets/images/user/user8.png"),
    name: "Jenny wilsom",
    date: "20 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "6",
    profile: require("../../assets/images/user/user14.png"),
    name: "Ralph Edwards",
    date: "21 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "7",
    profile: require("../../assets/images/user/user13.png"),
    name: "Albert Flores",
    date: "21 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
  {
    id: "8",
    profile: require("../../assets/images/user/user15.png"),
    name: "Jerome Bell",
    date: "22 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
  },
];

const RideHistoryScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Ride history"} navigation={navigation} />
        {ridesInfo()}
      </View>
    </View>
  );

  function ridesInfo() {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.push("historyRideDetail/historyRideDetailScreen");
        }}
        style={styles.rideWrapper}
      >
        <Image
          source={item.profile}
          style={{
            width: 82.0,
            height: 82.0,
            borderRadius: Sizes.fixPadding - 5.0,
          }}
        />
        <View style={styles.rideDetailWrapper}>
          <Text style={{ ...Fonts.blackColor15SemiBold }}>{item.name}</Text>

          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <Ionicons
              name="calendar-outline"
              color={Colors.blackColor}
              size={14}
            />
            <Text
              numberOfLines={1}
              style={{
                maxWidth: "50%",
                ...Fonts.blackColor12Medium,
                marginLeft: Sizes.fixPadding - 5.0,
              }}
            >
              {item.date}
            </Text>
            <View style={styles.dateTimeDivider}></View>
            <Ionicons name="time-outline" color={Colors.blackColor} size={14} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                ...Fonts.blackColor12Medium,
                marginLeft: Sizes.fixPadding - 5.0,
              }}
            >
              {item.time}
            </Text>
          </View>

          <View>
            <View style={{ ...CommonStyles.rowAlignCenter }}>
              <View
                style={{
                  ...styles.locationIconWrapper,
                  borderColor: Colors.greenColor,
                }}
              >
                <MaterialIcons
                  name="location-pin"
                  color={Colors.greenColor}
                  size={7}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  ...Fonts.grayColor12Medium,
                  marginLeft: Sizes.fixPadding,
                }}
              >
                {item.pickup}
              </Text>
            </View>

            <DashedLine
              axis="vertical"
              dashLength={2}
              dashThickness={1}
              dashGap={1.5}
              dashColor={Colors.grayColor}
              style={{
                height: 5.0,
                marginLeft: Sizes.fixPadding - 4.0,
              }}
            />

            <View style={{ ...CommonStyles.rowAlignCenter }}>
              <View
                style={{
                  ...styles.locationIconWrapper,
                  borderColor: Colors.redColor,
                }}
              >
                <MaterialIcons
                  name="location-pin"
                  color={Colors.redColor}
                  size={7}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  ...Fonts.grayColor12Medium,
                  marginLeft: Sizes.fixPadding,
                }}
              >
                {item.drop}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
    return (
      <FlatList
        data={ridesList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Sizes.fixPadding * 2.0 }}
      />
    );
  }
};

export default RideHistoryScreen;

const styles = StyleSheet.create({
  rideDetailWrapper: {
    flex: 1,
    marginLeft: Sizes.fixPadding,
    height: 82.0,
    justifyContent: "space-between",
  },
  rideWrapper: {
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.rowAlignCenter,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  locationIconWrapper: {
    width: 12.0,
    height: 12.0,
    borderRadius: 6.0,
    borderWidth: 1.0,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeDivider: {
    marginHorizontal: Sizes.fixPadding - 5.0,
    width: 1.0,
    backgroundColor: Colors.blackColor,
    height: "100%",
  },
});
