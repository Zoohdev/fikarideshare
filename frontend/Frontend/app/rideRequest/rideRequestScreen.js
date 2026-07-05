import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../constants/styles";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import DashedLine from "react-native-dashed-line";
import { useNavigation } from "expo-router";

const requestUsers = [
  {
    id: "1",
    profile: require("../../assets/images/user/user3.png"),
    name: "Leslie Alexander",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    amount: "$13.50",
    seat: 1,
  },
  {
    id: "2",
    profile: require("../../assets/images/user/user2.png"),
    name: "Albert Flores",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    amount: "$15.50",
    seat: 1,
  },
  {
    id: "3",
    profile: require("../../assets/images/user/user15.png"),
    name: "Annette Black",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    amount: "$10.50",
    seat: 1,
  },
  {
    id: "4",
    profile: require("../../assets/images/user/user8.png"),
    name: "Guy Hawkins",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    amount: "$9.50",
    seat: 1,
  },
];

const rideRequestsList = [
  {
    id: "1",
    date: "Today",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    requestCount: 2,
    passengerList: [
      {
        id: "1p",
        profile: require("../../assets/images/user/user3.png"),
        name: "Savannah Nguyen",
      },
      {
        id: "p2",
        profile: require("../../assets/images/user/user2.png"),
        name: "Brooklyn Simmons",
      },
      {
        id: "3p",
        profile: require("../../assets/images/user/user6.png"),
        name: "Savannah Nguyen",
      },
      {
        id: "42",
        profile: require("../../assets/images/user/user17.png"),
        name: "Brooklyn Simmons",
      },
    ],
  },
  {
    id: "2",
    date: "22 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    requestCount: 4,
    passengerList: [
      {
        id: "1p",
        profile: require("../../assets/images/user/user10.png"),
        name: "Savannah Nguyen",
      },
      {
        id: "p2",
        profile: require("../../assets/images/user/user1.jpeg"),
        name: "Brooklyn Simmons",
      },
    ],
  },
  {
    id: "3",
    date: "23 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    requestCount: 1,
    passengerList: [
      {
        id: "1p",
        profile: require("../../assets/images/user/user10.png"),
        name: "Savannah Nguyen",
      },
      {
        id: "p2",
        profile: require("../../assets/images/user/user1.jpeg"),
        name: "Brooklyn Simmons",
      },
      {
        id: "p3",
        profile: require("../../assets/images/user/user9.png"),
        name: "Brooklyn Simmons",
      },
    ],
  },
  {
    id: "4",
    date: "24 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    requestCount: 3,
    passengerList: [
      {
        id: "1p",
        profile: require("../../assets/images/user/user7.png"),
        name: "Savannah Nguyen",
      },
    ],
  },
  {
    id: "5",
    date: "25 jan 2023",
    time: "9:00 am",
    pickup: "Mumbai,2464 Royal Lnord",
    drop: "Pune, 2464 Royal Ln. Mesa",
    requestCount: 2,
    passengerList: [
      {
        id: "1p",
        profile: require("../../assets/images/user/user8.png"),
        name: "Savannah Nguyen",
      },
      {
        id: "p2",
        profile: require("../../assets/images/user/user12.png"),
        name: "Brooklyn Simmons",
      },
      {
        id: "p3",
        profile: require("../../assets/images/user/user5.png"),
        name: "Brooklyn Simmons",
      },
    ],
  },
];

const RideRequestScreen = () => {

  const navigation = useNavigation();

  const [showRequestSheet, setshowRequestSheet] = useState(false);
  const [selectedRequestCount, setselectedRequestCount] = useState();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Request for ride"} navigation={navigation} />
        {requestsInfo()}
      </View>
      {requestSheet()}
    </View>
  );

  function requestSheet() {
    return (     
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRequestSheet}
        onRequestClose={() => { setshowRequestSheet(false); }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowRequestSheet(false); }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
            >
              <View style={{ ...styles.sheetStyle }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Sizes.fixPadding - 5.0 }}>
                  <TouchableWithoutFeedback>
                    <View>
                      {requestUsers.slice(0, selectedRequestCount).map((item) => (
                        <View key={`${item.id}`} style={styles.requestWrapper}>
                          <View style={{ ...CommonStyles.rowAlignCenter }}>
                            <Image
                              source={item.profile}
                              style={{
                                width: 82.0,
                                height: 82.0,
                                borderRadius: Sizes.fixPadding - 5.0,
                              }}
                            />
                            <View style={styles.requestDetailWrapper}>
                              <Text style={{ ...Fonts.blackColor15SemiBold }}>
                                {item.name}
                              </Text>

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
                                    Mumbai,2464 Royal South
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
                                    Pune, 2464 Royal Ln. Mesa
                                  </Text>
                                </View>
                              </View>

                              <Text style={{ ...Fonts.primaryColor15SemiBold }}>
                                {item.amount} ({item.seat} seat)
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              ...CommonStyles.rowAlignCenter,
                              marginTop: Sizes.fixPadding + 2.0,
                            }}
                          >
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setshowRequestSheet(false);
                              }}
                              style={{
                                backgroundColor: Colors.whiteColor,
                                ...styles.sheetButton,
                                marginRight: Sizes.fixPadding,
                              }}
                            >
                              <Text style={{ ...Fonts.primaryColor16SemiBold }}>
                                Decline
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setshowRequestSheet(false);
                                navigation.push("startRide/startRideScreen");
                              }}
                              style={{
                                ...styles.sheetButton,
                                backgroundColor: Colors.secondaryColor,
                                marginLeft: Sizes.fixPadding,
                              }}
                            >
                              <Text style={{ ...Fonts.whiteColor16SemiBold }}>
                                Accepet
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function requestsInfo() {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.push("startRide/startRideScreen")}
        style={styles.requestInfoWrapper}
      >
        <View style={{ flex: 1 }}>
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
                ...Fonts.blackColor14Medium,
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
                ...Fonts.blackColor14Medium,
                marginLeft: Sizes.fixPadding - 5.0,
              }}
            >
              {item.time}
            </Text>
          </View>

          <View style={{ marginVertical: Sizes.fixPadding - 5.0 }}>
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
                Mumbai,2464 Royal South
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
                Pune, 2464 Royal Ln. Mesa
              </Text>
            </View>
          </View>

          <ScrollView horizontal>
            {[1, 2, 3, 4].map((no, innerIndex) => (
              <Image
                key={`${no}`}
                source={
                  innerIndex <= item.passengerList.length - 1
                    ? item.passengerList[innerIndex].profile
                    : require("../../assets/images/icons/empty.png")
                }
                style={{
                  width: 25.0,
                  height: 25.0,
                  borderRadius: 12.5,
                  marginRight: Sizes.fixPadding - 5.0,
                }}
              />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setselectedRequestCount(item.requestCount);
            setshowRequestSheet(true);
          }}
          style={styles.requestCountButton}
        >
          <Text style={{ ...Fonts.primaryColor15SemiBold }}>
            Request({item.requestCount})
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
    return (
      <FlatList
        data={rideRequestsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Sizes.fixPadding * 2.0 }}
      />
    );
  }
};

export default RideRequestScreen;

const styles = StyleSheet.create({
  requestDetailWrapper: {
    flex: 1,
    marginLeft: Sizes.fixPadding,
    height: 82.0,
    justifyContent: "space-between",
  },
  requestWrapper: {
    backgroundColor: Colors.whiteColor,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  requestInfoWrapper: {
    ...CommonStyles.rowAlignCenter,
    ...CommonStyles.shadow,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  sheetStyle: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    paddingTop: Sizes.fixPadding * 2.5,
    maxHeight: screenHeight - 150,
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
  requestCountButton: {
    borderColor: Colors.primaryColor,
    borderWidth: 1.0,
    borderRadius: Sizes.fixPadding - 5.0,
    paddingHorizontal: Sizes.fixPadding + 2.0,
    paddingVertical: Sizes.fixPadding - 2.0,
  },
  sheetButton: {
    flex: 1,
    ...CommonStyles.shadow,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Sizes.fixPadding - 5.0,
    padding: Sizes.fixPadding,
  },
});
