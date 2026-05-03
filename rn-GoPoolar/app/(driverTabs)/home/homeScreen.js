// HomeScreen.js
import { View, Text, StyleSheet, FlatList, Image, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert } from "react-native";
import React, { useState, useEffect,useRef } from "react";
import MyStatusBar from "../../../components/myStatusBar";
import Header from "../../../components/header";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../../constants/styles";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import DashedLine from "react-native-dashed-line";
import { useNavigation } from "@react-navigation/native";
import { io } from "socket.io-client";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [socket, setSocket] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideRequestsList, setRideRequestsList] = useState([]);
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const locationIntervalRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {

    initializeDriver();
  
  }, []);
  
  useEffect(() => {
  
    return () => {
  
      if (locationIntervalRef.current) {
  
        clearInterval(
          locationIntervalRef.current
        );
      }
  
      if (socket) {
  
        console.log(
          "🔌 Disconnecting socket"
        );
  
        socket.disconnect();
      }
    };
  
  }, [socket]);

  const initializeDriver = async () => {

    try {
  
      const storedDriverId =
        await AsyncStorage.getItem("driverId");
  
      console.log(
        "📦 STORED DRIVER ID:",
        storedDriverId
      );
  
      if (!storedDriverId) {
  
        console.log(
          "❌ DRIVER ID NOT FOUND"
        );
  
        return;
      }
  
      const parsedId =
        Number(storedDriverId);
  
      if (!parsedId) {
  
        console.log(
          "❌ INVALID DRIVER ID"
        );
  
        return;
      }
  
      setDriverId(parsedId);
  
      console.log(
        "✅ CONNECTING DRIVER:",
        parsedId
      );
  
      connectSocket(parsedId);
  
    } catch (error) {
  
      console.error(
        "❌ initializeDriver error:",
        error
      );
    }
  };
  const connectSocket = (id) => {
    const socketInstance = io("http://192.168.1.4:3000", { // Replace with your server IP
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      registerDriver(socketInstance, id);
    });

    socketInstance.on("driver-registered", (data) => {
      console.log("Driver registered:", data);
      if (data.pendingRides && data.pendingRides.length > 0) {
        updateRideRequests(data.pendingRides);
      }
    });

    socketInstance.on("newRideRequest", (ride) => {
      console.log("New ride request received:", ride);
      handleNewRideRequest(ride);
    });

    socketInstance.on("nearby-rides", (data) => {
      console.log("Nearby rides:", data);
      if (data.rides && data.rides.length > 0) {
        updateRideRequests(data.rides);
      }
    });

    socketInstance.on("rideTaken", (data) => {
      console.log("Ride taken by another driver:", data);
      removeRideFromList(data.tripId);
    });

    socketInstance.on("rideAccepted", (data) => {
      console.log("Ride accepted:", data);
      Alert.alert("Success", "Ride accepted successfully!");
      navigation.push("startRide/startRideScreen", { trip_id:
        data.trip_id,

      driver:
        data.driver,

      riders:
        data.riders || [],

      sequence:
        data.sequence || [],

      eta:
        data.eta || 0,

      route:
        data.route || null,

      match:
        data.match || {},

      pickup_location:
        data.pickup_location,

      dropoff_location:
        data.dropoff_location});
    });

    socketInstance.on("acceptRideError", (error) => {
      console.error("Accept ride error:", error);
      Alert.alert("Error", error.message || "Failed to accept ride");
      setLoading(false);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(socketInstance);
  };

  const registerDriver = async (socketInstance, id) => {

    try {
  
      // 📍 ask permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();
  
      if (status !== "granted") {
        console.log("❌ Location permission denied");
        return;
      }
  
      // 📍 get current location
      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
  
      const latitude =
        location.coords.latitude;
  
      const longitude =
        location.coords.longitude;
  
      console.log("📍 DRIVER LOCATION:", {
        latitude,
        longitude,
      });
  
      setDriverLocation({
        latitude,
        longitude,
      });
  
      //  register driver
      socketInstance.emit("register-driver", {
        driverId: id,
      });
  
      //  send first location
      socketInstance.emit("driver-location", {
        driverId: id,
        lat: latitude,
        lng: longitude,
      });
  
      //  start live updates
      startLocationUpdates(socketInstance, id);
  
    } catch (err) {
      console.log("❌ registerDriver error:", err);
    }
  };

  const startLocationUpdates = async (
    socketInstance,
    id
  ) => {
  
    // clear old interval first
    if (locationIntervalRef.current) {
  
      clearInterval(
        locationIntervalRef.current
      );
    }
  
    locationIntervalRef.current =
      setInterval(async () => {
  
        try {
  
          const location =
            await Location.getCurrentPositionAsync({
              accuracy:
                Location.Accuracy.High,
            });
  
          const latitude =
            location.coords.latitude;
  
          const longitude =
            location.coords.longitude;
  
          console.log(
            " Sending location:",
            {
              latitude,
              longitude,
            }
          );
  
          socketInstance.emit(
            "driver-location",
            {
              driverId: id,
              lat: latitude,
              lng: longitude,
            }
          );
  
        } catch (err) {
  
          console.log(
            " Location update error:",
            err
          );
        }
  
      }, 10000);
  };


  const handleNewRideRequest = (ride) => {

    const formattedRide = {

      id: ride.trip_id,
    
      date: new Date(
        ride.created_at
      ).toLocaleDateString(),
    
      time: new Date(
        ride.created_at
      ).toLocaleTimeString(),
    
      pickup: ride.pickup_location,
    
      drop: ride.dropoff_location,
    
      requestCount:
        ride.riders?.length || 1,
    
      passengerList:
        ride.riders?.map(r => ({
    
          id: r.rider_id,
    
          profile:
            require(
              "../../../assets/images/user/user3.png"
            ),
    
          name:
            r.rider_name ||
            `Rider ${r.rider_id}`,
    
          pickup: r.pickup,
    
          destination: r.destination,
    
          seats: r.seats
    
        })) || [],
    
      tripData: ride
    };


    setRideRequestsList(prevList => [formattedRide, ...prevList]);
    
    // Show alert for new ride request
    Alert.alert(
      "New Ride Request",
      // `${ride.rider_name} wants to ride from ${ride.pickup_location}`,
      `${ride.riders?.length || 1} rider(s) matched for trip`,
      [
        { text: "View", onPress: () => setShowRequestSheet(true) },
        { text: "Ignore", style: "cancel" }
      ]
    );
  };

  const updateRideRequests = (rides) => {
    const formattedRides = rides.map(ride => ({
      id: ride.trip_id,
      date: new Date(ride.created_at).toLocaleDateString(),
      time: new Date(ride.created_at).toLocaleTimeString(),
      pickup: ride.pickup_location,
      drop: ride.dropoff_location,
      requestCount:
  ride.riders?.length || 1,
      passengerList:
  ride.riders?.map(r => ({

    id: r.rider_id,

    profile:
      require(
        "../../../assets/images/user/user3.png"
      ),

    name:
      r.rider_name ||
      `Rider ${r.rider_id}`

  })) || [],
      tripData: ride,
      distance: ride.distance_from_driver,
      eta: ride.estimated_arrival_minutes
    }));
    
    setRideRequestsList(formattedRides);
  };

  const removeRideFromList = (tripId) => {
    setRideRequestsList(prevList => prevList.filter(ride => ride.id !== tripId));
    if (selectedRequest?.id === tripId) {
      setShowRequestSheet(false);
      setSelectedRequest(null);
    }
  };

  const acceptRide = (tripData) => {
    if (!socket || !driverId) {
      Alert.alert("Error", "Not connected to server");
      return;
    }
    
    setLoading(true);
    console.log("🚗 ACCEPT PAYLOAD", {

      trip_id: tripData.trip_id,
    
      driver: {
        id: driverId,
        location: driverLocation
      }
    
    });
    socket.emit("acceptRide", {

      trip_id: tripData.trip_id,
  
      driver: {
  
        id: driverId,
  
        name: "Driver",
  
        location: driverLocation
  
      }
  
    });
  };

  const rejectRide = (tripData) => {
    if (!socket || !driverId) {
      Alert.alert("Error", "Not connected to server");
      return;
    }
    
    socket.emit("rejectRide", {
      driverId: driverId,
      tripId: tripData.trip_id,
      reason: "Driver declined"
    });
    
    removeRideFromList(tripData.trip_id);
    setShowRequestSheet(false);
    setSelectedRequest(null);
  };

  const updateDriverStatus = (status) => {
    if (!socket || !driverId) return;
    
    setIsAvailable(status === "available");
    socket.emit("driverStatus", {
      driverId: driverId,
      status: status
    });
  };

  const requestSheet = () => {
    if (!selectedRequest) return null;
    
    const passenger=selectedRequest.passengerList?.[0] || {};
    const tripData = selectedRequest.tripData;
    
    return (     
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRequestSheet}
        onRequestClose={() => { setShowRequestSheet(false); setSelectedRequest(null); }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setShowRequestSheet(false); setSelectedRequest(null); }}
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
                      <View style={styles.requestWrapper}>
                        <View style={{ ...CommonStyles.rowAlignCenter }}>
                          <Image
                            source={passenger.profile}
                            style={{
                              width: 82.0,
                              height: 82.0,
                              borderRadius: Sizes.fixPadding - 5.0,
                            }}
                          />
                          <View style={styles.requestDetailWrapper}>
                            <Text style={{ ...Fonts.blackColor15SemiBold }}>
                            {
  selectedRequest.passengerList
    ?.map(p => p.name)
    .join(", ")
}
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
                                  {selectedRequest.pickup}
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
                                  {selectedRequest.drop}
                                </Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={{ ...Fonts.primaryColor15SemiBold }}>
                                ${tripData?.total_amount || tripData?.fare_amount || "0"} ({selectedRequest.requestCount} seat(s))
                              </Text>
                              {selectedRequest.distance && (
                                <Text style={{ ...Fonts.grayColor12Medium }}>
                                  {selectedRequest.distance.toFixed(1)} km • {selectedRequest.eta} min
                                </Text>
                              )}
                            </View>
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
                            onPress={() => rejectRide(tripData)}
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
                            onPress={() => acceptRide(tripData)}
                            disabled={loading}
                            style={{
                              ...styles.sheetButton,
                              backgroundColor: loading ? Colors.grayColor : Colors.secondaryColor,
                              marginLeft: Sizes.fixPadding,
                            }}
                          >
                            <Text style={{ ...Fonts.whiteColor16SemiBold }}>
                              {loading ? "Accepting..." : "Accept"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const requestsInfo = () => {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setSelectedRequest(item);
          setShowRequestSheet(true);
        }}
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.passengerList.map((passenger, index) => (
              <Image
                key={`${passenger.id}-${index}`}
                source={passenger.profile}
                style={{
                  width: 25.0,
                  height: 25.0,
                  borderRadius: 12.5,
                  marginRight: Sizes.fixPadding - 5.0,
                }}
              />
            ))}
          </ScrollView>
          
          {item.distance && (
            <Text style={{ ...Fonts.grayColor12Medium, marginTop: Sizes.fixPadding - 5.0 }}>
              {item.distance.toFixed(1)} km away • ETA: {item.eta} min
            </Text>
          )}
        </View>

        <View style={styles.requestCountButton}>
          <Text style={{ ...Fonts.primaryColor15SemiBold }}>
            Request
          </Text>
        </View>
      </TouchableOpacity>
    );
    
    return (
      <FlatList
        data={rideRequestsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: Sizes.fixPadding * 2.0 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: Sizes.fixPadding * 3 }}>
            <Text style={{ ...Fonts.grayColor14Medium }}>
              No ride requests available
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header 
          title={"Request for ride"} 
          navigation={navigation}
          rightComponent={
            <TouchableOpacity onPress={() => updateDriverStatus(isAvailable ? "offline" : "available")}>
              <Text style={{ color: isAvailable ? Colors.greenColor : Colors.redColor, fontSize: 14 }}>
                {isAvailable ? "● Online" : "○ Offline"}
              </Text>
            </TouchableOpacity>
          }
        />
        {requestsInfo()}
      </View>
      {requestSheet()}
    </View>
  );
};

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

export default HomeScreen;