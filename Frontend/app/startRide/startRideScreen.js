// import {
//   StyleSheet,
//   Text,
//   View,
//   Image,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Modal,
//   Alert,
//   ActivityIndicator
// } from "react-native";
// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { Colors, Fonts, Sizes, screenHeight, CommonStyles } from "../../constants/styles";
// import * as Location from "expo-location";
// import MapViewDirections from "react-native-maps-directions";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import * as Animatable from "react-native-animatable";
// import MyStatusBar from "../../components/myStatusBar";
// import Header from "../../components/header";
// import DashedLine from "react-native-dashed-line";
// import { useNavigation } from "@react-navigation/native";
// import { router, useLocalSearchParams } from "expo-router";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import api from "../../services/api";

// const GOOGLE_MAPS_API_KEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA';
// const WS_BASE = "ws://192.168.0.105:8000/ws/tracking/";

// const customMapTheme = [
//   { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
//   { "elementType": "geometry.fill", "stylers": [{ "color": "#fefcfb" }] },
//   { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
//   { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
//   { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
//   { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
//   { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
//   { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
//   { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
//   { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5ffd6" }, { "saturation": 100 }] },
//   { "featureType": "poi.park", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "poi.park", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
//   { "featureType": "road", "stylers": [{ "color": "#f7f7f7" }, { "saturation": 100 }] },
//   { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
//   { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#cccccc" }] },
//   { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
//   { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
//   { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#f7f7f7" }, { "lightness": 100 }] },
//   { "featureType": "road.highway", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
//   { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
//   { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
//   { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
//   { "featureType": "transit.station.bus", "elementType": "geometry.fill", "stylers": [{ "visibility": "off" }] },
//   { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
//   { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#00b4d8" }] },
//   { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
// ];

// const StartRideScreen = () => {
//   const navigation = useNavigation();
//   const mapRef = useRef(null);
//   const params = useLocalSearchParams();
//   const bottomSheetRef = useRef(null);
//   const snapPoints = useMemo(() => ["40%", "85%"], []);

//   const {
//     rideId,
//     pickupLat,
//     pickupLng,
//     dropoffLat,
//     dropoffLng,
//     pickupAddress,
//     dropoffAddress,
//     role
//   } = routeData.params || {};
//   console.log("START SCREEN PARAMS", routeData.params);
//   const userRole = role || "driver";
//   const pickupLocation = { 
//     latitude: parseFloat(pickupLat) || 0, 
//     longitude: parseFloat(pickupLng) || 0 
//   };
  
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [showVerificationModal, setShowVerificationModal] = useState(false);
//   const [code, setCode] = useState("");
//   const [verifying, setVerifying] = useState(false);
//   const socketRef = useRef(null);
//   const [hasUnread, setHasUnread] = useState(false);



//   const [waypoints, setWaypoints] = useState([]);
// const [pendingStops, setPendingStops] = useState([]);
// const [selectedPassengerForOTP, setSelectedPassengerForOTP] = useState(null);



//   useEffect(() => {
//     let subscription;
//     const startTracking = async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") return;

//       subscription = await Location.watchPositionAsync(
//         { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
//         (location) => {
//           const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
//           setDriverLocation(newCoords);
          
//           if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//             socketRef.current.send(JSON.stringify({
//               type: "driver_location_update",
//               ride_id: rideId,
//               latitude: newCoords.latitude,
//               longitude: newCoords.longitude
//             }));
//           }
//         }
//       );
//     };
//     startTracking();
//     return () => subscription?.remove();
//   }, [rideId]);

//   useEffect(() => {
//     const connectSocket = async () => {
//       const userId = await AsyncStorage.getItem("userId");
//       socketRef.current = new WebSocket(`${WS_BASE}?user_id=${userId}`);
      
//       socketRef.current.onopen = () => {
//         console.log("START RIDE SOCKET CONNECTED");
//         socketRef.current.send(JSON.stringify({ type: "join_ride", ride_id: rideId }));
//       };

//       // ADD THIS BLOCK: Listen for incoming chat messages
//       socketRef.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
          
//           if (data.type === "chat_received") {
//             if (data.role !== userRole) {
//               setHasUnread(true); // Turns on the green dot silently
//             }
//           }
//         } catch (err) {
//           console.error("Failed to parse socket message", err);
//         }
//       };
//     };
//     connectSocket();
//     return () => socketRef.current?.close();
//   }, [rideId]);

//   useEffect(() => {
//     if (driverLocation) {
//       // Only fetch every ~30 seconds or when a significant distance is covered
//       // to avoid overloading your backend with API calls
//       fetchOptimizedRoute();
//     }
//   }, [driverLocation]);

// const handleDropOff = async (userId) => {
//   try {
//     await api.post(`/rides/trips/${rideId}/dropoff_user/`, { user_id: userId });
//     // After dropping off, refresh the route so the map recalculates 
//     // the new path to the next passenger
//     await fetchOptimizedRoute(); 
//   } catch (err) {
//     Alert.alert("Error", "Could not complete drop-off. Please try again.");
//   }
// };

//   const fetchOptimizedRoute = async () => {
//     if (!driverLocation) return;
//     try {
//       const response = await api.get(`/rides/trips/${rideId}/smart_waypoints/?lat=${driverLocation.latitude}&lng=${driverLocation.longitude}`);
//       setPendingStops(response.data.optimized_route);
      
//       // Extract coordinates for MapViewDirections
//       const coords = response.data.optimized_route.map(stop => ({
//         latitude: stop.latitude,
//         longitude: stop.longitude
//       }));
//       setWaypoints(coords);
//     } catch (err) {
//       console.error("Failed to fetch smart waypoints", err);
//     }
//   };



//   const handleDriverFinalizeTripAction = async () => {
//     try {
//       const tripId = rideId;
      
//       // Post target data cleanly to complete-ride endpoint
//       const response = await api.post("/rides/complete-ride/", {
//         ride_id: tripId
//       });
  
//       if (response.status === 200) {
//         Alert.alert("Trip Finalized", "Fare calculations computed and posted successfully.");
//         router.replace("/homeScreen");
//       }
//     } catch (error) {
//       Alert.alert("Execution Error", "Could not submit completion signals to backend infrastructure.");
//     }
//   };


//   const verifyCode = async () => {
//     if (code.length < 4) {
//       Alert.alert("Invalid", "Please enter the 4-digit code.");
//       return;
//     }
//     setVerifying(true);
//     try {
//       const response = await api.post("/rides/verify-code/", { ride_id: rideId, code });
//       setVerifying(false);

//       // FIX: Check for status matching the backend response
//       if (response.data.status === "verified") {
//         setShowVerificationModal(false);
//         router.replace({
//           pathname: "/rideTracking/rideTrackingScreen",
//           params: { ...routeData.params, role: "driver", status: "in_progress" }
//         });
//       } else {
//         Alert.alert("Error", "Invalid Verification Code");
//       }
//     } catch (err) {
//       setVerifying(false);
//       Alert.alert("Error", err.response?.data?.error || "Invalid Code");
//     }
//   };

//   const openChat = () => { 
//     router.push({
//       pathname: "/Chat/chatScreen",
//       params: { trip_id: rideId ,role: "driver"}
//     });
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <MyStatusBar />
//       <Header title={"Ride Request Route"} navigation={navigation} />
      
//       {/* MAP LAYER */}
//       <View style={{ flex: 1 }}>
//         {/* --------------------------------------------------------------------------------------- */}
//         {/* <MapView
//           ref={mapRef}
//           provider={PROVIDER_GOOGLE}
//           style={StyleSheet.absoluteFillObject}
//           customMapStyle={customMapTheme}
//           initialRegion={{
//             ...pickupLocation,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//           }}
//         >
//           {driverLocation && (
//             <Marker coordinate={driverLocation} title="You (Driver)">
//               <Ionicons name="car" size={32} color={Colors.primaryColor} />
//             </Marker>
//           )}

//           {pickupLocation && pickupLocation.latitude && (
//             <Marker coordinate={pickupLocation} title="Rider Pickup">
//               <View style={styles.markerCircle}>
//                 <Ionicons name="person" size={16} color={Colors.primaryColor} />
//               </View>
//             </Marker>
//           )}

//           {/* CRITICAL FIX: Only draw route when driver location is acquired */}
//           {/* {driverLocation && pickupLocation && pickupLocation.latitude && (
//             <MapViewDirections
//               origin={driverLocation}
//               destination={pickupLocation}
//               apikey={GOOGLE_MAPS_API_KEY}
//               strokeWidth={5}
//               strokeColor="#FF8811"
//               optimizeWaypoints={true}
//               onReady={(res) => mapRef.current?.fitToCoordinates(res.coordinates, { edgePadding: { top: 50, right: 50, bottom: 350, left: 50 }})}
//             />
//           )}
//         </MapView> */} 
//         {/* ----------------------------------------------------------------------------------------------------------- */}


//         <MapView
//   ref={mapRef}
//   provider={PROVIDER_GOOGLE}
//   style={StyleSheet.absoluteFillObject}
//   customMapStyle={customMapTheme}
//   initialRegion={{
//     latitude: driverLocation?.latitude || pickupLocation.latitude || 0,
//     longitude: driverLocation?.longitude || pickupLocation.longitude || 0,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   }}
// >
//   {driverLocation && <Marker coordinate={driverLocation} title="You" />}

//   {/* Render all pending stops dynamically */}
//   {pendingStops.map((stop, index) => (
//     <Marker 
//       key={`${stop.user_id}-${stop.action}-${index}`} 
//       coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
//     >
//       <View style={[styles.markerCircle, { borderColor: stop.action === 'pickup' ? Colors.primaryColor : Colors.redColor }]}>
//         <Text style={{fontSize: 10, fontWeight: 'bold'}}>{index + 1}</Text>
//       </View>
//     </Marker>
//   ))}

//   {/* Draw the multi-stop polyline */}
//   {driverLocation && waypoints.length > 0 && (
//     <MapViewDirections
//       origin={driverLocation}
//       waypoints={waypoints.length > 1 ? waypoints.slice(0, -1) : []}
//       destination={waypoints[waypoints.length - 1]}
//       apikey={GOOGLE_MAPS_API_KEY}
//       strokeWidth={5}
//       strokeColor="#FF8811"
//       optimizeWaypoints={false} // Backend already optimized this
//     />
//   )}
// </MapView>
//       </View>

//       {/* FLOATING CHAT BUTTON */}
//       <TouchableOpacity 
//   style={styles.fabChat} 
//   // -----------------------------------------------------
//   onPress={() => {
//     setHasUnread(false); 
//     openChat(); 
//     // Added () here to execute the function
//   }}
//   // -------------------------------------------------------
//   // onPress={() => router.push({
//   //   pathname: "/chat/chatScreen",
//   //   params: { 
//   //     ride_id: rideId, 
//   //     chatting_with_user_id: stop.user_id, // Pass this!
//   //     role: "driver" 
//   //   }
//   // })}
// >
//   <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
//   {hasUnread && (
//     <View style={styles.notificationDot} />
//   )}
// </TouchableOpacity>

//       {/* START RIDE BUTTON */}
//       <View style={styles.bottomFixedContainer}>
//         <TouchableOpacity activeOpacity={0.8} onPress={() => setShowVerificationModal(true)} style={CommonStyles.button}>
//           <Text style={{ ...Fonts.whiteColor18Bold }}>Start ride</Text>
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM SHEET INFO */}
//       <BottomSheet
//         ref={bottomSheetRef}
//         index={0}
//         snapPoints={snapPoints}
//         enablePanDownToClose={false}
//         backgroundStyle={styles.bottomSheetWrapStyle}
//       >
//         <BottomSheetScrollView>
//               <Text style={styles.sectionTitle}>Up Next</Text>
//               {pendingStops.map((stop, index) => (
//                 <View key={index} style={styles.passengerCard}>
//                   <View style={styles.passengerInfo}>
//                     <Text style={styles.actionText}>{stop.action === 'pickup' ? 'Pick Up' : 'Drop Off'}</Text>
//                     <Text style={styles.passengerName}>Rider #{stop.user_id.slice(-4)}</Text>
//                   </View>
                  
//                   {stop.action === 'pickup' ? (
//                     <TouchableOpacity 
//                       style={styles.actionButton}
//                       onPress={() => {
//                         setSelectedPassengerForOTP(stop.user_id);
//                         setShowVerificationModal(true);
//                       }}
//                     >
//                       <Text style={styles.actionButtonText}>Verify PIN</Text>
//                     </TouchableOpacity>
//                   ) : (
//                     <TouchableOpacity 
//                       style={[styles.actionButton, {backgroundColor: Colors.redColor}]}
//                       onPress={() => handleDropOff(stop.user_id)}
//                     >
//                       <Text style={styles.actionButtonText}>Complete Drop</Text>
//                     </TouchableOpacity>
//                   )}
//                 </View>
//               ))}
//           </BottomSheetScrollView>
//       </BottomSheet>

//       {/* VERIFICATION MODAL */}
//       <Modal visible={showVerificationModal} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Start Ride</Text>
//             <Text style={styles.modalSubtitle}>Ask the rider for their 4-digit verification code to begin the trip.</Text>
            
//             <TextInput
//               style={styles.codeInput}
//               value={code}
//               onChangeText={setCode}
//               keyboardType="number-pad"
//               maxLength={4}
//               placeholder="Enter 4-Digit PIN"
//               placeholderTextColor="#999"
//               autoFocus
//             />

//             <View style={styles.modalButtonRow}>
//               <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVerificationModal(false)}>
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity style={styles.verifyBtn} onPress={verifyCode} disabled={verifying}>
//                 {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify & Start</Text>}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// export default StartRideScreen;

// const styles = StyleSheet.create({
//   bottomFixedContainer: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: "#fff", paddingBottom: 15, paddingTop: 10 },
//   bottomSheetWrapStyle: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1 },
//   sheetLocationIconWrapper: { width: 16.0, height: 16.0, borderRadius: 8.0, borderColor: Colors.grayColor, borderWidth: 1.0, alignItems: "center", justifyContent: "center", marginTop: 5 },
//   markerCircle: { width: 24.0, height: 24.0, borderRadius: 12.0, borderWidth: 2.5, borderColor: Colors.primaryColor, alignItems: "center", justifyContent: "center", backgroundColor: Colors.whiteColor },
  
//   fabChat: { position: "absolute", top: 120, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.secondaryColor, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5 },
  
//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
//   modalContainer: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 25, alignItems: "center" },
//   modalTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 10 },
//   modalSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25 },
//   codeInput: { width: "80%", height: 55, backgroundColor: "#f5f5f5", borderRadius: 10, borderWidth: 1, borderColor: "#ddd", textAlign: "center", fontSize: 24, fontWeight: "bold", letterSpacing: 5, marginBottom: 25 },
//   modalButtonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 15 },
//   cancelBtn: { flex: 1, height: 50, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
//   cancelBtnText: { fontSize: 16, fontWeight: "bold", color: "#666" },
//   verifyBtn: { flex: 1, height: 50, borderRadius: 10, backgroundColor: Colors.primaryColor, justifyContent: "center", alignItems: "center" },
//   verifyBtnText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
//   notificationDot: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: '#22C55E', // Green Color
//     borderWidth: 2,
//     borderColor: '#FFF'
//   }
// });

import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Colors, Fonts, Sizes, screenHeight, CommonStyles } from "../../constants/styles";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as Animatable from "react-native-animatable";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import DashedLine from "react-native-dashed-line";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { Key } from "../../constants/key";
import { MAP_THEME, LIVE_TRACKING_DELTA, ROUTE_LINE_COLOR } from "../../constants/mapTheme";
import { WS_TRACKING_URL } from "../../constants/apiConfig";
import AnimatedDriverMarker from "../rideTracking/components/AnimatedDriverMarker";

const GOOGLE_MAPS_API_KEY = Key.apiKey;
const WS_BASE = WS_TRACKING_URL;

const customMapTheme = MAP_THEME;

const StartRideScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
  // FIX: Using Expo Router's local search params directly
  const params = useLocalSearchParams();
  
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["40%", "85%"], []);

  // FIX: Destructure directly from params instead of routeData.params
  const {
    rideId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    pickupAddress,
    dropoffAddress,
    role
  } = params || {};
  
  console.log("START SCREEN PARAMS", params);
  const userRole = role || "driver";
  const pickupLocation = { 
    latitude: parseFloat(pickupLat) || 0, 
    longitude: parseFloat(pickupLng) || 0 
  };
  
  const [driverLocation, setDriverLocation] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const socketRef = useRef(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [waypoints, setWaypoints] = useState([]);
  const [pendingStops, setPendingStops] = useState([]);
  const [selectedPassengerForOTP, setSelectedPassengerForOTP] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);

  useEffect(() => {
    let subscription;
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || 0,
          };
          setDriverLocation(newCoords);
          
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "driver_location_update",
              ride_id: rideId,
              latitude: newCoords.latitude,
              longitude: newCoords.longitude
            }));
          }
        }
      );
    };
    startTracking();
    return () => subscription?.remove();
  }, [rideId]);

  useEffect(() => {
    const connectSocket = async () => {
      const userId = await AsyncStorage.getItem("userId");
      socketRef.current = new WebSocket(`${WS_BASE}?user_id=${userId}`);
      
      socketRef.current.onopen = () => {
        console.log("START RIDE SOCKET CONNECTED");
        socketRef.current.send(JSON.stringify({ type: "join_ride", ride_id: rideId }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "chat_received") {
            if (data.role !== userRole) {
              setHasUnread(true);
            }
          }

          if (data.type === "route_updated") {
            // Pushed whenever the participant set changes (e.g. a pool
            // match while still waiting to pick up the first rider) -
            // refreshes pending stops without waiting for the next
            // driverLocation-driven poll.
            setPendingStops(data.optimized_route);
            setWaypoints(data.optimized_route.map(stop => ({
              latitude: stop.latitude,
              longitude: stop.longitude
            })));
          }
        } catch (err) {
          console.error("Failed to parse socket message", err);
        }
      };
    };
    connectSocket();
    return () => socketRef.current?.close();
  }, [rideId]);

  useEffect(() => {
    if (driverLocation) {
      fetchOptimizedRoute();
    }
  }, [driverLocation]);

  const handleDropOff = async (userId) => {
    try {
      await api.post(`/rides/trips/${rideId}/dropoff_user/`, { user_id: userId });
      await fetchOptimizedRoute(); 
    } catch (err) {
      Alert.alert("Error", "Could not complete drop-off. Please try again.");
    }
  };

  const fetchOptimizedRoute = async () => {
    if (!driverLocation) return;
    try {
      const response = await api.get(`/rides/trips/${rideId}/smart_waypoints/?lat=${driverLocation.latitude}&lng=${driverLocation.longitude}`);
      setPendingStops(response.data.optimized_route);
      
      const coords = response.data.optimized_route.map(stop => ({
        latitude: stop.latitude,
        longitude: stop.longitude
      }));
      setWaypoints(coords);
    } catch (err) {
      console.error("Failed to fetch smart waypoints", err);
    }
  };

  const handleDriverFinalizeTripAction = async () => {
    try {
      const tripId = rideId;
      const response = await api.post("/rides/complete-ride/", {
        ride_id: tripId
      });
  
      if (response.status === 200) {
        Alert.alert("Trip Finalized", "Fare calculations computed and posted successfully.");
        router.replace("/homeScreen");
      }
    } catch (error) {
      Alert.alert("Execution Error", "Could not submit completion signals to backend infrastructure.");
    }
  };

  const verifyCode = async () => {
    if (code.length < 4) {
      Alert.alert("Invalid", "Please enter the 4-digit code.");
      return;
    }
    setVerifying(true);
    try {
      // Backend's RideVerificationSerializer requires the field to be named 'code'.
      const response = await api.post("/rides/verify-code/", {
        ride_id: rideId,
        code: code
      });
      setVerifying(false);
  
      if (response.data.status === "verified") {
        setShowVerificationModal(false);
        router.replace({
          pathname: "/rideTracking/rideTrackingScreen",
          params: { ...params, role: "driver", status: "in_progress" } // Also fixed routeData typo to params
        });
      } else {
        Alert.alert("Error", "Invalid Verification Code");
      }
    } catch (err) {
      setVerifying(false);
      Alert.alert("Error", err.response?.data?.error || "Invalid Code");
    }
  };

  const openChat = () => { 
    router.push({
      pathname: "/Chat/chatScreen",
      params: { trip_id: rideId, role: "driver" }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <Header title={"Ride Request Route"} navigation={navigation} />
      
      {/* MAP LAYER */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={JSON.parse(JSON.stringify(customMapTheme))}
          initialRegion={{
            latitude: driverLocation?.latitude || pickupLocation.latitude || 0,
            longitude: driverLocation?.longitude || pickupLocation.longitude || 0,
            latitudeDelta: LIVE_TRACKING_DELTA,
            longitudeDelta: LIVE_TRACKING_DELTA,
          }}
        >
          {driverLocation && (
            <AnimatedDriverMarker
              coordinate={driverLocation}
              heading={driverLocation.heading || 0}
            />
          )}

          {/* Render all pending stops dynamically */}
          {pendingStops.map((stop, index) => (
            <Marker 
              key={`${stop.user_id}-${stop.action}-${index}`} 
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            >
              <View style={[styles.markerCircle, { borderColor: stop.action === 'pickup' ? Colors.primaryColor : Colors.redColor }]}>
                <Text style={{fontSize: 10, fontWeight: 'bold'}}>{index + 1}</Text>
              </View>
            </Marker>
          ))}

          {/* Draw the multi-stop polyline */}
          {driverLocation && waypoints.length > 0 && (
            <MapViewDirections
              origin={driverLocation}
              waypoints={waypoints.length > 1 ? waypoints.slice(0, -1) : []}
              destination={waypoints[waypoints.length - 1]}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={5}
              strokeColor={ROUTE_LINE_COLOR}
              optimizeWaypoints={false}
              onReady={(result) => setEtaMinutes(Math.ceil(result.duration))}
            />
          )}
        </MapView>
      </View>

      {/* FLOATING CHAT BUTTON */}
      <TouchableOpacity 
        style={styles.fabChat} 
        onPress={() => {
          setHasUnread(false); 
          openChat(); 
        }}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
        {hasUnread && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>

      {/* START RIDE BUTTON */}
      <View style={styles.bottomFixedContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowVerificationModal(true)} style={CommonStyles.button}>
          <Text style={{ ...Fonts.whiteColor18Bold }}>Start ride</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET INFO */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={styles.bottomSheetWrapStyle}
      >
        <BottomSheetScrollView>
          <Text style={styles.sectionTitle}>Up Next</Text>
          {etaMinutes !== null && (
            <Text style={styles.etaText}>{etaMinutes} min to next stop</Text>
          )}
          {pendingStops.map((stop, index) => (
            <View key={index} style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <Text style={styles.actionText}>{stop.action === 'pickup' ? 'Pick Up' : 'Drop Off'}</Text>
                <Text style={styles.passengerName}>Rider #{stop.user_id.slice(-4)}</Text>
              </View>
              
              {stop.action === 'pickup' ? (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedPassengerForOTP(stop.user_id);
                    setShowVerificationModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Verify PIN</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, {backgroundColor: Colors.redColor}]}
                  onPress={() => handleDropOff(stop.user_id)}
                >
                  <Text style={styles.actionButtonText}>Complete Drop</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* VERIFICATION MODAL */}
      <Modal visible={showVerificationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Start Ride</Text>
            <Text style={styles.modalSubtitle}>Ask the rider for their 4-digit verification code to begin the trip.</Text>
            
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="Enter 4-Digit PIN"
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVerificationModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.verifyBtn} onPress={verifyCode} disabled={verifying}>
                {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify & Start</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StartRideScreen;

const styles = StyleSheet.create({
  bottomFixedContainer: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: "#fff", paddingBottom: 15, paddingTop: 10 },
  bottomSheetWrapStyle: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1 },
  sheetLocationIconWrapper: { width: 16.0, height: 16.0, borderRadius: 8.0, borderColor: Colors.grayColor, borderWidth: 1.0, alignItems: "center", justifyContent: "center", marginTop: 5 },
  markerCircle: { width: 24.0, height: 24.0, borderRadius: 12.0, borderWidth: 2.5, borderColor: Colors.primaryColor, alignItems: "center", justifyContent: "center", backgroundColor: Colors.whiteColor },
  fabChat: { position: "absolute", top: 120, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.secondaryColor, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 25, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25 },
  codeInput: { width: "80%", height: 55, backgroundColor: "#f5f5f5", borderRadius: 10, borderWidth: 1, borderColor: "#ddd", textAlign: "center", fontSize: 24, fontWeight: "bold", letterSpacing: 5, marginBottom: 25 },
  modalButtonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 15 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "bold", color: "#666" },
  verifyBtn: { flex: 1, height: 50, borderRadius: 10, backgroundColor: Colors.primaryColor, justifyContent: "center", alignItems: "center" },
  verifyBtnText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E', 
    borderWidth: 2,
    borderColor: '#FFF'
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", paddingHorizontal: 20, paddingVertical: 10 },
  etaText: { fontSize: 13, fontWeight: "600", color: Colors.primaryColor, paddingHorizontal: 20, marginBottom: 8 },
  passengerCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  passengerInfo: { flex: 1 },
  actionText: { fontSize: 12, fontWeight: "bold", color: "#777", textTransform: "uppercase" },
  passengerName: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  actionButton: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: Colors.primaryColor, borderRadius: 8 },
  actionButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 }
});