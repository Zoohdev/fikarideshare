
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import DashedLine from "react-native-dashed-line";
import MyStatusBar from "../../../components/myStatusBar";
import Header from "../../../components/header";
import { Colors, Fonts, Sizes, CommonStyles } from "../../../constants/styles";
import api from "../../../services/api";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE_URL, WS_BASE_URL } from "../../../constants/apiConfig";

const { width } = Dimensions.get("window");

const API_BASE = `${API_BASE_URL}/rides`;
const WS_BASE = `${WS_BASE_URL}/ws/tracking/`;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [ws, setWs] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationSubscription = useRef(null);
  const [rideRequestsList, setRideRequestsList] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null); // Add this
  const [recentMessage, setRecentMessage] = useState(null);
  const driverSocketRef = useRef(null);
  const locationStreamIntervalRef = useRef(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const router = useRouter();
  const activeRideIdRef = useRef(null);
  

  const connectUnifiedSocket = async () => {
    const user_id = await AsyncStorage.getItem("userId");
    if (!user_id) {
      Alert.alert("Error", "No authentication token found.");
      setIsAvailable(false);
      return;
    }
  
    // Use your defined WS_BASE
    const socketUrl = `${WS_BASE}?user_id=${user_id}`;
    driverSocketRef.current = new WebSocket(socketUrl);
  
    driverSocketRef.current.onopen = () => {
      console.log("WebSocket connected. Starting location sync...");
      startLocationTracking(driverSocketRef.current);
    };
  


    driverSocketRef.current.onmessage = (event) => {

      try {
    
        const msg = JSON.parse(event.data);
    
        console.log(
          "FULL DRIVER SOCKET MESSAGE:",
          JSON.stringify(msg, null, 2)
        );
    
        switch(msg.type) {
    
          case "new_ride_request":
    
            setIncomingRequest(msg.data);
            setSelectedRequest(msg.data);
            setShowRequestSheet(true);
    
            break;
    
          case "ride_status":
    
            if(msg.status === "cancelled") {
    
              Alert.alert(
                "Ride Cancelled",
                msg.data?.reason || "Rider cancelled ride"
              );
    
              setIncomingRequest(null);
              setSelectedRequest(null);
              setShowRequestSheet(false);
    
            }
    
            break;
    
          case "driver_location":
    
            setDriverLocation({
              latitude: msg.latitude,
              longitude: msg.longitude
            });
    
            break;
    
          case "rider_location":
    
            setRiderLocation({
              latitude: msg.latitude,
              longitude: msg.longitude
            });
    
            break;
    
          case "chat_received":
    
            setRecentMessage(msg);
    
            break;
    
          case "joined_ride":
    
            console.log(
              "Joined ride:",
              msg.ride_id
            );
    
            break;
    
          case "error":
    
            Alert.alert(
              "Socket Error",
              msg.message
            );
    
            break;
    
          default:
    
            console.log(
              "UNKNOWN EVENT",
              msg
            );
        }
    

    driverSocketRef.current.onclose = (event) => {

      console.log(
        "SOCKET CLOSED",
        event.code
      );
    
      if (isAvailable) {
    
        setTimeout(() => {
    
          console.log(
            "RECONNECTING..."
          );
    
          connectUnifiedSocket();
    
        }, 3000);
    
      }
    };


  } catch(err) {
    
    console.log(
      "PARSE ERROR",
      err
    );

  }
};
  };





  const terminateDriverSession = () => {
    if (driverSocketRef.current) {
      driverSocketRef.current.close();
      driverSocketRef.current = null;
    }
    if (locationStreamIntervalRef.current) {
      clearInterval(locationStreamIntervalRef.current);
      locationStreamIntervalRef.current = null;
    }
    console.log("Driver node session closed successfully.");
  };

  // API execution handling driver acceptance flow
  const acceptIncomingRide = async (rideId) => {
    setLoading(true);
    try {
      // Post request matches DriverAcceptRideView route signature exactly
      const response = await api.post(`/rides/driver/accept/${rideId}/`);
      if (response.status === 200 || response.data) {
        setActiveRideId(rideId);
        activeRideIdRef.current = rideId;
        // navigation.navigate("startRideScreen", {
        //   rideId: rideId,
        //   role: "driver",
        //   requestDetails: selectedRequest
        // });
        if (
          driverSocketRef.current &&
          driverSocketRef.current.readyState === WebSocket.OPEN
        ) {
          driverSocketRef.current.send(
            JSON.stringify({
              type: "join_ride",
              ride_id: rideId
            })
          );
        }
        else{
          console.log("issue with accept incoming ride functon join_ride connection")
        }

        console.log("Ride reservation assignment confirmed:", response.data);
        setShowRequestSheet(false);
        
        // Route driver straight into their live navigation map interface
        router.push({
          pathname:"/rideTracking/rideTrackingScreen",
          params:{
            rideId:selectedRequest.ride_id,
            pickupLat: selectedRequest.pickup?.lat, // Fix: access nested object property
            pickupLng: selectedRequest.pickup?.lng, // Fix: access nested object property
            dropoffLat: selectedRequest.dropoff?.lat, // Fix: access nested object property
            dropoffLng: selectedRequest.dropoff?.lng,
            pickupAddress:selectedRequest.pickup_address,
            dropoffAddress:selectedRequest.dropoff_address,
            fare:selectedRequest.fare,
            role:"driver"
          }
         });
      }
    } catch (err) {
      console.error("Failed to confirm match assignment:", err.response?.data || err.message);
      Alert.alert("Assignment Error", "This ride invitation is no longer active or was taken by another operator.");
    }finally{
      setLoading(false);
    }
  };



  

  const startLocationTracking = async (activeWs) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permissions are required for driver tracking.");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // every 5 seconds
          distanceInterval: 5, // or every 5 meters
        },
        (location) => {
          if (activeWs && activeWs.readyState === WebSocket.OPEN) {
            const payload = {
              type: "location_update",
              ride_id: activeRideIdRef.current || null,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading || 0,
              speed: location.coords.speed || 0,
              accuracy: location.coords.accuracy || 10,
            };
            activeWs.send(JSON.stringify(payload));
          }
        }
      );
    } catch (err) {
      console.error("Tracking setup failure:", err);
    }
  };


  useEffect(() => {
    let timeoutId = null;
  
    if (isAvailable) {
      connectUnifiedSocket();
      
      // Give the socket a brief moment to connect, then signal availability
      timeoutId = setTimeout(() => {
        if (driverSocketRef.current && driverSocketRef.current.readyState === WebSocket.OPEN) {
          driverSocketRef.current.send(JSON.stringify({
            type: "driver_update_status",
            status: "available"
          }));
          console.log("Sent availability status update to backend.");
        }
      }, 1000);
  
    } else {
      if (driverSocketRef.current && driverSocketRef.current.readyState === WebSocket.OPEN) {
        driverSocketRef.current.send(JSON.stringify({
          type: "driver_update_status",
          status: "offline"
        }));
      }
      terminateDriverSession();
    }
  
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      terminateDriverSession();
    };
  }, [isAvailable]);



  const cleanupTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  const toggleDriverStatus = () => {
    setIsAvailable(!isAvailable);
  };


  return (
    <View style={styles.container}>
      <MyStatusBar />
      <Header
        title="Driver Dashboard"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity onPress={toggleDriverStatus}>
            <Text style={{ color: isAvailable ? Colors.greenColor : Colors.redColor, fontSize: 15, fontWeight: 'bold' }}>
              {isAvailable ? "● Online" : "○ Offline"}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.statusDisplay}>
        <Text style={Fonts.grayColor14Medium}>
          {isAvailable ? "Waiting for ride requests live..." : "You are currently offline."}
        </Text>
      </View>

      {/* Premium Elegant Incoming Request Modal */}
      <Modal visible={!!incomingRequest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.premiumCard}>
            <View style={styles.headerIndicator} />
            
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.newRequestText}>NEW REQUEST MATCH</Text>
                <Text style={styles.distanceSubtext}>
                  {((incomingRequest?.distance_meters || 0) / 1000).toFixed(2)} km total trip
                </Text>
              </View>
              <View style={styles.fareContainer}>
                <Text style={styles.fareText}>R{incomingRequest?.fare}</Text>
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeTimeline}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.greenColor }]} />
                <DashedLine axis="vertical" dashLength={4} dashColor="#CCC" style={styles.verticalLine} />
                <View style={[styles.timelineDot, { backgroundColor: Colors.redColor }]} />
              </View>

              <View style={styles.addressWrapper}>
                <View style={styles.addressNode}>
                  <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
                  <Text numberOfLines={2} style={styles.addressValue}>
                    {incomingRequest?.pickup_address || "Fetching pickup location..."}
                  </Text>
                </View>

                <View style={[styles.addressNode, { marginTop: Sizes.fixPadding * 1.5 }]}>
                  <Text style={styles.addressLabel}>DROPOFF DESTINATION</Text>
                  <Text numberOfLines={2} style={styles.addressValue}>
                    {incomingRequest?.dropoff_address || "Fetching dropoff destination..."}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtonGroup}>
              <TouchableOpacity 
                style={styles.declineButton} 
                onPress={() => setIncomingRequest(null)}
                disabled={loading}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                  style={styles.acceptButton} 
                  onPress={() => acceptIncomingRide(incomingRequest.ride_id)} // <-- Change this line
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.whiteColor} size="small" />
                  ) : (
                    <Text style={styles.acceptButtonText}>Accept Ride</Text>
                  )}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  statusDisplay: { alignItems: "center", padding: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  premiumCard: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 3,
    borderTopRightRadius: Sizes.fixPadding * 3,
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingBottom: Sizes.fixPadding * 3,
    paddingTop: Sizes.fixPadding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20
  },
  headerIndicator: {
    width: 45,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: Sizes.fixPadding * 1.5
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: Sizes.fixPadding * 1.5,
    marginBottom: Sizes.fixPadding * 1.5
  },
  newRequestText: { fontSize: 13, fontWeight: "800", color: Colors.primaryColor, letterSpacing: 1.2 },
  distanceSubtext: { ...Fonts.grayColor14Medium, marginTop: 2 },
  fareContainer: { backgroundColor: "#EDFDF5", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  fareText: { fontSize: 22, fontWeight: "bold", color: "#10B981" },
  routeContainer: { flexDirection: "row", marginVertical: Sizes.fixPadding },
  routeTimeline: { alignItems: "center", width: 20, marginRight: Sizes.fixPadding },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  verticalLine: { flex: 1, width: 2, marginVertical: 4 },
  addressWrapper: { flex: 1 },
  addressNode: { justifyContent: "center" },
  addressLabel: { fontSize: 11, fontWeight: "700", color: "#A0AEC0", letterSpacing: 0.5 },
  addressValue: { fontSize: 15, fontWeight: "600", color: "#2D3748", marginTop: 2 },
  actionButtonGroup: { flexDirection: "row", marginTop: Sizes.fixPadding * 2.5, gap: Sizes.fixPadding * 1.5 },
  declineButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC"
  },
  declineButtonText: { fontSize: 16, fontWeight: "700", color: "#64748B" },
  acceptButton: {
    flex: 2,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primaryColor,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  acceptButtonText: { fontSize: 16, fontWeight: "700", color: Colors.whiteColor }
});