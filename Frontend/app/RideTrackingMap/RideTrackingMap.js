

// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   TouchableOpacity,
//   ScrollView,
//   Modal,
//   Alert,
//   Linking
// } from "react-native";
// import { router, useLocalSearchParams } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import MapViewDirections from "react-native-maps-directions";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Location from "expo-location";
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

// const MapSection = ({ pickupCoords, destinationCoords, showMap, mapRef, driverLocation, currentTripStatus }) => {
//   if (!showMap || !pickupCoords) return null;

//   // CRITICAL FIX: Dynamic Routing Logic
//   // Before pickup -> Route from Live Driver Location to Pickup
//   // After pickup (in_progress) -> Route from Live Driver Location to Dropoff
//   const isTripActive = currentTripStatus === "in_progress";
  
//   // Ensure we have valid latitude/longitude objects before assigning
//   const validDriverLocation = driverLocation && driverLocation.latitude ? driverLocation : null;
//   const originCoord = validDriverLocation || pickupCoords; 
//   const destinationCoord = isTripActive ? destinationCoords : pickupCoords;
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.webview}
//         customMapStyle={customMapTheme}
//         showsTraffic={false}
//         initialRegion={{
//           latitude: pickupCoords.latitude,
//           longitude: pickupCoords.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {!isTripActive && (
//           <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 1 }} title="Pickup Location">
//             <View style={styles.simpleMarker}>
//               <Ionicons name="person" size={18} color="white" />
//             </View>
//           </Marker>
//         )}

//         {destinationCoords && (
//           <Marker coordinate={destinationCoords} pinColor="red" title="Dropoff Location" />
//         )}

//         {validDriverLocation && (
//           <Marker coordinate={validDriverLocation} anchor={{ x: 0.5, y: 0.5 }} title="Driver">
//             <Ionicons name="car" size={32} color="#ff9f1c" />
//           </Marker>
//         )}

//         {/* Dynamic Route: Recalculates automatically as validDriverLocation changes */}
//         {originCoord && destinationCoord && originCoord.latitude && destinationCoord.latitude && (
//           <MapViewDirections
//             origin={originCoord}
//             destination={destinationCoord}
//             apikey={GOOGLE_MAPS_API_KEY}
//             strokeWidth={5}
//             strokeColor="#ff8811"
//             optimizeWaypoints={true}
//             onReady={(result) => {
//               // Ensure camera stays framed correctly when route recalculates
//               if(mapRef.current) {
//                 mapRef.current.fitToCoordinates(result.coordinates, {
//                   edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
//                   animated: true,
//                 });
//               }
//             }}
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// export default function RideTrackingScreen() {
//   const params = useLocalSearchParams();
//   const mapRef = useRef(null);
//   const trackingSocketRef = useRef(null);
//   const locationPushIntervalRef = useRef(null);
//   const [hasUnread, setHasUnread] = useState(false);
//   const rideId = params.rideId || params.ride_id;
//   const userRole = params.role || "rider";
  
//   // Coordinate Setup
//   const pickupCoords = params.pickupLat && params.pickupLng ? { latitude: parseFloat(params.pickupLat), longitude: parseFloat(params.pickupLng) } : null;
//   const dropoffCoords = params.dropoffLat && params.dropoffLng ? { latitude: parseFloat(params.dropoffLat), longitude: parseFloat(params.dropoffLng) } : null;

//   // Status & Core States
//   const [currentTripStatus, setCurrentTripStatus] = useState(params.status || "driver_assigned");
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
//   const [sosVisible, setSOSVisible] = useState(false);
//   const [sosSent, setSOSSent] = useState(false);
//   const [rideServerObject, setRideServerObject] = useState(null);
//   // Hydration Data States
//   const [driverData, setDriverData] = useState(typeof params.driver === 'string' ? JSON.parse(params.driver) : (params.driver || {}));
//   const [vehicleData, setVehicleData] = useState(typeof params.vehicle === 'string' ? JSON.parse(params.vehicle) : (params.vehicle || {}));
  
//   // UI Reactive States (Converted from static consts)
//   const [fareAmount, setFareAmount] = useState(params.fare || params.estimated_fare || params.fare_amount || "0.00");
//   const [pickupAddress, setPickupAddress] = useState(params.pickupAddress || params.pickup_address || "Pickup Location");
//   const [dropoffAddress, setDropoffAddress] = useState(params.dropoffAddress || params.dropoff_address || "Dropoff Location");
//   const [verificationCode, setVerificationCode] = useState(params.verification_code || params.code || "----");

//   useEffect(() => {
//     const fetchInitialRideData = async () => {
//       try {
//         const response = await api.get(`/rides/trips/active/`);
        
//         if (response.data) {
//           if (response.data.driver) setDriverData(response.data.driver);
//           if (response.data.vehicle) setVehicleData(response.data.vehicle);
//           if (response.data.status) setCurrentTripStatus(response.data.status);
          
//           // Hydrate dynamic data for the screen safely
//           if (response.data.verification_code) setVerificationCode(response.data.verification_code);
//           if (response.data.final_fare || response.data.estimated_fare) setFareAmount(response.data.final_fare || response.data.estimated_fare);
//           if (response.data.pickup_address) setPickupAddress(response.data.pickup_address);
//           if (response.data.dropoff_address) setDropoffAddress(response.data.dropoff_address);
//         }
//       } catch (err) {
//         console.log("Could not fetch active ride data on mount:", err);
//       }
//     };

//     fetchInitialRideData();
//   }, [rideId]);

//   useEffect(() => {
//     const fetchRideDetails = async () => {
//       try {
//         const response = await api.get(`/rides/verify-code/${rideId}/`);// Assuming your RideViewSet uses /trips/
//         setVerificationCode(response.data.verification_code); 
//         console.log(response.data);// Adjust based on your serializer
//       } catch (err) {
//         console.error("Error fetching ride details:", err);
//       }
//     };
//     fetchRideDetails();
//   }, [rideId]);

//   useEffect(() => {
//     const initializeTrackingStream = async () => {
//       const userId = await AsyncStorage.getItem("userId");
//       if (!userId || !rideId) return;

//       const socketUrl = `${WS_BASE}?user_id=${userId}`;
//       trackingSocketRef.current = new WebSocket(socketUrl);

//       trackingSocketRef.current.onopen = () => {
//         trackingSocketRef.current.send(JSON.stringify({ type: "join_ride", ride_id: rideId }));
//       };

//       trackingSocketRef.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
          
//           // Update live driver position over WebSocket (Triggers map reroute)
//           if(data.type === "driver_location") {
//             setDriverLocation({
//                latitude: parseFloat(data.latitude),
//                longitude: parseFloat(data.longitude)
//             });
//           }

//           // Handle ride status & detail updates
//           if (data.type === "ride_status" && data.ride_id === rideId) {
//             setCurrentTripStatus(data.status);
//             setRideServerObject(data.data || data);


//             if (data.driver) setDriverData(data.driver);
//             if (data.vehicle) setVehicleData(data.vehicle);
//             if (data.verification_code) setVerificationCode(data.verification_code);
//             if (data.fare_amount) setFareAmount(data.fare_amount);

//             if (data.status === "completed") {
//               Alert.alert("Arrived", "Your trip has been completed successfully.");
//               router.replace("/homeScreen");
//             } else if (data.status === "cancelled") {
//               Alert.alert("Ride Cancelled", "This ride has been cancelled.");
//               router.replace("/homeScreen");
//             }
//           }
          
//           if (data.type === "chat_received") {
//             if (data.role !== userRole) {
//               setHasUnread(true); // Turns on the green dot silently
//             }
//           }
//         } catch (err) {
//           console.error("Socket Error:", err);
//         }
//       };

//       trackingSocketRef.current.onerror = (err) => console.log("WebSocket error:", err);
//       trackingSocketRef.current.onclose = () => console.log("WebSocket closed");

//       // Watch driver's live GPS and push to WebSocket
//       if (userRole === "driver") {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status === "granted") {
//           locationPushIntervalRef.current = await Location.watchPositionAsync(
//             { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
//             (loc) => {
//               setDriverLocation(loc.coords);
//               if (trackingSocketRef.current && trackingSocketRef.current.readyState === WebSocket.OPEN) {
//                 trackingSocketRef.current.send(JSON.stringify({
//                   type: "driver_location_update",
//                   ride_id: rideId,
//                   latitude: loc.coords.latitude,
//                   longitude: loc.coords.longitude,
//                 }));
//               }
//             }
//           );
//         }
//       }
//     };

//     initializeTrackingStream();

//     return () => {
//       if (trackingSocketRef.current) {
//         trackingSocketRef.current.send(JSON.stringify({ type: "leave_ride", ride_id: rideId }));
//         trackingSocketRef.current.close();
//       }
//       if (locationPushIntervalRef.current) locationPushIntervalRef.current.remove();
//     };
//   }, [rideId, userRole]);

//   const getStatusDisplay = () => {
//     switch (currentTripStatus) {
//       case "driver_assigned": return "Driver Assigned";
//       case "driver_arriving": return "Driver is Arriving";
//       case "arrived": return "Driver has Arrived";
//       case "in_progress": return "Ride in Progress";
//       case "completed": return "Ride Completed";
//       default: return currentTripStatus.toUpperCase().replace("_", " ");
//     }
//   };

//   const triggerSOS = async () => {
//     try {
//       await api.post("/trip/send-sos/", { trip_id: rideId, rider_location: pickupCoords });
//       setSOSSent(true);
//     } catch (err) {
//       console.log("SOS Failed", err);
//     }
//   };

//   const callDriver = () => {
//     const phone = driverData.phone || driverData.phone_number;
//     if (phone) {
//       Linking.openURL(`tel:${phone}`);
//     } else {
//       Alert.alert("Error", "Phone number not available.");
//     }
//   };

//   const openChat = () => {
//     setHasUnread(false);
//     router.push({
//       pathname: "/Chat/chatScreen",
//       params: { 
//         trip_id: rideId, 
//         driver_id: driverData.driver_id || driverData.id, 
//         driver_name: driverData.name || driverData.full_name ,
//         role: userRole
//       },
//     });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.mapContainer}>
//         {pickupCoords && dropoffCoords ? (
//           <MapSection
//             pickupCoords={pickupCoords}
//             destinationCoords={dropoffCoords}
//             driverLocation={driverLocation}
//             currentTripStatus={currentTripStatus}
//             showMap={true}
//             mapRef={mapRef}
//           />
//         ) : (
//           <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//             <Text>Map data unavailable</Text>
//           </View>
//         )}
//       </View>

//       <TouchableOpacity style={styles.sosButton} onPress={() => setSOSVisible(true)}>
//         <Ionicons name="shield" size={28} color="#FFF" />
//         <Text style={styles.sosText}>SOS</Text>
//       </TouchableOpacity>

//       <View style={styles.bottomSheet}>
//         <ScrollView showsVerticalScrollIndicator={false}>
          
//           <View style={styles.statusContainer}>
//           <Text style={styles.statusText}>
//         {rideServerObject?.status ? rideServerObject.status.toUpperCase() : "Locating your ride..."}
//       </Text>

//       {/* 2. INSERT YOUR INJECTED LAYOUT HERE */}
//       {rideServerObject?.ride_type === 'shared' ? (
//         <View style={{ marginVertical: 8, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
//           <Text style={{ color: '#1E40AF', fontSize: 13, fontWeight: '600' }}>
//             👥 Ride Sharing Active • Fare Split Enabled
//           </Text>
//         </View>
//       ) : (
//         <View style={{ marginVertical: 8, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
//           <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>
//             🚗 Solo Ride Mode
//           </Text>
//         </View>
//       )}
//           </View>

//           <View style={styles.verificationRow}>
//             <View style={styles.vehicleInfoBlock}>
//               <Text style={styles.vehicleNumberBig}>
//                 {vehicleData.license_plate || vehicleData.vehicle_number || "Awaiting..."}
//               </Text>
//               <Text style={styles.vehicleModelSmall}>
//                 {vehicleData.model || vehicleData.make || "Vehicle Assigned"}
//               </Text>
//             </View>

//             <View style={styles.codeSection}>
//               <Text style={styles.codeLabel}>Verification Code</Text>
//               <View style={styles.codeContainer}>
//               <Text style={styles.codeText}>{verificationCode}</Text>
//               </View>
//             </View>
//           </View>

//           <View style={styles.driverCard}>
//             <View style={styles.driverInfoContainer}>
//               <Text style={styles.driverName}>{driverData.name || driverData.full_name || "Assigned Driver"}</Text>
//               <Text style={styles.driverPhone}>{driverData.phone || driverData.phone_number || "Retrieving..."}</Text>
//             </View>

//             <View style={styles.actionButtons}>
//               <TouchableOpacity style={styles.chatButton} onPress={openChat}>
//                 <Ionicons name="chatbubble" size={20} color="#fff" />
//                 {hasUnread && (
//                   <View style={{
//                     position: 'absolute', top: 0, right: 0, width: 12, height: 12, 
//                     borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff'
//                   }} />
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.callButton} onPress={callDriver}>
//                 <Ionicons name="call" size={22} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <Text style={styles.sectionTitle}>Trip Details</Text>
//           <TouchableOpacity style={styles.detailCard} onPress={() => setTripDetailsVisible(true)}>
//             <View style={styles.tripHeader}>
//               <Text style={styles.tripTitle}>Trip Details</Text>
//               <Ionicons name="chevron-up" size={20} color="#666" />
//             </View>
//             <View style={{ marginTop: 10 }}>
//               <Text numberOfLines={1} style={styles.value}>🟢 {pickupAddress}</Text>
//               <View style={{ width: 1, height: 18, backgroundColor: "#ccc", marginLeft: 7, marginVertical: 4 }} />
//               <Text numberOfLines={1} style={styles.value}>📍 {dropoffAddress}</Text>
//             </View>
//           </TouchableOpacity>
//         </ScrollView>

//         {/* DETAILS MODAL */}
//         <Modal visible={tripDetailsVisible} transparent animationType="slide" onRequestClose={() => setTripDetailsVisible(false)}>
//           <View style={styles.modalOverlay}>
//             <View style={styles.bottomModal}>
//               <View style={styles.dragHandle} />
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Trip Details</Text>
//                 <TouchableOpacity onPress={() => setTripDetailsVisible(false)}>
//                   <Ionicons name="close" size={24} color="#000" />
//                 </TouchableOpacity>
//               </View>
//               <ScrollView>
//                 <View style={styles.divider} />
//                 <Text style={styles.modalLabel}>Pickup Location</Text>
//                 <Text style={styles.modalValue}>{pickupAddress}</Text>
//                 <View style={styles.divider} />
//                 <Text style={styles.modalLabel}>Destination</Text>
//                 <Text style={styles.modalValue}>{dropoffAddress}</Text>
//                 <View style={styles.divider} />
//                 <Text style={styles.modalLabel}>Fare Amount</Text>
//                 <Text style={styles.modalFare}>R {parseFloat(fareAmount).toFixed(2)}</Text>
//               </ScrollView>
//             </View>
//           </View>
//         </Modal>

//         {/* SOS MODAL */}
//         <Modal visible={sosVisible} transparent animationType="slide">
//           <View style={styles.sosOverlay}>
//             <View style={styles.sosContainer}>
//               <View style={styles.sosHandle} />
//               <View style={styles.sosHeader}>
//                 <Ionicons name="warning" size={40} color="#FF3B30" />
//                 <Text style={styles.sosTitle}>Emergency Assistance</Text>
//                 <Text style={styles.sosSubtitle}>Your location and driver information will be shared.</Text>
//               </View>
//               <View style={styles.quickActionRow}>
//                 <TouchableOpacity style={styles.quickAction} onPress={() => Linking.openURL("tel:10111")}>
//                   <Ionicons name="call" size={24} color="#FF3B30" />
//                   <Text>Police</Text>
//                 </TouchableOpacity>
//               </View>
//               <TouchableOpacity activeOpacity={0.9} style={styles.sosActionButton} onPress={() => { triggerSOS(); Alert.alert("SOS Triggered", "Emergency contacts notified."); }}>
//                 <View style={styles.sosIconContainer}>
//                   <Ionicons name="shield" size={26} color="#FF3B30" />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.sosButtonTitle}>Send SOS Alert</Text>
//                   <Text style={styles.sosButtonSubtitle}>Notify emergency contacts</Text>
//                 </View>
//               </TouchableOpacity>
//               {sosSent && <View style={styles.successBox}><Ionicons name="checkmark-circle" size={24} color="#22C55E" /><Text style={styles.successText}>SOS Alert Sent Successfully</Text></View>}
//               <TouchableOpacity onPress={() => setSOSVisible(false)}>
//                 <Text style={styles.cancelText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>

//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   webview: { flex: 1 },
//   chatButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FF8811", justifyContent: "center", alignItems: "center" },
//   verificationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
//   driverInfoContainer: { flex: 1, justifyContent: "center" },
//   simpleMarker: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#22C55E", borderWidth: 4, borderColor: "#FF8811", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
//   mapContainer: { flex: 0.55 },
//   bottomSheet: { flex: 0.45, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 20 },
//   statusContainer: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 10, alignItems: "center", marginBottom: 15 },
//   statusText: { color: "#2E7D32", fontWeight: "700" },
//   sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
//   codeContainer: { flexDirection: "row" },
//   codeBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E5E5E5", justifyContent: "center", alignItems: "center", marginLeft: 4 },
//   codeText: { fontSize: 18, fontWeight: "700", color: "#000" },
//   driverCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: "#ECECEC", marginBottom: 20 },
//   driverName: { fontSize: 18, fontWeight: "700" },
//   driverPhone: { color: "#666", marginTop: 2 },
//   callButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FF8811", justifyContent: "center", alignItems: "center" },
//   detailCard: { backgroundColor: "#F8F8F8", padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: "#ECECEC" },
//   value: { fontSize: 14, fontWeight: "600" },
//   divider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 12 },
//   tripHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   tripTitle: { fontSize: 16, fontWeight: "700" },
//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
//   bottomModal: { backgroundColor: "#FFF", height: "65%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 15 },
//   dragHandle: { width: 50, height: 5, backgroundColor: "#DDD", borderRadius: 10, alignSelf: "center", marginBottom: 15 },
//   modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
//   modalTitle: { fontSize: 22, fontWeight: "700" },
//   modalLabel: { fontSize: 12, color: "#777", marginTop: 10 },
//   modalValue: { fontSize: 15, fontWeight: "600", marginTop: 4 },
//   modalFare: { fontSize: 24, fontWeight: "700", color: "#ff9f1c", marginTop: 4 },
//   sosButton: { position: "absolute", right: 20, bottom: "48%", width: 70, height: 70, borderRadius: 35, backgroundColor: "#FF3B30", justifyContent: "center", alignItems: "center", elevation: 12, shadowColor: "#FF3B30", shadowOpacity: 0.4, shadowRadius: 10 },
//   sosText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
//   sosOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
//   sosContainer: { backgroundColor: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
//   sosHandle: { width: 60, height: 5, backgroundColor: "#DDD", borderRadius: 10, alignSelf: "center", marginBottom: 20 },
//   sosHeader: { alignItems: "center" },
//   sosTitle: { fontSize: 22, fontWeight: "700", marginTop: 12 },
//   sosSubtitle: { textAlign: "center", color: "#666", marginTop: 8 },
//   quickActionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
//   quickAction: { width: 90, height: 90, borderRadius: 20, backgroundColor: "#F8F8F8", justifyContent: "center", alignItems: "center", gap: 8 },
//   successBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
//   successText: { marginLeft: 8, color: "#22C55E", fontWeight: "700" },
//   cancelText: { textAlign: "center", marginTop: 20, fontWeight: "600", color: "#777" },
//   sosActionButton: { height: 75, backgroundColor: "#FFE8E6", borderRadius: 20, marginTop: 30, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#FFD2CE" },
//   sosIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", marginRight: 12 },
//   sosButtonTitle: { fontSize: 17, fontWeight: "700", color: "#FF3B30" },
//   sosButtonSubtitle: { marginTop: 3, fontSize: 12, color: "#666" },
//   vehicleInfoBlock: { flex: 1 },
//   vehicleNumberBig: { fontSize: 22, fontWeight: "800", color: "#111" },
//   vehicleModelSmall: { fontSize: 14, color: "#666", marginTop: 4 },
//   codeSection: { alignItems: "flex-end" },
//   codeLabel: { fontSize: 12, color: "#666", marginBottom: 6 },
//   actionButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
// });


import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, Linking, SafeAreaView, ScrollView, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; 


import api from '../../services/api'; 

const GOOGLE_MAPS_APIKEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA'; 
const WS_BASE = 'ws://192.168.0.104:8000/ws/tracking/';

const customMapTheme = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "geometry.fill", "stylers": [{ "color": "#fefcfb" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5ffd6" }, { "saturation": 100 }] },
    { "featureType": "poi.park", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.park", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "road", "stylers": [{ "color": "#f7f7f7" }, { "saturation": 100 }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#cccccc" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#f7f7f7" }, { "lightness": 100 }] },
    { "featureType": "road.highway", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "transit.station.bus", "elementType": "geometry.fill", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#00b4d8" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

export default function ActiverideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId, role } = params;

  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const locationSubRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [messages, setMessages] = useState([]);
  const [rideDetails, setRideDetails] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [completedFare, setCompletedFare] = useState(null);

  // NEW STATES FOR UI
  const [hasUnread, setHasUnread] = useState(false);
  const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
  const [sosVisible, setSOSVisible] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    initializeScreen();
    return () => {
      wsRef.current?.close();
      locationSubRef.current?.remove();
    };
  }, []);

  const initializeScreen = async () => {
    const id = await AsyncStorage.getItem('userId');
    setUserId(id);
    await fetchRideDetails();
    connectWebSocket(id);

    if (role === 'driver') {
      startDriverLocationBroadcast();
    }
  };

  const fetchRideDetails = async () => {
    try {
      const res = await api.get(`/rides/trips/${rideId}/`);
      setRideData(res.data);
      const currentUserId = await AsyncStorage.getItem('userId');
      if (String(res.data.rider.id) === String(currentUserId)) {
        setVerificationCode(res.data.verification_code);
      } else {
        const myParticipantData = res.data.participants?.find(p => String(p.user.id) === String(currentUserId));
        if (myParticipantData) {
          setVerificationCode(myParticipantData.pickup_code);
        }
      }
      
      const locLat = driverLocation?.latitude || res.data?.pickup_location?.latitude || 0;
      const locLng = driverLocation?.longitude || res.data?.pickup_location?.longitude || 0;
      fetchSmartWaypoints(locLat, locLng);
    } catch (e) {
      console.error("Error fetching ride:", e);
    }
  };

  const fetchSmartWaypoints = async (lat, lng) => {
    try {
      const res = await api.get(`/rides/trips/${rideId}/smart_waypoints/?lat=${lat}&lng=${lng}`);
      setWaypoints(res.data.optimized_route);
    } catch (e) {
      console.error("Error fetching waypoints:", e);
    }
  };

  const connectWebSocket = async () => {
    const uid = await AsyncStorage.getItem('userId');
    if (!uid) return;

    wsRef.current = new WebSocket(`${WS_BASE}?user_id=${uid}`);
    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'join_ride', ride_id: rideId }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data);
        if (!parsedMessage || !parsedMessage.type) return;
        const data = parsedMessage.data || {};
    
        switch (parsedMessage.type) {
          case 'driver_location':
            if (data.latitude && data.longitude) {
              setDriverLocation({ latitude: data.latitude, longitude: data.longitude });
            }
            break;
    
          case 'ride_status':
            setRideDetails(data);
            if (data.verification_code) {
              setVerificationCode(data.verification_code);
            }
    
            // FIXED DROP-OFF CHECK (Navigates Rider Properly)
            if (data.event === 'individual_dropped_off' && String(data.user_id) === String(uid)) {
              wsRef.current?.close();
              setCompletedFare(data.final_fare); 
              return; 
            }
            
            if (data.status === 'completed' || parsedMessage.status === 'completed') {
              wsRef.current?.close();
              setCompletedFare(data.final_fare || rideData?.estimated_fare);
            }
            
            if (data.event === 'passenger_joined_pool') {
              fetchRideDetails();
            }
            break;
    
          case 'chat_received':
            if (String(data.target_user) === String(uid) || data.role === 'driver') {
              setMessages((prev) => [...prev, data]);
              setHasUnread(true); // Triggers Green Dot
            }
            break;
        }
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    };
  };

  const startDriverLocationBroadcast = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      (location) => {
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "driver_location_update", ride_id: rideId,
            latitude: location.coords.latitude, longitude: location.coords.longitude,
            heading: location.coords.heading || 0, speed: location.coords.speed || 0,
          }));
        }
      }
    );
  };

  const verifyRiderOtp = async (participantId, isPrimary) => {
    try {
      const code = otpInputs[participantId];
      if (!code) return Alert.alert("Notice", "Please enter the PIN.");
      
      await api.post(`/rides/verify-code/`, { ride_id: rideId, code: code });
      Alert.alert("Success", "Code Verified! Rider is now onboard.");
      fetchRideDetails();
    } catch (e) {
      Alert.alert("Error", "Invalid PIN provided.");
    }
  };

  const dropOffRider = async (targetUserId) => {
    try {
      const res = await api.post(`/rides/trips/${rideId}/dropoff_user/`, { user_id: targetUserId });
      Alert.alert("Dropped Off", `Fare to collect: R${res.data.fare}`);
      
      if (res.data.status === 'ride_fully_completed') {
        router.replace('/(driverTabs)/home/homeScreen'); 
      } else {
        fetchRideDetails();
      }
    } catch (e) {
      Alert.alert("Error", "Could not complete drop off.");
    }
  };

  // Navigates once state updates securely
  useEffect(() => {
    if (completedFare !== null) {
      setTimeout(() => {
        router.replace({ 
          pathname: '/fareSummary/fareSummaryScreen', 
          params: { fare: completedFare } 
        });
      }, 100);
    }
  }, [completedFare]);

  // Actions for Rider UI
  const openChat = () => {
    setHasUnread(false);
    router.push({
      pathname: "/Chat/chatScreen",
      params: { trip_id: rideId, role: role, chatting_with_user_id: rideData?.driver?.id }
    });
  };

  const callDriver = () => {
    if (rideData?.driver?.phone_number) {
      Linking.openURL(`tel:${rideData.driver.phone_number}`);
    } else {
      Alert.alert("Notice", "Driver phone number unavailable.");
    }
  };

  const triggerSOS = () => {
    api.post(`/rides/pool/${rideId}/sos/`)
      .then(() => setSosSent(true))
      .catch(e => console.log("SOS Error", e));
  };

  const getFilteredWaypointsForRider = () => {
    if (role === 'driver') return waypoints;
    const myDropoffIndex = waypoints.findIndex(w => String(w.user_id) === String(userId) && w.action === 'dropoff');
    if (myDropoffIndex === -1) return waypoints;
    return waypoints.slice(0, myDropoffIndex + 1);
  };

  const renderMap = () => {
    if (!rideData || !waypoints.length) return null;
    const displayWaypoints = getFilteredWaypointsForRider();
    const destination = displayWaypoints[displayWaypoints.length - 1];
    const viaPoints = displayWaypoints.slice(0, -1).map(wp => ({ latitude: wp.latitude, longitude: wp.longitude }));

    return (
      <MapView 
        ref={mapRef} 
        style={styles.webview}
        customMapStyle={customMapTheme}
        initialRegion={{
          latitude: driverLocation?.latitude || displayWaypoints[0]?.latitude,
          longitude: driverLocation?.longitude || displayWaypoints[0]?.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {driverLocation && <Marker coordinate={driverLocation} title="Driver" pinColor="#000" />}
        {displayWaypoints.map((wp, index) => (
          <Marker 
            key={index} 
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }} 
            title={wp.action === 'pickup' ? `Pickup` : `Dropoff`}
            pinColor={wp.action === 'pickup' ? "#28a745" : "#dc3545"}
          />
        ))}
        {driverLocation && destination && (
          <MapViewDirections
            origin={driverLocation}
            waypoints={viaPoints}
            destination={{ latitude: destination.latitude, longitude: destination.longitude }}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={5}
            strokeColor="#ff8811"
            optimizeWaypoints={false}
          />
        )}
      </MapView>
    );
  };

  if (!rideData) return (
    <SafeAreaView style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading Trip Data...</Text>
    </SafeAreaView>
  );

  // ==========================================
  // DRIVER UI
  // ==========================================
  if (role === 'driver') {
    let allRiders = [];
    if (rideData.status !== 'completed' && rideData.status !== 'cancelled') {
      allRiders.push({ 
        id: rideData.rider.id, 
        name: rideData.rider.first_name || 'Primary Rider', 
        status: rideData.status, 
        isPrimary: true,
        pickup: rideData.pickup_address,
        dropoff: rideData.dropoff_address
      });
    }
    
    rideData.participants?.forEach(p => {
      if (p.status === 'accepted' || p.status === 'picked_up') {
        allRiders.push({ 
          id: p.user.id, name: p.user.first_name || 'Pool Rider', status: p.status, 
          isPrimary: false, pickup: p.pickup_address, dropoff: p.dropoff_address
        });
      }
    });

    return (
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          {renderMap()}
        </View>

        {/* Scrollable Driver Bottom Sheet */}
        <View style={styles.driverBottomSheet}>
          <View style={styles.dragHandle} />
          <View style={styles.sheetHeaderRow}>
            <View>
               <Text style={styles.sheetTitle}>Passenger Queue</Text>
               <Text style={styles.sheetSubtitle}>{allRiders.length} active riders</Text>
            </View>
            <View style={styles.queueBadge}>
              <Ionicons name="people" size={16} color="#FF8811" />
              <Text style={styles.queueBadgeText}>{allRiders.length}</Text>
            </View>
          </View>

          <FlatList
            data={allRiders}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={true} // Enabled Scroll indicator
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const isWaitingForPickup = ['driver_assigned', 'driver_arriving', 'arrived', 'accepted'].includes(item.status);
              const isInTransit = ['in_progress', 'picked_up'].includes(item.status);

              return (
                <View style={styles.premiumRiderCard}>
                  <View style={[styles.cardAccentLine, { backgroundColor: isWaitingForPickup ? '#FF8811' : '#10b981' }]} />
                  <View style={styles.cardHeader}>
                    <View style={styles.riderIdentity}>
                      <View style={styles.avatarMini}>
                         <Text style={styles.avatarMiniText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View>
                         <Text style={styles.riderName}>{item.name}</Text>
                         <View style={styles.roleTag}>
                           <Text style={styles.roleTagText}>{item.isPrimary ? "Primary Trip" : "Pool Rider"}</Text>
                         </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.cardChatBtn}
                      onPress={() => router.push({ pathname: "/Chat/chatScreen", params: { trip_id: rideId, role: "driver", chatting_with_user_id: item.id }})}
                    >
                      <Ionicons name="chatbubble-ellipses" size={20} color="#FF8811" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tripDetailsZone}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={14} color="#64748b" style={styles.detailIcon} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        <Text style={{fontWeight: 'bold', color: '#334155'}}>Drop: </Text>
                        {item.dropoff || "Destination hidden"}
                      </Text>
                    </View>
                    <View style={styles.statusRow}>
                       <Text style={styles.statusLabel}>Live Status:</Text>
                       <Text style={[styles.statusValue, { color: isWaitingForPickup ? '#FF8811' : '#10b981' }]}>
                         {item.status.replace('_', ' ').toUpperCase()}
                       </Text>
                    </View>
                  </View>
                  
                  {isWaitingForPickup && (
                    <View style={styles.actionZone}>
                      <Text style={styles.actionPrompt}>Enter 4-Digit PIN from Rider</Text>
                      <View style={styles.otpActionRow}>
                        <TextInput 
                          style={styles.modernOtpInput} placeholder="• • • •" placeholderTextColor="#cbd5e1"
                          keyboardType="number-pad" maxLength={4}
                          onChangeText={(val) => setOtpInputs({...otpInputs, [item.id]: val})}
                        />
                        <TouchableOpacity style={styles.btnVerifyOrange} onPress={() => verifyRiderOtp(item.id, item.isPrimary)}>
                          <Ionicons name="shield-checkmark" size={18} color="#fff" style={{marginRight: 6}} />
                          <Text style={styles.btnText}>Verify</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {isInTransit && (
                    <View style={styles.actionZone}>
                      <TouchableOpacity style={styles.btnDropoff} onPress={() => dropOffRider(item.id)}>
                        <Ionicons name="flag" size={20} color="#fff" style={{marginRight: 8}}/>
                        <Text style={styles.btnDropoffText}>Complete Drop Off</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      </View>
    );
  }

  // ==========================================
  // RIDER UI
  // ==========================================
  const vehicleData = rideData?.vehicle || {};
  const driverData = rideData?.driver || {};
  const pickupAddress = rideData?.pickup_address || "Loading...";
  const dropoffAddress = rideData?.dropoff_address || "Loading...";
  const fareAmount = rideData?.estimated_fare || 0;
  const currentTripStatus = rideData?.status || "Locating your ride...";
  const rideServerObject = rideData || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      <TouchableOpacity style={styles.sosButton} onPress={() => setSOSVisible(true)}>
        <Ionicons name="shield" size={28} color="#FFF" />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {rideServerObject?.status ? rideServerObject.status.toUpperCase() : "Locating your ride..."}
            </Text>

            {rideServerObject?.ride_type === 'shared' ? (
              <View style={{ marginVertical: 8, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#1E40AF', fontSize: 13, fontWeight: '600' }}>
                  👥 Ride Sharing Active • Fare Split Enabled
                </Text>
              </View>
            ) : (
              <View style={{ marginVertical: 8, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>
                  🚗 Solo Ride Mode
                </Text>
              </View>
            )}
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.vehicleInfoBlock}>
              <Text style={styles.vehicleNumberBig}>
                {vehicleData.license_plate || vehicleData.vehicle_number || "Awaiting..."}
              </Text>
              <Text style={styles.vehicleModelSmall}>
                {vehicleData.color} {vehicleData.model || vehicleData.make || "Vehicle Assigned"}
              </Text>
            </View>

            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Verification Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{verificationCode}</Text>
              </View>
            </View>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.driverInfoContainer}>
              <Text style={styles.driverName}>{driverData.first_name || driverData.full_name || "Assigned Driver"}</Text>
              <Text style={styles.driverPhone}>{driverData.phone || driverData.phone_number || "Retrieving..."}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.chatButton} onPress={openChat}>
                <Ionicons name="chatbubble" size={20} color="#fff" />
                {hasUnread && (
                  <View style={{
                    position: 'absolute', top: 0, right: 0, width: 12, height: 12, 
                    borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff'
                  }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={callDriver}>
                <Ionicons name="call" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Trip Details</Text>
          <TouchableOpacity style={styles.detailCard} onPress={() => setTripDetailsVisible(true)}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripTitle}>Trip Details</Text>
              <Ionicons name="chevron-up" size={20} color="#666" />
            </View>
            <View style={{ marginTop: 10 }}>
              <Text numberOfLines={1} style={styles.value}>🟢 {pickupAddress}</Text>
              <View style={{ width: 1, height: 18, backgroundColor: "#ccc", marginLeft: 7, marginVertical: 4 }} />
              <Text numberOfLines={1} style={styles.value}>📍 {dropoffAddress}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* DETAILS MODAL */}
        <Modal visible={tripDetailsVisible} transparent animationType="slide" onRequestClose={() => setTripDetailsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.bottomModal}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trip Details</Text>
                <TouchableOpacity onPress={() => setTripDetailsVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.divider} />
                <Text style={styles.modalLabel}>Pickup Location</Text>
                <Text style={styles.modalValue}>{pickupAddress}</Text>
                <View style={styles.divider} />
                <Text style={styles.modalLabel}>Destination</Text>
                <Text style={styles.modalValue}>{dropoffAddress}</Text>
                <View style={styles.divider} />
                <Text style={styles.modalLabel}>Fare Amount</Text>
                <Text style={styles.modalFare}>R {parseFloat(fareAmount).toFixed(2)}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* SOS MODAL */}
        <Modal visible={sosVisible} transparent animationType="slide">
          <View style={styles.sosOverlay}>
            <View style={styles.sosContainer}>
              <View style={styles.sosHandle} />
              <View style={styles.sosHeader}>
                <Ionicons name="warning" size={40} color="#FF3B30" />
                <Text style={styles.sosTitle}>Emergency Assistance</Text>
                <Text style={styles.sosSubtitle}>Your location and driver information will be shared.</Text>
              </View>
              <View style={styles.quickActionRow}>
                <TouchableOpacity style={styles.quickAction} onPress={() => Linking.openURL("tel:10111")}>
                  <Ionicons name="call" size={24} color="#FF3B30" />
                  <Text>Police</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.9} style={styles.sosActionButton} onPress={() => { triggerSOS(); Alert.alert("SOS Triggered", "Emergency contacts notified."); }}>
                <View style={styles.sosIconContainer}>
                  <Ionicons name="shield" size={26} color="#FF3B30" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosButtonTitle}>Send SOS Alert</Text>
                  <Text style={styles.sosButtonSubtitle}>Notify emergency contacts</Text>
                </View>
              </TouchableOpacity>
              {sosSent && <View style={styles.successBox}><Ionicons name="checkmark-circle" size={24} color="#22C55E" /><Text style={styles.successText}>SOS Alert Sent Successfully</Text></View>}
              <TouchableOpacity onPress={() => setSOSVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', fontWeight: '500' },
  mapContainer: { flex: 0.55 },
  
  // DRIVER STYLES (Kept exactly as they were, but updated to fit standard flex patterns)
  driverBottomSheet: { 
    flex: 0.45, // Set flex so it takes the remaining space and allows scrolling
    backgroundColor: '#f8fafc', borderTopLeftRadius: 28, borderTopRightRadius: 28, 
    marginTop: -20, paddingHorizontal: 20, paddingTop: 12, shadowColor: '#000', 
    shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 
  },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sheetSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  queueBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#fed7aa' },
  queueBadgeText: { color: '#FF8811', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
  premiumRiderCard: { backgroundColor: '#ffffff', borderRadius: 20, marginBottom: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardAccentLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingLeft: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  riderIdentity: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF8811', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#FF8811', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 3}, elevation: 4 },
  avatarMiniText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  riderName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  roleTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  roleTagText: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  cardChatBtn: { backgroundColor: '#fff7ed', width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fed7aa' },
  tripDetailsZone: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fdfdfd' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailIcon: { marginRight: 8, marginTop: 2 },
  detailText: { fontSize: 13, color: '#475569', flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
  statusLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusValue: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  actionZone: { padding: 16, paddingLeft: 20, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  actionPrompt: { fontSize: 13, fontWeight: '700', color: '#FF8811', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  otpActionRow: { flexDirection: 'row', gap: 12 },
  modernOtpInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, fontSize: 22, letterSpacing: 8, fontWeight: '800', textAlign: 'center', color: '#0f172a' },
  btnVerifyOrange: { backgroundColor: '#FF8811', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8811', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnDropoff: { backgroundColor: '#0f172a', flexDirection: 'row', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width: 0, height: 4}, elevation: 4 },
  btnDropoffText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  // RIDER STYLES
  bottomSheet: { flex: 0.45, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 20 },
  chatButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FF8811", justifyContent: "center", alignItems: "center" },
  verificationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  driverInfoContainer: { flex: 1, justifyContent: "center" },
  statusContainer: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 10, alignItems: "center", marginBottom: 15 },
  statusText: { color: "#2E7D32", fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  codeContainer: { flexDirection: "row" },
  codeText: { fontSize: 18, fontWeight: "700", color: "#000" },
  driverCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: "#ECECEC", marginBottom: 20 },
  driverName: { fontSize: 18, fontWeight: "700" },
  driverPhone: { color: "#666", marginTop: 2 },
  callButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FF8811", justifyContent: "center", alignItems: "center" },
  detailCard: { backgroundColor: "#F8F8F8", padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: "#ECECEC" },
  value: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 12 },
  tripHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tripTitle: { fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomModal: { backgroundColor: "#FFF", height: "65%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 15 },
  dragHandle: { width: 50, height: 5, backgroundColor: "#DDD", borderRadius: 10, alignSelf: "center", marginBottom: 15 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "700" },
  modalLabel: { fontSize: 12, color: "#777", marginTop: 10 },
  modalValue: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  modalFare: { fontSize: 24, fontWeight: "700", color: "#ff9f1c", marginTop: 4 },
  sosButton: { position: "absolute", right: 20, bottom: "48%", width: 70, height: 70, borderRadius: 35, backgroundColor: "#FF3B30", justifyContent: "center", alignItems: "center", elevation: 12, shadowColor: "#FF3B30", shadowOpacity: 0.4, shadowRadius: 10 },
  sosText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  sosOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sosContainer: { backgroundColor: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  sosHandle: { width: 60, height: 5, backgroundColor: "#DDD", borderRadius: 10, alignSelf: "center", marginBottom: 20 },
  sosHeader: { alignItems: "center" },
  sosTitle: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  sosSubtitle: { textAlign: "center", color: "#666", marginTop: 8 },
  quickActionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
  quickAction: { width: 90, height: 90, borderRadius: 20, backgroundColor: "#F8F8F8", justifyContent: "center", alignItems: "center", gap: 8 },
  successBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
  successText: { marginLeft: 8, color: "#22C55E", fontWeight: "700" },
  cancelText: { textAlign: "center", marginTop: 20, fontWeight: "600", color: "#777" },
  sosActionButton: { height: 75, backgroundColor: "#FFE8E6", borderRadius: 20, marginTop: 30, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#FFD2CE" },
  sosIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  sosButtonTitle: { fontSize: 17, fontWeight: "700", color: "#FF3B30" },
  sosButtonSubtitle: { marginTop: 3, fontSize: 12, color: "#666" },
  vehicleInfoBlock: { flex: 1 },
  vehicleNumberBig: { fontSize: 22, fontWeight: "800", color: "#111" },
  vehicleModelSmall: { fontSize: 14, color: "#666", marginTop: 4 },
  codeSection: { alignItems: "flex-end" },
  codeLabel: { fontSize: 12, color: "#666", marginBottom: 6 },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
});