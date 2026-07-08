

// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Location from "expo-location";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   FlatList,
//   Image,
//   Modal,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from "react-native";
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions';
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { API_BASE_URL, WS_BASE_URL } from "../../constants/apiConfig";
// import { Key } from "../../constants/key";
// import { LIVE_TRACKING_DELTA, MAP_THEME } from "../../constants/mapTheme";
// import { Colors, Fonts, Sizes } from "../../constants/styles";
// import api from "../../services/api";

// const API_BASE = `${API_BASE_URL}/rides/trips/`;
// const WS_BASE = `${WS_BASE_URL}/ws/tracking/`;
// const GOOGLE_MAPS_API_KEY = Key.apiKey;
// const CANCELLATION_REASONS = [
//   { id: '1', label: 'Change of plans', icon: 'event-busy' },
//   { id: '2', label: 'Driver taking too long', icon: 'timer-off' },
//   { id: '3', label: 'Found another ride', icon: 'car-repair' },
//   { id: '4', label: 'Accidental booking', icon: 'error-outline' },
//   { id: '5', label: 'Price too high', icon: 'attach-money' },
//   { id: '6', label: 'Safety concerns', icon: 'security' },
//   { id: '7', label: 'Other', icon: 'more-horiz' },
// ];

// // const paymentMethods = [
// //   { id: "1", name: "Cash", icon: "attach-money", type: "cash" },
// //   { id: "2", name: "Fika Account", icon: "account-balance-wallet", type: "fika", balance: "R 245.50" },
// //   { id: "3", name: "Credit/Debit Card", icon: "credit-card", type: "card", lastFour: "4242" },
// // ];

// const paymentMethods = [
//   { id: "1", name: "Cash", icon: "attach-money", type: "cash" },
//   { id: "2", name: "Fika Account", icon: "account-balance-wallet", type: "fika"},
//   { id: "3", name: "Credit/Debit Card", icon: "credit-card", type: "card",  },
// ];


// const calculateBearing = (startLat, startLng, endLat, endLng) => {
//   const fromLat = (startLat * Math.PI) / 180;
//   const fromLng = (startLng * Math.PI) / 180;
//   const toLat = (endLat * Math.PI) / 180;
//   const toLng = (endLng * Math.PI) / 180;

//   const dLng = toLng - fromLng;

//   const y = Math.sin(dLng) * Math.cos(toLat);
//   const x = Math.cos(fromLat) * Math.sin(toLat) -
//             Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);

//   let bearing = Math.atan2(y, x);
//   bearing = (bearing * 180) / Math.PI;
//   return (bearing + 360) % 360;
// };

// const customMapTheme = MAP_THEME;

// const MapSection = ({ currentLocation, destinationCoords, showMap, mapRef ,heading}) => {
//   if (!showMap || !currentLocation || !currentLocation.latitude) return null;
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.webview}
//         customMapStyle={customMapTheme}
//         initialRegion={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         }}
//       >
//         {/* <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 1 }}>
//           <View style={styles.simpleMarker}>
//             <Ionicons name="person" size={18} color="white" />
//           </View>
//         </Marker> */}

// <Marker
//           coordinate={{
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//           }}
//           // anchor={{ x: 0.5, y: 0.5 }} // Center anchor is best for rotation
//           flat={true} // Keeps the marker flat on the map for realistic rotation
//           rotation={heading} // Rotates the marker based on movement direction
//           anchor={{ x: 0.5, y: 1 }}
//         >
//           {/* Replace this path with your actual car asset path */}
//           <Image 
//             source={require("../../assets/images/car.png")} 
//             style={{ width: 42, height: 42, resizeMode: 'contain' }}
//           />
         
//         </Marker>


//         {destinationCoords && destinationCoords.latitude !== 0 && (
//           <Marker
//             coordinate={destinationCoords}
//             image={require("../../assets/images/destination.png")}
//             anchor={{ x: 0.5, y: 0.8 }}
//             flat={true}
//         />
//         )}

//         {destinationCoords && destinationCoords.latitude !== 0 && (
//           <MapViewDirections
//             origin={currentLocation}
//             destination={destinationCoords}
//             apikey={GOOGLE_MAPS_API_KEY}
//             strokeWidth={5}
//             strokeColor='#1A202C'
//             optimizeWaypoints={true}
//             onReady={(result) => {
//               mapRef.current.fitToCoordinates(result.coordinates, {
//                 edgePadding: { top: 100, right: 50, bottom: 300, left: 59 },
//                 animated: true,
//               });
//             }}
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// const AnimatedDot = ({ delay }) => {
//   const opacity = useRef(new Animated.Value(0.3)).current;
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(opacity, { toValue: 1, duration: 500, delay: delay, useNativeDriver: true }),
//         Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);
//   return <Animated.View style={[styles.searchDot, { opacity, backgroundColor: Colors.primaryColor }]} />;
// };

// const AvailableRidesScreen = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const mapRef = useRef(null);
//   const wsRef = useRef(null);
//   const pickupAddress = params.pickupAddress || "Current Location";
//   const destinationAddress = params.destinationAddress || "Destination";
//   const rideType = params.ride_type || 'standard';
  
//   const numberOfChairs = parseInt(params.numberOfChairs) || 1;
//   const [passengerCount, setPassengerCount] = useState(1);


//   const [riderLocation, setRiderLocation] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [currentLocation] = useState({
//     latitude: parseFloat(params.lat) || 0,
//     longitude: parseFloat(params.lng) || 0,
//   });

//   const [destinationCoord] = useState({
//     latitude: parseFloat(params.destLat) || 0,
//     longitude: parseFloat(params.destLng) || 0,
//   });

//   const [selectedRide, setSelectedRide] = useState(null);
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [availableRides, setAvailableRides] = useState([]);
//   // Booking & Cancel States
//   const [isBooking, setIsBooking] = useState(false);
//   const [bookingStatus, setBookingStatus] = useState(null);
//   const [currentTripId, setCurrentTripId] = useState(null);

//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [selectedCancelReason, setSelectedCancelReason] = useState(null);
//   const [customCancelReason, setCustomCancelReason] = useState('');
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [assignedRide, setAssignedRide] = useState(null);
//   const [rideId,setRideId] =useState("");
//   const riderSocketRef = useRef(null);
//   const [pendingNavigation, setPendingNavigation] = useState(null);

  
//   useEffect(() => {
//     if (params.fareEstimates) {
//       try {
//         const parsedEstimates = JSON.parse(params.fareEstimates);
//         const vehicleTypes = [
//           { id: '1', backendType: 'economy', name: 'Fika go', type: 'Affordable everyday rides', availableSheet: 2 },
//           { id: '2', backendType: 'comfort', name: 'Fika comfort', type: 'Newer cars with extra legroom', availableSheet: 3 },
//           { id: '3', backendType: 'premium', name: 'Fika luxury', type: 'Premium luxury vehicles', availableSheet: 3 }
//         ];

//         const mappedRides = vehicleTypes.map(v => {
//           const estimate = parsedEstimates[v.backendType];
//           if (estimate) {
//             const multiplier = rideType === "shared" ? numberOfChairs : 1;
//             const finalCalculatedFare = (estimate.estimated_fare * multiplier).toFixed(2);
//             return {
//               ...v,
//               amount: `R ${finalCalculatedFare}`,
//               eta: estimate.duration_minutes ? `${Math.round(estimate.duration_minutes)} mins` : '5 mins',
//               surgeFactor: estimate.surge_multiplier || 1.0,
//             };
//           }
//           return v;
//         }).filter(ride => ride.amount);

//         setAvailableRides(mappedRides);
//       } catch (error) {
//         console.error("Failed parsing live estimates:", error);
//       }
//     }
//   }, [params.fareEstimates, rideType, numberOfChairs]);

//   useEffect(() => {
//     return () => {
//       if (wsRef.current) wsRef.current.close();
//     };
//   }, []);


  

//   // Unified Ride Booking Handler
//   const bookTrip = async () => {
//     try {
//       setIsBooking(true);
//       setBookingStatus("waiting");
  
//       const selectedRideData = availableRides.find(r => r.id === selectedRide);

//       // Construct payload precisely mapping to RideCreateSerializer
//       const tripData = {
//         pickup: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
//         dropoff: { latitude: destinationCoord.latitude, longitude: destinationCoord.longitude },
//         vehicle_type: selectedRideData.backendType,
//         passenger_count: rideType === "shared" ? numberOfChairs : 1,
//         ride_type: rideType,

//         scheduled_time: null // Explicitly force immediate dispatch
//       };

//       const response = await api.post('/rides/trips/', tripData);
//       console.log("trips:" ,response.data)

//      // SHARED RIDE JOIN REQUEST - matched into an existing pool instead of
//      // a brand new ride. The backend says so explicitly via
//      // joined_existing_pool, rather than us inferring it from which fields
//      // happen to be present.
// if (response.data?.joined_existing_pool) {

//   console.log(
//     "POOL REQUEST CREATED"
//   );

//   console.log(
//     response.data
//   );

//   // setIsBooking(false);

//   setBookingStatus(
//     "waiting_pool_approval"
//   );

//   setCurrentTripId(
//     response.data.id
//   );

//   setRideId(response.data.id);
//   connectRiderWebSocket(response.data.id, currentLocation, destinationCoord);

//   return;
// }

//       if (response.status === 201 || response.data) {
//         // Extract ride ID safely
//         const rideId = response.data.ride_id || response.data.id;
//         setRideId(rideId);
        
        
//         if (rideId) {
//           setCurrentTripId(rideId); 
//           // connectRiderWebSocket(rideId, currentLocation, destinationCoord);
//           console.log("Trip ID successfully set to:", rideId);
//           await AsyncStorage.setItem('currentTripId', String(rideId));
//           if (response.data.status === 'driver_assigned' || response.data.status === 'driver_arriving' || response.data.status === 'in_progress') {
//             setPendingNavigation({
//               pathname: "/rideTracking/rideTrackingScreen",
//               params: {
//                 rideId,
//                 role: "rider",
//                 ride_type: rideType,
//                 verification_code: response.data.verification_code || "",
//                 pickupLat: currentLocation.latitude,
//                 pickupLng: currentLocation.longitude,
//                 dropoffLat: destinationCoord.latitude,
//                 dropoffLng: destinationCoord.longitude,
//               }
//             });
//             return; // Skip waiting for socket
//          }
//           // Launch the tracking websocket with the validated variables
//           connectRiderWebSocket(rideId, currentLocation, destinationCoord);
//         } else {
//           console.error("Booking succeeded but ride_id is missing in response:", response.data);
//           setIsBooking(false);
//           Alert.alert("System Error", "Backend did not return a valid ride ID.");
//         }
//       }
//     } catch (error) {
//       setIsBooking(false);
//       console.log("Network/API Exception:", error.response?.data || error.message);
//       Alert.alert(
//         "Booking Failed", 
//         error.response?.data?.message || error.response?.data?.error || "Unable to confirm booking over network."
//       );
//     }
//   };





//   const connectRiderWebSocket = (rideId, currentLocation, destinationCoord) => {
//     AsyncStorage.getItem("userId").then((userId) => {

//       if (!userId) {
//         console.log("User ID not found");
//         return;
//       }
    
//       const socketUrl =
//         `${WS_BASE}?user_id=${userId}`;
    
//       console.log("Connecting to:", socketUrl);
    
//       const socket = new WebSocket(socketUrl);
//     socket.onopen = () => {
//       console.log("Rider successfully connected to WebSocket channel.");
//       // Join the specific ride channel group to monitor updates
//       socket.send(JSON.stringify({
//         type: "join_ride",
//         ride_id: rideId
//       }));
//     };
    
//     socket.onclose = (event) => {
//       console.log(
//         "SOCKET CLOSED",
//         event.code,
//         event.reason
//       );
//     };
    
//     socket.onerror = (error) => {
//       console.log(
//         "SOCKET ERROR",
//         JSON.stringify(error)
//       );
//     };

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Rider received WebSocket broadcast:", data);
//         console.log("VERIFICATION CODE IS:", data.verification_code);
//         console.log("Rider received WebSocket broadcast:", data);
//         console.log(
//           "FULL RIDER SOCKET MESSAGE:",
//           JSON.stringify(data, null, 2)
//         );

//         if (data.type === "driver_location") {
//           setDriverLocation({
//             latitude: data.latitude,
//             longitude: data.longitude,
//           });
//         }
//         if(data.type==="ride_started"){

//           // router.replace({
//           //    pathname:
//           //    "/rideTracking/rideTrackingRider",
       
//           //    params:{
//           //      rideId:data.ride_id,
//           //      role:"rider",
//           //      ride_type: rideType
//           //    }
//           // });
//           console.log(
//             "Ride Started"
//          );
      
//          return;
//        }

//         // Listen for ride status shifts broadcasted from ride.py (_broadcast_ride_update)
//         if (data.type === "ride_status" && data.ride_id === rideId) {
//           // If a driver is successfully matched/assigned, navigate to the tracking view

//           if (
//             data.data?.event ===
//             "passenger_joined_pool"
//           ) {
          
//             console.log(
//               "POOL REQUEST ACCEPTED"
//             );
          
//             router.replace({
//               pathname: "/rideTracking/rideTrackingScreen",
//               params: {
//                 rideId: data.ride_id,
//                 role: "rider",
//                 ride_type: "shared",
//                 pickupLat: data.data?.pickup_lat || currentLocation.latitude,
//       pickupLng: data.data?.pickup_lng || currentLocation.longitude,
//       dropoffLat: data.data?.dropoff_lat || destinationCoord.latitude,
//       dropoffLng: data.data?.dropoff_lng || destinationCoord.longitude
//               }
//             });
          
//             return;
//           }
//           setPendingNavigation({
//             pathname: "/rideTracking/rideTrackingScreen",
//             params: {
//               rideId,
//               role: "rider",
//               ride_type: rideType,
//               verification_code: data.verification_code || "",
//               pickupLat: currentLocation.latitude,
//               pickupLng: currentLocation.longitude,
//               dropoffLat: destinationCoord.latitude,
//               dropoffLng: destinationCoord.longitude,
//             },
//           });
//           return;
//         }
//       } catch (err) {
//         console.error("Failed to decode incoming WebSocket frame:", err);
//       }
//     };


//     riderSocketRef.current=socket;
//   });
// };


// useEffect(() => {
//   if (!rideId) return;

//   const checkStatus = async () => {
//     try {
//       const response = await api.get(`/rides/trips/${rideId}/`);
//       const ride = response.data;

//       if (ride.status === 'driver_assigned' || ride.status === 'accepted' || ride.status === 'started') {
//         setIsBooking(false); // ✅ FIX: Use the correct state setter from your file
        
//         // Redirect to the correct nested route
//         router.replace({
//           pathname: "/rideTracking/rideTrackingScreen", // ✅ FIX: Added missing /rideTracking/ path
//           params: {
//             rideId: ride.id,
//             role: "rider",
//             ride_type: rideType,
//             pickupLat: currentLocation.latitude,
//             pickupLng: currentLocation.longitude,
//             dropoffLat: destinationCoord.latitude,
//             dropoffLng: destinationCoord.longitude,
//           }
//         });
//       }
//     } catch (error) {
//       console.error("Error checking ride status:", error);
//     }
//   };

//   const interval = setInterval(checkStatus, 3000);
//   return () => clearInterval(interval);
// }, [rideId]);


// useEffect(() => {
//   if (pendingNavigation) {
//       // This will only run when the component is fully mounted/ready
//       router.replace(pendingNavigation); 
//       // Reset the trigger so it doesn't loop
//       setPendingNavigation(null); 
//   }
// }, [pendingNavigation]);



// useEffect(() => {

//   let subscription;

//   const startTracking = async () => {

//      const { status } =
//         await Location.requestForegroundPermissionsAsync();

//      if (status !== "granted") return;

//      subscription =
//         await Location.watchPositionAsync(
//            {
//               accuracy: Location.Accuracy.High,
//               timeInterval: 5000,
//               distanceInterval: 5,
//            },
//            (location) => {

//               sendRiderLocation({
//                  latitude: location.coords.latitude,
//                  longitude: location.coords.longitude,
//               });

//            }
//         );
//   };

//   if (currentTripId) {
//      startTracking();
//   }

//   return () => {
//      subscription?.remove();
//   };

// }, [currentTripId]);


// const sendRiderLocation = (location) => {

//   if (
//     riderSocketRef.current &&
//     riderSocketRef.current.readyState === WebSocket.OPEN
//   ) {
//     riderSocketRef.current.send(
//       JSON.stringify({
//         type: "rider_location_update",
//         ride_id: currentTripId,
//         latitude: location.latitude,
//         longitude: location.longitude,
//       })
//     );
//   }
// };



// useEffect(() => {
//   return () => {
//     if (riderSocketRef.current) {
//       riderSocketRef.current.close();
//     }
//   };
// }, []);


//   // Handle Ride Booking

//   // Handle Cancel Reason Selection
//   const handleReasonSelect = (reason) => {
//     setSelectedCancelReason(reason);
//     if (reason.label !== 'Other') {
//       setCustomCancelReason('');
//     }
//   };

//   // Validate and Submit Cancellation
//   const submitCancellation = () => {
//     if (!selectedCancelReason) {
//       Alert.alert('Error', 'Please select a reason for cancellation');
//       return;
//     }
    
//     let finalReason = selectedCancelReason.label;
//     let note = '';
    
//     if (selectedCancelReason.label === 'Other') {
//       if (!customCancelReason.trim()) {
//         Alert.alert('Error', 'Please provide a reason for cancellation');
//         return;
//       }
//       note = customCancelReason.trim();
//     }
    
//     cancelRide(finalReason, note);
//   };

//   // Process Cancellation with Backend
//   const cancelRide = async (reason, note) => {
//     setIsCancelling(true);
//     try {
//       // Endpoint mapped to the cancel action in RideViewSet
//       await api.post(`/rides/trips/${currentTripId}/cancel/`, {
//         reason: reason, //
//         note: note //
//       });
      
//       setShowCancelModal(false);
//       setIsBooking(false);
//       setBookingStatus(null);
//       setCurrentTripId(null);
//       Alert.alert("Ride Cancelled", "Your ride request has been cancelled.");
//       router.back();
//     } catch (err) {
//       Alert.alert('Error', 'Failed to cancel the ride on the server.');
//     } finally {
//       setIsCancelling(false);
//     }
//   };

//   const renderWaitingState = () => (
//     <View style={styles.waitingContainer}>
//       <View style={styles.waitingOverlay}>
//         <View style={styles.waitingCard}>
//           <ActivityIndicator size="large" color={Colors.primaryColor} style={styles.waitingSpinner} />
          
//           <Text style={styles.waitingTitle}>
//             {bookingStatus === "waiting" ? "Finding your driver..." : "Ride Requested"}
//           </Text>
          
//           <Text style={styles.waitingMessage}>
//             {bookingStatus === 'waiting' 
//               ? 'Please wait while we connect you with a nearby driver'
//               : 'Your ride has been requested. We\'ll notify you when a driver accepts.'}
//           </Text>

//           {bookingStatus === 'waiting' && (
//             <View style={styles.waitingTimeContainer}>
//               <MaterialIcons name="schedule" size={18} color={Colors.grayColor} />
//               <Text style={styles.waitingTimeText}>
//                 Estimated wait time: 2-5 minutes
//               </Text>
//             </View>
//           )}

//           <View style={styles.statusContainer}>
//             <View style={[styles.statusDot, { backgroundColor: bookingStatus === 'waiting' ? Colors.primaryColor : Colors.greenColor }]} />
//             <Text style={styles.statusText}>
//               {bookingStatus === 'waiting' ? 'Searching for drivers...' : 'Driver assignment pending'}
//             </Text>
//           </View>

//           {bookingStatus === 'waiting' && (
//             <View style={styles.searchAnimationContainer}>
//               <AnimatedDot delay={0} />
//               <AnimatedDot delay={300} />
//               <AnimatedDot delay={600} />
//             </View>
//           )}

//           {bookingStatus === 'waiting' && (
//             <TouchableOpacity 
//               style={styles.cancelWaitingButton}
//               onPress={() => setShowCancelModal(true)}
//             >
//               <Text style={styles.cancelWaitingText}>Cancel Request</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </View>
//   );

//   const renderCancelReasonModal = () => (
//     <Modal
//       visible={showCancelModal}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={() => setShowCancelModal(false)}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.cancelModalContainer}>
//           <View style={styles.cancelModalHeader}>
//             <Text style={styles.cancelModalTitle}>Cancel Ride</Text>
//             <TouchableOpacity onPress={() => setShowCancelModal(false)}>
//               <Ionicons name="close" size={24} color={Colors.blackColor} />
//             </TouchableOpacity>
//           </View>
          
//           <Text style={styles.cancelModalSubtitle}>
//             Please tell us why you're cancelling
//           </Text>
          
//           <FlatList
//             data={CANCELLATION_REASONS}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.reasonItem,
//                   selectedCancelReason?.id === item.id && styles.selectedReasonItem
//                 ]}
//                 onPress={() => handleReasonSelect(item)}
//               >
//                 <MaterialIcons 
//                   name={item.icon} 
//                   size={24} 
//                   color={selectedCancelReason?.id === item.id ? Colors.primaryColor : Colors.grayColor} 
//                 />
//                 <Text style={[
//                   styles.reasonText,
//                   selectedCancelReason?.id === item.id && styles.selectedReasonText
//                 ]}>
//                   {item.label}
//                 </Text>
//                 {selectedCancelReason?.id === item.id && (
//                   <MaterialIcons name="check-circle" size={20} color={Colors.primaryColor} />
//                 )}
//               </TouchableOpacity>
//             )}
//           />
          
//           {selectedCancelReason?.label === 'Other' && (
//             <View style={styles.customReasonContainer}>
//               <TextInput
//                 style={styles.customReasonInput}
//                 placeholder="Please specify your reason..."
//                 placeholderTextColor={Colors.grayColor}
//                 value={customCancelReason}
//                 onChangeText={setCustomCancelReason}
//                 multiline={true}
//                 numberOfLines={3}
//               />
//             </View>
//           )}
          
//           <View style={styles.cancelModalButtons}>
//             <TouchableOpacity
//               style={styles.cancelModalKeepButton}
//               onPress={() => setShowCancelModal(false)}
//             >
//               <Text style={styles.cancelModalKeepText}>Keep Ride</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cancelModalConfirmButton,
//                 (!selectedCancelReason || (selectedCancelReason.label === 'Other' && !customCancelReason.trim())) && 
//                 styles.disabledCancelButton
//               ]}
//               onPress={submitCancellation}
//               disabled={!selectedCancelReason || (selectedCancelReason.label === 'Other' && !customCancelReason.trim()) || isCancelling}
//             >
//               {isCancelling ? (
//                 <ActivityIndicator size="small" color={Colors.whiteColor} />
//               ) : (
//                 <Text style={styles.cancelModalConfirmText}>Confirm Cancellation</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       activeOpacity={0.8}
//       onPress={() => setSelectedRide(item.id)}
//       style={[styles.rideCard, selectedRide === item.id && styles.selectedRideCard]}
//     >
//       <View style={styles.rideLeft}>
//         <View style={styles.vehicleIconContainer}>
//           <MaterialIcons name="directions-car" size={40} color={Colors.primaryColor} />
//         </View>
//         <View style={styles.rideInfo}>
//           <Text style={styles.rideName}>{item.name}</Text>
//           <Text style={styles.rideType}>{item.type}</Text>
//           <View style={styles.etaContainer}>
//             <Ionicons name="time-outline" size={14} color={Colors.grayColor} />
//             <Text style={styles.etaText}>{item.eta}</Text>
//           </View>
//         </View>
//       </View>
//       <View style={styles.rideRight}>
//         <View>
//           <Text style={styles.amount}>{item.amount}</Text>
//           {item.surgeFactor > 1 && <Text style={styles.surgeText}>{item.surgeFactor}x surge</Text>}
//         </View>
//         <View style={styles.seatsContainer}>
//           <Text style={styles.seatCount}>{item.availableSheet} seats max</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color={Colors.whiteColor} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Choose Your Ride</Text>
//         <TouchableOpacity style={styles.paymentHeaderButton} onPress={() => setShowPaymentModal(true)}>
//           <MaterialIcons name="payment" size={24} color={Colors.whiteColor} />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.mapContainer}>
//         <MapSection currentLocation={currentLocation} destinationCoords={destinationCoord} showMap={true} mapRef={mapRef} />
        
//         <View style={styles.routeHeaderOverlay}>
//           <View style={styles.routePill}>
//             <Text style={styles.routeAddress} numberOfLines={1}>{pickupAddress}</Text>
//           </View>
//           <FontAwesome name="long-arrow-right" color="#000" size={24} />
//           <View style={[styles.routePill, { borderColor: '#e71d36', marginLeft: 8 }]}>
//             <Text style={styles.routeAddress} numberOfLines={1}>{destinationAddress}</Text>
//           </View>
//         </View>
//       </View>

//       <View style={styles.ridesContainer}>
//         <Text style={styles.sectionTitle}>Available Rides</Text>
//         {availableRides.length === 0 ? (
//            <ActivityIndicator size="small" color={Colors.primaryColor} style={{ marginTop: 20 }} />
//         ) : (
//           <FlatList 
//             data={availableRides} 
//             keyExtractor={(item) => item.id} 
//             renderItem={renderItem} 
//             showsVerticalScrollIndicator={false} 
//             contentContainerStyle={styles.ridesList} 
//           />
//         )}
        
//         <TouchableOpacity style={styles.paymentMethodDisplay} onPress={() => setShowPaymentModal(true)}>
//           <View style={styles.paymentMethodDisplayLeft}>
//             <MaterialIcons name={selectedPaymentMethod?.icon || "payment"} size={20} color={selectedPaymentMethod ? Colors.primaryColor : Colors.grayColor} />
//             <Text style={styles.paymentMethodDisplayText}>
//               {selectedPaymentMethod ? selectedPaymentMethod.name : "Choose Payment Method"}
//             </Text>
//           </View>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={[styles.confirmButton, (!selectedRide || !selectedPaymentMethod) && styles.disabledButton]}
//           disabled={!selectedRide || !selectedPaymentMethod}
//           onPress={bookTrip}
//         >
//           <Text style={styles.confirmButtonText}>
//             {selectedRide && selectedPaymentMethod ? `Confirm ${availableRides.find(r => r.id === selectedRide)?.name}` : 'Select Ride & Payment'}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Payment Selection Modal */}
//       <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Choose Payment Method</Text>
//             <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.closeButton}>
//               <Ionicons name="close" size={24} color={Colors.blackColor} />
//             </TouchableOpacity>
//           </View>
//           <FlatList
//             data={paymentMethods}
//             keyExtractor={(item) => item.id}
//             contentContainerStyle={styles.paymentMethodsList}
//             renderItem={({ item }) => {
//               const isSelected = selectedPaymentMethod?.id === item.id;
//               return (
//                 <TouchableOpacity 
//                   style={[
//                     styles.paymentMethodCard, 
//                     isSelected && { borderColor: Colors.primaryColor, backgroundColor: Colors.primaryColor + '10' }
//                   ]} 
//                   onPress={() => { 
//                     setSelectedPaymentMethod(item); 
//                     setShowPaymentModal(false); 
//                   }}
//                 >
//                   <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
//                     <MaterialIcons 
//                       name={item.icon} 
//                       size={24} 
//                       color={Colors.primaryColor} 
//                       style={{ marginRight: Sizes.fixPadding }} 
//                     />
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.paymentMethodName}>{item.name}</Text>
//                       {item.balance && <Text style={{ ...Fonts.primaryColor14Medium, marginTop: 2 }}>{item.balance}</Text>}
//                       {item.lastFour && <Text style={{ ...Fonts.grayColor12Medium, marginTop: 2 }}>•••• {item.lastFour}</Text>}
//                     </View>
//                   </View>
//                   {isSelected && <MaterialIcons name="check-circle" size={24} color={Colors.primaryColor} />}
//                 </TouchableOpacity>
//               );
//             }}
//           />
//         </SafeAreaView>
//       </Modal>

//       {/* Booking State & Cancellation Modals */}
//       {isBooking && renderWaitingState()}
//       {showCancelModal && renderCancelReasonModal()}

//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.whiteColor },
//   simpleMarker: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#22C55E', borderWidth: 4, borderColor: '#FF8811', justifyContent: 'center', alignItems: 'center' },
//   header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Sizes.fixPadding * 2, paddingVertical: Sizes.fixPadding + 5, backgroundColor: Colors.primaryColor },
//   backButton: { padding: Sizes.fixPadding - 5 },
//   headerTitle: { ...Fonts.whiteColor18Bold, textAlign: "center" },
//   paymentHeaderButton: { padding: Sizes.fixPadding - 5 },
//   mapContainer: { flex: 1, position: "relative" },
//   webview: { flex: 1 },
//   routeHeaderOverlay: { top: Sizes.fixPadding * 2, paddingLeft: 6, flexDirection: "row", alignItems: 'center', position: "absolute", zIndex: 5 },
//   routePill: { width: 170, borderColor: '#368f8b', backgroundColor: Colors.whiteColor, borderWidth: 2, borderRadius: 20, marginRight: 8, paddingHorizontal: 10 },
//   routeAddress: { ...Fonts.blackColor14SemiBold, fontSize: 14, paddingVertical: 8 },
//   ridesContainer: { flex: 1, backgroundColor: Colors.bodyBackColor, borderTopLeftRadius: Sizes.fixPadding * 2, borderTopRightRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 2 },
//   sectionTitle: { ...Fonts.blackColor16Bold, marginBottom: Sizes.fixPadding * 1.5 },
//   ridesList: { paddingBottom: Sizes.fixPadding },
//   rideCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, marginBottom: Sizes.fixPadding, borderWidth: 2, borderColor: "transparent" },
//   selectedRideCard: { borderColor: Colors.primaryColor },
//   rideLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
//   vehicleIconContainer: { width: 50, height: 50, marginRight: Sizes.fixPadding, justifyContent: 'center', alignItems: 'center' },
//   rideInfo: { flex: 1 },
//   rideName: { ...Fonts.blackColor16SemiBold, marginBottom: 2 },
//   rideType: { ...Fonts.grayColor13Medium, marginBottom: 4 },
//   etaContainer: { flexDirection: "row", alignItems: "center" },
//   etaText: { ...Fonts.grayColor12Medium, marginLeft: 4 },
//   rideRight: { alignItems: "flex-end" },
//   amount: { ...Fonts.blackColor18Bold, marginBottom: Sizes.fixPadding - 5 },
//   surgeText: { ...Fonts.redColor10Medium },
//   seatsContainer: { flexDirection: "row", alignItems: "center" },
//   seatCount: { ...Fonts.grayColor10Medium, marginLeft: 4 },
//   paymentMethodDisplay: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, marginTop: Sizes.fixPadding, borderWidth: 1, borderColor: Colors.lightGrayColor },
//   paymentMethodDisplayLeft: { flexDirection: "row", alignItems: "center" },
//   paymentMethodDisplayText: { ...Fonts.blackColor14SemiBold, marginLeft: Sizes.fixPadding },
//   confirmButton: { backgroundColor: Colors.secondaryColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding + 5, alignItems: "center", marginTop: Sizes.fixPadding },
//   disabledButton: { backgroundColor: Colors.lightGrayColor },
//   confirmButtonText: { ...Fonts.whiteColor16Bold },
//   modalContainer: { flex: 1, backgroundColor: Colors.whiteColor },
//   modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Sizes.fixPadding * 2, paddingVertical: Sizes.fixPadding + 5, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayColor },
//   modalTitle: { ...Fonts.blackColor18Bold },
//   closeButton: { padding: Sizes.fixPadding - 5 },
//   paymentMethodsList: { padding: Sizes.fixPadding * 2 },
//   paymentMethodCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, borderWidth: 1, borderColor: Colors.lightGrayColor, flex: 1, marginBottom: 10 },
//   paymentMethodName: { ...Fonts.blackColor16SemiBold },
  
//   /* Waiting Modal Styles */
//   waitingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
//   waitingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Sizes.fixPadding * 2 },
//   waitingCard: { backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 3, width: '100%', alignItems: 'center' },
//   waitingSpinner: { marginBottom: Sizes.fixPadding * 2 },
//   waitingTitle: { ...Fonts.blackColor20Bold, marginBottom: Sizes.fixPadding },
//   waitingMessage: { ...Fonts.grayColor14Medium, textAlign: 'center', marginBottom: Sizes.fixPadding * 1.5 },
//   waitingTimeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGrayColor + '30', paddingHorizontal: Sizes.fixPadding, paddingVertical: Sizes.fixPadding - 2, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding * 2 },
//   waitingTimeText: { ...Fonts.grayColor12Medium, marginLeft: Sizes.fixPadding - 5 },
//   statusContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGrayColor + '20', paddingHorizontal: Sizes.fixPadding, paddingVertical: Sizes.fixPadding - 2, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding * 2 },
//   statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: Sizes.fixPadding - 5 },
//   statusText: { ...Fonts.grayColor12Medium },
//   searchAnimationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: Sizes.fixPadding * 2 },
//   searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryColor, marginHorizontal: 4 },
//   cancelWaitingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.redColor, borderRadius: Sizes.fixPadding, paddingVertical: Sizes.fixPadding, paddingHorizontal: Sizes.fixPadding * 2 },
//   cancelWaitingText: { ...Fonts.redColor14Bold },
  
//   /* Cancel Modal Styles */
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
//   cancelModalContainer: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: Sizes.fixPadding * 2, borderTopRightRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 2, maxHeight: '80%' },
//   cancelModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.fixPadding },
//   cancelModalTitle: { ...Fonts.blackColor20Bold },
//   cancelModalSubtitle: { ...Fonts.grayColor14Medium, marginBottom: Sizes.fixPadding * 2 },
//   reasonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sizes.fixPadding, paddingHorizontal: Sizes.fixPadding, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding - 5 },
//   selectedReasonItem: { backgroundColor: Colors.primaryColor + '10' },
//   reasonText: { ...Fonts.blackColor16Medium, marginLeft: Sizes.fixPadding, flex: 1 },
//   selectedReasonText: { ...Fonts.primaryColor16Medium },
//   customReasonContainer: { marginTop: Sizes.fixPadding, marginBottom: Sizes.fixPadding },
//   customReasonInput: { borderWidth: 1, borderColor: Colors.lightGrayColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding, ...Fonts.blackColor14Medium, minHeight: 80, textAlignVertical: 'top' },
//   cancelModalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Sizes.fixPadding * 2, gap: Sizes.fixPadding },
//   cancelModalKeepButton: { flex: 1, paddingVertical: Sizes.fixPadding + 2, borderRadius: Sizes.fixPadding, borderWidth: 1, borderColor: Colors.primaryColor, alignItems: 'center' },
//   cancelModalKeepText: { ...Fonts.primaryColor16Bold },
//   cancelModalConfirmButton: { flex: 1, paddingVertical: Sizes.fixPadding + 2, borderRadius: Sizes.fixPadding, backgroundColor: Colors.redColor, alignItems: 'center' },
//   cancelModalConfirmText: { ...Fonts.whiteColor16Bold },
//   disabledCancelButton: { backgroundColor: Colors.lightGrayColor, opacity: 0.7 },
// });

// export default AvailableRidesScreen;



import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL, WS_BASE_URL } from "../../constants/apiConfig";
import { Key } from "../../constants/key";
import { LIVE_TRACKING_DELTA, MAP_THEME } from "../../constants/mapTheme";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import { VEHICLE_TYPES } from "../../constants/vehicleTypes";
import api from "../../services/api";

const API_BASE = `${API_BASE_URL}/rides/trips/`;
const WS_BASE = `${WS_BASE_URL}/ws/tracking/`;
const GOOGLE_MAPS_API_KEY = Key.apiKey;
const CANCELLATION_REASONS = [
  { id: '1', label: 'Change of plans', icon: 'event-busy' },
  { id: '2', label: 'Driver taking too long', icon: 'timer-off' },
  { id: '3', label: 'Found another ride', icon: 'car-repair' },
  { id: '4', label: 'Accidental booking', icon: 'error-outline' },
  { id: '5', label: 'Price too high', icon: 'attach-money' },
  { id: '6', label: 'Safety concerns', icon: 'security' },
  { id: '7', label: 'Other', icon: 'more-horiz' },
];

const paymentMethods = [
  { id: "1", name: "Cash", icon: "attach-money", type: "cash" },
  { id: "2", name: "Fika Account", icon: "account-balance-wallet", type: "fika"},
  { id: "3", name: "Credit/Debit Card", icon: "credit-card", type: "card",  },
];

const calculateBearing = (startLat, startLng, endLat, endLng) => {
  const fromLat = (startLat * Math.PI) / 180;
  const fromLng = (startLng * Math.PI) / 180;
  const toLat = (endLat * Math.PI) / 180;
  const toLng = (endLng * Math.PI) / 180;

  const dLng = toLng - fromLng;

  const y = Math.sin(dLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) -
            Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  return (bearing + 360) % 360;
};

const customMapTheme = MAP_THEME;

const MapSection = ({ currentLocation, destinationCoords, showMap, mapRef ,heading = 0}) => {
  if (!showMap || !currentLocation || !currentLocation.latitude) return null;
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.webview}
        customMapStyle={customMapTheme}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          flat={true} 
          rotation={heading} 
          anchor={{ x: 0.5, y: 1 }}
        >
          <Image 
            source={require("../../assets/images/car.png")} 
            style={{ width: 42, height: 42, resizeMode: 'contain' }}
          />
        </Marker>

        {destinationCoords && destinationCoords.latitude !== 0 && (
          <Marker
            coordinate={destinationCoords}
            image={require("../../assets/images/destination.png")}
            anchor={{ x: 0.5, y: 0.8 }}
            flat={true}
        />
        )}

        {destinationCoords && destinationCoords.latitude !== 0 && (
          <MapViewDirections
            origin={currentLocation}
            destination={destinationCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor='#1A202C'
            optimizeWaypoints={true}
            // onReady={(result) => {
            //   mapRef.current.fitToCoordinates(result.coordinates, {
            //     edgePadding: { top: 100, right: 50, bottom: 300, left: 59 },
            //     animated: true,
            //   });
            // }}
            onReady={(result) => {
              if (mapRef && mapRef.current) {
                // Fix 1: Defer running the function by 200ms to allow layout engine to catch up
                setTimeout(() => {
                  mapRef.current.fitToCoordinates(
                    result.coordinates,
                    {
                      // Fix 2: Lowered excessive bottom padding so coordinates fit small viewports safely
                      edgePadding: {
                        top: 60,
                        right: 60,
                        bottom: 80, 
                        left: 60,
                      },
                      animated: true,
                    }
                  );
                }, 200);
              }
            }}
            onError={(errorMessage) => {
              console.log("MapViewDirections Error: ", errorMessage);
            }}
          />
        )}
            
      </MapView>
    </View>
  );
};

const AnimatedDot = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay: delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.searchDot, { opacity, backgroundColor: Colors.primaryColor }]} />;
};

const AvailableRidesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const pickupAddress = params.pickupAddress || "Current Location";
  const destinationAddress = params.destinationAddress || "Destination";
  const rideType = params.ride_type || 'standard';
  
  const numberOfChairs = parseInt(params.numberOfChairs) || 1;
  const [passengerCount, setPassengerCount] = useState(1);

  const [riderLocation, setRiderLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [currentLocation] = useState({
    latitude: parseFloat(params.lat) || 0,
    longitude: parseFloat(params.lng) || 0,
  });

  const [destinationCoord] = useState({
    latitude: parseFloat(params.destLat) || 0,
    longitude: parseFloat(params.destLng) || 0,
  });

  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [currentTripId, setCurrentTripId] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(null);
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [assignedRide, setAssignedRide] = useState(null);
  const [rideId,setRideId] =useState("");
  const riderSocketRef = useRef(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    if (params.fareEstimates) {
      try {
        const parsedEstimates = JSON.parse(params.fareEstimates);
        
        // Backend mapping replacement
        const vehicleTypes = VEHICLE_TYPES.map((v, i) => ({
          id: String(i + 1),
          backendType: v.key,
          name: v.name,
          type: v.description,
          availableSheet: v.seats,
          premium: v.premium,
        }));

        const mappedRides = vehicleTypes.map(v => {
          const estimate = parsedEstimates[v.backendType];
          if (estimate) {
            const multiplier = rideType === "shared" ? numberOfChairs : 1;
            const finalCalculatedFare = (estimate.estimated_fare * multiplier).toFixed(2);
            return {
              ...v,
              amount: `R ${finalCalculatedFare}`,
              eta: estimate.duration_minutes ? `${Math.round(estimate.duration_minutes)} mins` : '5 mins',
              surgeFactor: estimate.surge_multiplier || 1.0,
            };
          }
          return v;
        }).filter(ride => ride.amount);

        setAvailableRides(mappedRides);
      } catch (error) {
        console.error("Failed parsing live estimates:", error);
      }
    }
  }, [params.fareEstimates, rideType, numberOfChairs]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const bookTrip = async () => {
    try {
      setIsBooking(true);
      setBookingStatus("waiting");
  
      const selectedRideData = availableRides.find(r => r.id === selectedRide);

      const tripData = {
        pickup: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        dropoff: { latitude: destinationCoord.latitude, longitude: destinationCoord.longitude },
        vehicle_type: selectedRideData.backendType,
        passenger_count: rideType === "shared" ? numberOfChairs : 1,
        ride_type: rideType,
        scheduled_time: null 
      };

      const response = await api.post('/rides/trips/', tripData);

      if (response.data?.joined_existing_pool) {
        // setIsBooking(false);
        setBookingStatus("waiting_pool_approval");
        const poolRideId = response.data.id;
        setCurrentTripId(poolRideId);
        connectRiderWebSocket(poolRideId, currentLocation, destinationCoord);
        return;
      }

      if (response.status === 201 || response.data) {
        const rideId = response.data.ride_id || response.data.id;
        setRideId(rideId);
        
        if (rideId) {
          setCurrentTripId(rideId); 
          await AsyncStorage.setItem('currentTripId', String(rideId));
          connectRiderWebSocket(rideId, currentLocation, destinationCoord);
        } else {
          setIsBooking(false);
          Alert.alert("System Error", "Backend did not return a valid ride ID.");
        }
      }
    } catch (error) {
      setIsBooking(false);
      Alert.alert(
        "Booking Failed", 
        error.response?.data?.message || error.response?.data?.error || "Unable to confirm booking over network."
      );
    }
  };

  const connectRiderWebSocket = (rideId, currentLocation, destinationCoord) => {
    SecureStore.getItemAsync("userToken").then((accessToken) => {
      if (!accessToken) return;

      const socketUrl = `${WS_BASE}?token=${encodeURIComponent(accessToken)}`;
      const socket = new WebSocket(socketUrl);
      
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "join_ride",
          ride_id: rideId
        }));
      };
    
      socket.onclose = (event) => console.log("SOCKET CLOSED", event.code, event.reason);
      socket.onerror = (error) => console.log("SOCKET ERROR", JSON.stringify(error));

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "driver_location") {
            setDriverLocation({
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
          
          if (data.type === "ride_started") {
            return;
          }

          if (data.type === "ride_status" && data.ride_id === rideId) {
            if (data.data?.event === "passenger_joined_pool") {
              router.replace({
                pathname: "/rideTracking/rideTrackingScreen",
                params: {
                  rideId: data.ride_id || rideId,
                  role: "rider",
                  ride_type: "shared",
                  pickupLat: currentLocation.latitude,
                  pickupLng: currentLocation.longitude,
                  dropoffLat: destinationCoord.latitude,
                  dropoffLng: destinationCoord.longitude,
                }
              });
              return;
            }
            
            if (data.status === "driver_assigned" || data.status === "driver_arriving") {
              router.replace({
                pathname: "/rideTracking/rideTrackingScreen",
                params: {
                  rideId,
                  role: "rider",
                  ride_type: rideType,
                  verification_code: data.verification_code || "",
                  pickupLat: currentLocation.latitude,
                  pickupLng: currentLocation.longitude,
                  dropoffLat: destinationCoord.latitude,
                  dropoffLng: destinationCoord.longitude,
                },
              });
              return;
            }
          }
        } catch (err) {
          console.error("Failed to decode incoming WebSocket frame:", err);
        }
      };

      riderSocketRef.current = socket;
    });
  };

  useEffect(() => {
    if (pendingNavigation) {
        router.replace(pendingNavigation); 
        setPendingNavigation(null); 
    }
  }, [pendingNavigation]);

  useEffect(() => {
    let subscription;
    const startTracking = async () => {
       const { status } = await Location.requestForegroundPermissionsAsync();
       if (status !== "granted") return;

       subscription = await Location.watchPositionAsync(
             {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 5,
             },
             (location) => {
                sendRiderLocation({
                   latitude: location.coords.latitude,
                   longitude: location.coords.longitude,
                });
             }
          );
    };

    if (currentTripId) {
       startTracking();
    }
    return () => { subscription?.remove(); };
  }, [currentTripId]);

  const sendRiderLocation = (location) => {
    if (riderSocketRef.current && riderSocketRef.current.readyState === WebSocket.OPEN) {
      riderSocketRef.current.send(
        JSON.stringify({
          type: "rider_location_update",
          ride_id: currentTripId,
          latitude: location.latitude,
          longitude: location.longitude,
        })
      );
    }
  };

  useEffect(() => {
    return () => {
      if (riderSocketRef.current) riderSocketRef.current.close();
    };
  }, []);

  const handleReasonSelect = (reason) => {
    setSelectedCancelReason(reason);
    if (reason.label !== 'Other') {
      setCustomCancelReason('');
    }
  };

  const submitCancellation = () => {
    if (!selectedCancelReason) {
      Alert.alert('Error', 'Please select a reason for cancellation');
      return;
    }
    
    let finalReason = selectedCancelReason.label;
    let note = '';
    
    if (selectedCancelReason.label === 'Other') {
      if (!customCancelReason.trim()) {
        Alert.alert('Error', 'Please provide a reason for cancellation');
        return;
      }
      note = customCancelReason.trim();
    }
    
    cancelRide(finalReason, note);
  };

  const cancelRide = async (reason, note) => {
    if (!currentTripId) {
      Alert.alert('Please wait', "Still sending your request - try cancelling again in a moment.");
      setShowCancelModal(false);
      return;
    }
    setIsCancelling(true);
    try {
      await api.post(`/rides/trips/${currentTripId}/cancel/`, {
        reason: reason, 
        note: note 
      });
      
      setShowCancelModal(false);
      setIsBooking(false);
      setBookingStatus(null);
      setCurrentTripId(null);
      Alert.alert("Ride Cancelled", "Your ride request has been cancelled.");
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to cancel the ride on the server.');
    } finally {
      setIsCancelling(false);
    }
  };

  const renderWaitingState = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.waitingOverlay}>
        <View style={styles.waitingCard}>
          <ActivityIndicator size="large" color={Colors.primaryColor} style={styles.waitingSpinner} />
          
          <Text style={styles.waitingTitle}>
            {bookingStatus === "waiting" ? "Finding your driver..." : "Ride Requested"}
          </Text>
          
          <Text style={styles.waitingTitle}>
            {bookingStatus === "waiting" ? "Finding your driver..." : 
             bookingStatus === "waiting_pool_approval" ? "Joining Shared Pool..." : 
             "Ride Requested"}
          </Text>

          {(bookingStatus === 'waiting' || bookingStatus === 'waiting_pool_approval') && (
            <View style={styles.waitingTimeContainer}>
              <MaterialIcons name="schedule" size={18} color={Colors.grayColor} />
              <Text style={styles.waitingTimeText}>
                Estimated wait time: 2-5 minutes
              </Text>
            </View>
          )}

          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: bookingStatus === 'waiting' ? Colors.primaryColor : Colors.greenColor }]} />
            <Text style={styles.statusText}>
              {bookingStatus === 'waiting' ? 'Searching for drivers...' : 'Driver assignment pending'}
            </Text>
          </View>

          {bookingStatus === 'waiting' && (
            <View style={styles.searchAnimationContainer}>
              <AnimatedDot delay={0} />
              <AnimatedDot delay={300} />
              <AnimatedDot delay={600} />
            </View>
          )}

          {bookingStatus === 'waiting' && (
            <TouchableOpacity 
              style={[styles.cancelWaitingButton, !currentTripId && { opacity: 0.5 }]}
              onPress={() => currentTripId && setShowCancelModal(true)}
            >
              <Text style={styles.cancelWaitingText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderCancelReasonModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cancelModalContainer}>
          <View style={styles.cancelModalHeader}>
            <Text style={styles.cancelModalTitle}>Cancel Ride</Text>
            <TouchableOpacity onPress={() => setShowCancelModal(false)}>
              <Ionicons name="close" size={24} color={Colors.blackColor} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.cancelModalSubtitle}>
            Please tell us why you're cancelling
          </Text>
          
          <FlatList
            data={CANCELLATION_REASONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.reasonItem,
                  selectedCancelReason?.id === item.id && styles.selectedReasonItem
                ]}
                onPress={() => handleReasonSelect(item)}
              >
                <MaterialIcons 
                  name={item.icon} 
                  size={24} 
                  color={selectedCancelReason?.id === item.id ? Colors.primaryColor : Colors.grayColor} 
                />
                <Text style={[
                  styles.reasonText,
                  selectedCancelReason?.id === item.id && styles.selectedReasonText
                ]}>
                  {item.label}
                </Text>
                {selectedCancelReason?.id === item.id && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primaryColor} />
                )}
              </TouchableOpacity>
            )}
          />
          
          {selectedCancelReason?.label === 'Other' && (
            <View style={styles.customReasonContainer}>
              <TextInput
                style={styles.customReasonInput}
                placeholder="Please specify your reason..."
                placeholderTextColor={Colors.grayColor}
                value={customCancelReason}
                onChangeText={setCustomCancelReason}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          )}
          
          <View style={styles.cancelModalButtons}>
            <TouchableOpacity
              style={styles.cancelModalKeepButton}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.cancelModalKeepText}>Keep Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.cancelModalConfirmButton,
                (!selectedCancelReason || (selectedCancelReason.label === 'Other' && !customCancelReason.trim())) && 
                styles.disabledCancelButton
              ]}
              onPress={submitCancellation}
              disabled={!selectedCancelReason || (selectedCancelReason.label === 'Other' && !customCancelReason.trim()) || isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={Colors.whiteColor} />
              ) : (
                <Text style={styles.cancelModalConfirmText}>Confirm Cancellation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setSelectedRide(item.id)}
      style={[styles.rideCard, selectedRide === item.id && styles.selectedRideCard]}
    >
      <View style={styles.rideLeft}>
        <View style={styles.vehicleIconContainer}>
          <MaterialIcons name="directions-car" size={40} color={Colors.primaryColor} />
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.rideName}>{item.name}</Text>
          <Text style={styles.rideType}>{item.type}</Text>
          <View style={styles.etaContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.grayColor} />
            <Text style={styles.etaText}>{item.eta}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rideRight}>
        <View>
          <Text style={styles.amount}>{item.amount}</Text>
          {item.surgeFactor > 1 && <Text style={styles.surgeText}>{item.surgeFactor}x surge</Text>}
        </View>
        <View style={styles.seatsContainer}>
          <Text style={styles.seatCount}>{item.availableSheet} seats max</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.whiteColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Ride</Text>
        <TouchableOpacity style={styles.paymentHeaderButton} onPress={() => setShowPaymentModal(true)}>
          <MaterialIcons name="payment" size={24} color={Colors.whiteColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapSection currentLocation={currentLocation} destinationCoords={destinationCoord} showMap={true} mapRef={mapRef} heading={currentLocation?.heading || 0}/>
        
        <View style={styles.routeHeaderOverlay}>
          <View style={styles.routePill}>
            <Text style={styles.routeAddress} numberOfLines={1}>{pickupAddress}</Text>
          </View>
          <FontAwesome name="long-arrow-right" color="#000" size={24} />
          <View style={[styles.routePill, { borderColor: '#e71d36', marginLeft: 8 }]}>
            <Text style={styles.routeAddress} numberOfLines={1}>{destinationAddress}</Text>
          </View>
        </View>
      </View>

      <View style={styles.ridesContainer}>
        <Text style={styles.sectionTitle}>Available Rides</Text>
        {availableRides.length === 0 ? (
           <ActivityIndicator size="small" color={Colors.primaryColor} style={{ marginTop: 20 }} />
        ) : (
          <FlatList 
            data={availableRides} 
            keyExtractor={(item) => item.id} 
            renderItem={renderItem} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.ridesList} 
          />
        )}
        
        <TouchableOpacity style={styles.paymentMethodDisplay} onPress={() => setShowPaymentModal(true)}>
          <View style={styles.paymentMethodDisplayLeft}>
            <MaterialIcons name={selectedPaymentMethod?.icon || "payment"} size={20} color={selectedPaymentMethod ? Colors.primaryColor : Colors.grayColor} />
            <Text style={styles.paymentMethodDisplayText}>
              {selectedPaymentMethod ? selectedPaymentMethod.name : "Choose Payment Method"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.confirmButton, (!selectedRide || !selectedPaymentMethod) && styles.disabledButton]}
          disabled={!selectedRide || !selectedPaymentMethod}
          onPress={bookTrip}
        >
          <Text style={styles.confirmButtonText}>
            {selectedRide && selectedPaymentMethod ? `Confirm ${availableRides.find(r => r.id === selectedRide)?.name}` : 'Select Ride & Payment'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.blackColor} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.paymentMethodsList}
            renderItem={({ item }) => {
              const isSelected = selectedPaymentMethod?.id === item.id;
              return (
                <TouchableOpacity 
                  style={[
                    styles.paymentMethodCard, 
                    isSelected && { borderColor: Colors.primaryColor, backgroundColor: Colors.primaryColor + '10' }
                  ]} 
                  onPress={() => { 
                    setSelectedPaymentMethod(item); 
                    setShowPaymentModal(false); 
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialIcons 
                      name={item.icon} 
                      size={24} 
                      color={Colors.primaryColor} 
                      style={{ marginRight: Sizes.fixPadding }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentMethodName}>{item.name}</Text>
                      {item.balance && <Text style={{ ...Fonts.primaryColor14Medium, marginTop: 2 }}>{item.balance}</Text>}
                      {item.lastFour && <Text style={{ ...Fonts.grayColor12Medium, marginTop: 2 }}>•••• {item.lastFour}</Text>}
                    </View>
                  </View>
                  {isSelected && <MaterialIcons name="check-circle" size={24} color={Colors.primaryColor} />}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {isBooking && renderWaitingState()}
      {showCancelModal && renderCancelReasonModal()}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.whiteColor },
  simpleMarker: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#22C55E', borderWidth: 4, borderColor: '#FF8811', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Sizes.fixPadding * 2, paddingVertical: Sizes.fixPadding + 5, backgroundColor: Colors.primaryColor },
  backButton: { padding: Sizes.fixPadding - 5 },
  headerTitle: { ...Fonts.whiteColor18Bold, textAlign: "center" },
  paymentHeaderButton: { padding: Sizes.fixPadding - 5 },
  mapContainer: { flex: 1, position: "relative" },
  webview: { flex: 1 },
  routeHeaderOverlay: { top: Sizes.fixPadding * 2, paddingLeft: 6, flexDirection: "row", alignItems: 'center', position: "absolute", zIndex: 5 },
  routePill: { width: 170, borderColor: '#368f8b', backgroundColor: Colors.whiteColor, borderWidth: 2, borderRadius: 20, marginRight: 8, paddingHorizontal: 10 },
  routeAddress: { ...Fonts.blackColor14SemiBold, fontSize: 14, paddingVertical: 8 },
  ridesContainer: { flex: 1, backgroundColor: Colors.bodyBackColor, borderTopLeftRadius: Sizes.fixPadding * 2, borderTopRightRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 2 },
  sectionTitle: { ...Fonts.blackColor16Bold, marginBottom: Sizes.fixPadding * 1.5 },
  ridesList: { paddingBottom: Sizes.fixPadding },
  rideCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, marginBottom: Sizes.fixPadding, borderWidth: 2, borderColor: "transparent" },
  selectedRideCard: { borderColor: Colors.primaryColor },
  rideLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  vehicleIconContainer: { width: 50, height: 50, marginRight: Sizes.fixPadding, justifyContent: 'center', alignItems: 'center' },
  rideInfo: { flex: 1 },
  rideName: { ...Fonts.blackColor16SemiBold, marginBottom: 2 },
  rideType: { ...Fonts.grayColor13Medium, marginBottom: 4 },
  etaContainer: { flexDirection: "row", alignItems: "center" },
  etaText: { ...Fonts.grayColor12Medium, marginLeft: 4 },
  rideRight: { alignItems: "flex-end" },
  amount: { ...Fonts.blackColor18Bold, marginBottom: Sizes.fixPadding - 5 },
  surgeText: { ...Fonts.redColor10Medium },
  seatsContainer: { flexDirection: "row", alignItems: "center" },
  seatCount: { ...Fonts.grayColor10Medium, marginLeft: 4 },
  paymentMethodDisplay: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, marginTop: Sizes.fixPadding, borderWidth: 1, borderColor: Colors.lightGrayColor },
  paymentMethodDisplayLeft: { flexDirection: "row", alignItems: "center" },
  paymentMethodDisplayText: { ...Fonts.blackColor14SemiBold, marginLeft: Sizes.fixPadding },
  confirmButton: { backgroundColor: Colors.secondaryColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding + 5, alignItems: "center", marginTop: Sizes.fixPadding },
  disabledButton: { backgroundColor: Colors.lightGrayColor },
  confirmButtonText: { ...Fonts.whiteColor16Bold },
  modalContainer: { flex: 1, backgroundColor: Colors.whiteColor },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Sizes.fixPadding * 2, paddingVertical: Sizes.fixPadding + 5, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayColor },
  modalTitle: { ...Fonts.blackColor18Bold },
  closeButton: { padding: Sizes.fixPadding - 5 },
  paymentMethodsList: { padding: Sizes.fixPadding * 2 },
  paymentMethodCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 1.5, borderWidth: 1, borderColor: Colors.lightGrayColor, flex: 1, marginBottom: 10 },
  paymentMethodName: { ...Fonts.blackColor16SemiBold },
  
  waitingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  waitingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Sizes.fixPadding * 2 },
  waitingCard: { backgroundColor: Colors.whiteColor, borderRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 3, width: '100%', alignItems: 'center' },
  waitingSpinner: { marginBottom: Sizes.fixPadding * 2 },
  waitingTitle: { ...Fonts.blackColor20Bold, marginBottom: Sizes.fixPadding },
  waitingMessage: { ...Fonts.grayColor14Medium, textAlign: 'center', marginBottom: Sizes.fixPadding * 1.5 },
  waitingTimeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGrayColor + '30', paddingHorizontal: Sizes.fixPadding, paddingVertical: Sizes.fixPadding - 2, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding * 2 },
  waitingTimeText: { ...Fonts.grayColor12Medium, marginLeft: Sizes.fixPadding - 5 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGrayColor + '20', paddingHorizontal: Sizes.fixPadding, paddingVertical: Sizes.fixPadding - 2, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding * 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: Sizes.fixPadding - 5 },
  statusText: { ...Fonts.grayColor12Medium },
  searchAnimationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: Sizes.fixPadding * 2 },
  searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryColor, marginHorizontal: 4 },
  cancelWaitingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.redColor, borderRadius: Sizes.fixPadding, paddingVertical: Sizes.fixPadding, paddingHorizontal: Sizes.fixPadding * 2 },
  cancelWaitingText: { ...Fonts.redColor14Bold },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  cancelModalContainer: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: Sizes.fixPadding * 2, borderTopRightRadius: Sizes.fixPadding * 2, padding: Sizes.fixPadding * 2, maxHeight: '80%' },
  cancelModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sizes.fixPadding },
  cancelModalTitle: { ...Fonts.blackColor20Bold },
  cancelModalSubtitle: { ...Fonts.grayColor14Medium, marginBottom: Sizes.fixPadding * 2 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Sizes.fixPadding, paddingHorizontal: Sizes.fixPadding, borderRadius: Sizes.fixPadding, marginBottom: Sizes.fixPadding - 5 },
  selectedReasonItem: { backgroundColor: Colors.primaryColor + '10' },
  reasonText: { ...Fonts.blackColor16Medium, marginLeft: Sizes.fixPadding, flex: 1 },
  selectedReasonText: { ...Fonts.primaryColor16Medium },
  customReasonContainer: { marginTop: Sizes.fixPadding, marginBottom: Sizes.fixPadding },
  customReasonInput: { borderWidth: 1, borderColor: Colors.lightGrayColor, borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding, ...Fonts.blackColor14Medium, minHeight: 80, textAlignVertical: 'top' },
  cancelModalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Sizes.fixPadding * 2, gap: Sizes.fixPadding },
  cancelModalKeepButton: { flex: 1, paddingVertical: Sizes.fixPadding + 2, borderRadius: Sizes.fixPadding, borderWidth: 1, borderColor: Colors.primaryColor, alignItems: 'center' },
  cancelModalKeepText: { ...Fonts.primaryColor16Bold },
  cancelModalConfirmButton: { flex: 1, paddingVertical: Sizes.fixPadding + 2, borderRadius: Sizes.fixPadding, backgroundColor: Colors.redColor, alignItems: 'center' },
  cancelModalConfirmText: { ...Fonts.whiteColor16Bold },
  disabledCancelButton: { backgroundColor: Colors.lightGrayColor, opacity: 0.7 },
});

export default AvailableRidesScreen;