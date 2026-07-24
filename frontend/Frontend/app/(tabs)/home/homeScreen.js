// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useIsFocused } from "@react-navigation/native";
// import * as Location from 'expo-location';
// import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View
// } from "react-native";
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import Ionicons from "react-native-vector-icons/Ionicons";
// import { API_HOST } from "../../../constants/apiConfig";
// import { LIVE_TRACKING_DELTA, MAP_THEME } from "../../../constants/mapTheme";
// import {
//   Colors,
//   CommonStyles,
//   Fonts,
//   Sizes,
// } from "../../../constants/styles";
// import { VEHICLE_TYPE_KEYS } from "../../../constants/vehicleTypes";
// import api from "../../../services/api";
// import socket from "../../../services/socketService";
// import { decodePolyline } from "../../../utils/decodePolyline";
// import { useProfile } from "../../context/ProfileContext";

// const customMapTheme = MAP_THEME;

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

// function generateRandomDriverLocation(baseCoords, index) {
//   const metersPerDegree = 111000;
//   const minDistance = 300;
//   const maxDistance = 1200;
//   const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
  
//   const angle = (index * 75 + Math.random() * 45) % 360;
//   const angleInRadians = (angle * Math.PI) / 180;

//   const deltaLat = (randomDistance * Math.cos(angleInRadians)) / metersPerDegree;
//   const deltaLng = (randomDistance * Math.sin(angleInRadians)) / (metersPerDegree * Math.cos((baseCoords.latitude * Math.PI) / 180));

//   return {
//     id: `mock_nearby_car_${index}_${Date.now()}`,
//     latitude: baseCoords.latitude + deltaLat,
//     longitude: baseCoords.longitude + deltaLng,
//     heading: (angle + 180) % 360,
//   };
// }

// const MAP_ZOOM_DELTA = 0.007;
// const MapSection = ({
//   currentLocation,
//   destinationCoords,
//   showMap,
//   mapRef,
//   heading,
//   nearbyCars = [],
//   routeCoordinates = []
// }) => {

//   useEffect(() => {
//     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: MAP_ZOOM_DELTA,
//         longitudeDelta: MAP_ZOOM_DELTA,
//       }, 1000);
//     }
//   }, [currentLocation, destinationCoords, showMap]);

//   useEffect(() => {
//     if (routeCoordinates.length > 0 && mapRef.current) {
//       mapRef.current.fitToCoordinates(routeCoordinates, {
//         edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
//         animated: true,
//       });
//     }
//   }, [routeCoordinates]);
  
//   if (!showMap || !currentLocation) {
//     return null;
//   }
  
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.Map}
//         customMapStyle={customMapTheme}
//         initialRegion={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         }}
//       >
//         <Marker
//           coordinate={{
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//           }}
//           anchor={{ x: 0.5, y: 0.5 }}
//           zIndex={999}
//         >
//           <View style={styles.currentLocationDotOuter}>
//             <View style={styles.currentLocationDotInner} />
//           </View>
//         </Marker>
        
//         {nearbyCars.map((car) => (
//           <Marker
//             key={car.id}
//             coordinate={{
//               latitude: car.latitude,
//               longitude: car.longitude,
//             }}
//             flat={true}
//             rotation={car.heading}
//             anchor={{ x: 0.5, y: 0.5 }} 
//           >
//             <Image 
//               source={require("../../../assets/images/car.png")} 
//               style={{ width: 40, height: 40, resizeMode: 'contain' }}
//             />
//           </Marker>
//         ))}

//         {destinationCoords && (
//           <Marker
//             coordinate={destinationCoords}
//             image={require("../../../assets/images/destination.png")}
//             anchor={{ x: 0.5, y: 0.8 }}
//             flat={true}
//           />
//         )}

//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeWidth={5}
//             strokeColor={Colors.blackColor}
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// const HomeScreen = () => {
//   const navigation = useNavigation();
//   const isFocused = useIsFocused();
//   const { addressFor, address } = useLocalSearchParams();
//   const { profileData, fetchProfileDetails } = useProfile();

//   const [pickupAddress, setPickupAddress] = useState("Getting your location...");
//   const [destinationAddress, setDestinationAddress] = useState("");
//   const [pickAlert, setpickAlert] = useState(false);
//   const [showMap, setShowMap] = useState(false);
//   const [selectedTabIndex, setselectedTabIndex] = useState(1);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [numberOfChairs, setNumberOfChairs] = useState(1);
//   const mapRef = useRef(null);
//   const locationSubscription = useRef(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [locationModalVisible, setLocationModalVisible] = useState(false);
//   const [destinationModalVisible, setDestinationModalVisible] = useState(false); 
//   const [searchText, setSearchText] = useState("");
//   const [destinationSearchText, setDestinationSearchText] = useState(""); 
//   const [searchResults, setSearchResults] = useState([]);
//   const [destinationSearchResults, setDestinationSearchResults] = useState([]); 
//   const router = useRouter();
//   const [destinationCoords, setDestinationCoords] = useState(null);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [selectedRideType, setSelectedRideType] = useState('standard');
//   const [previousLocation, setPreviousLocation] = useState(null);
//   const [heading, setHeading] = useState(0);
//   const [nearbyCars, setNearbyCars] = useState([]);

//   // Integrate Profile Avatar exactly into existing UI
//   const avatarUrl = profileData?.profile_photo
//     ? (profileData.profile_photo.startsWith("http")
//         ? profileData.profile_photo
//         : `http://${API_HOST}${profileData.profile_photo}`)
//     : null;
//   const firstName = profileData?.full_name?.split(" ")[0] || "John Doe";
//   const currentLocationRef = useRef(currentLocation);

//   useEffect(() => {
//     if (isFocused) {
//       fetchProfileDetails();
//     }
//   }, [isFocused]);

//   useEffect(() => {
//     currentLocationRef.current = currentLocation;
//   }, [currentLocation]);

//   useEffect(() => {
//     getCurrentLocation();
//   }, []);

//   useEffect(() => {
//     const startLocationTracking = async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') return;

//         locationSubscription.current = await Location.watchPositionAsync(
//           {
//             accuracy: Location.Accuracy.High,
//             timeInterval: 5000,
//             distanceInterval: 5,
//           },
//           (location) => {
//             setCurrentLocation({
//               latitude: location.coords.latitude,
//               longitude: location.coords.longitude,
//             });
//           }
//         );
//       } catch (err) {
//         console.log("Rider location tracking setup failure:", err);
//       }
//     };

//     startLocationTracking();

//     return () => {
//       if (locationSubscription.current) {
//         locationSubscription.current.remove();
//         locationSubscription.current = null;
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (currentLocation?.latitude && currentLocation?.longitude) {
//       const generatedCars = Array.from({ length: 5 }).map((_, index) => 
//         generateRandomDriverLocation(currentLocation, index)
//       );
//       setNearbyCars(generatedCars);
//     }
//   }, [currentLocation]);

//   useEffect(() => {
//     if (currentLocation && mapRef.current) {
//       mapRef.current.animateToRegion(
//         {
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         },
//         1000
//       );
//     }
//   }, [currentLocation]);

//   useEffect(() => {
//     if (address && isFocused) {
//       if (addressFor === "pickup") {
//         setPickupAddress(address);
//         showAddressAlert("Pickup", address);
//       } else {
//         setDestinationAddress(address);
//       }
//     }
//   }, [address, addressFor, isFocused]);

//   useEffect(() => {
//     const origin = currentLocationRef.current;
//     if (!origin || !destinationCoords) {
//       setRouteCoordinates([]);
//       return;
//     }

//     let cancelled = false;
//     const fetchRoute = async () => {
//       try {
//         const response = await api.get('/rides/directions/', {
//           params: {
//             origin_lat: origin.latitude,
//             origin_lng: origin.longitude,
//             destination_lat: destinationCoords.latitude,
//             destination_lng: destinationCoords.longitude,
//           },
//         });
//         if (!cancelled && response.data?.polyline) {
//           setRouteCoordinates(decodePolyline(response.data.polyline));
//         }
//       } catch (error) {
//         console.log("Directions fetch error:", error);
//         if (!cancelled) setRouteCoordinates([]);
//       }
//     };

//     fetchRoute();
//     return () => { cancelled = true; };
//   }, [destinationCoords]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setShowMap(true);
//     }, 1000);
//     return () => { clearTimeout(timer) }
//   }, []);

//   useEffect(() => {
//     const registerRider = async () => {
//       try {
//         const riderId = await AsyncStorage.getItem("riderId");
//         if (riderId) {
//           socket.emit("register-rider", { riderId: parseInt(riderId) });
//         }
//       } catch (err) {
//         console.log("Error reading riderId from storage:", err);
//       }
//     };
  
//     socket.on("connect", () => {
//       registerRider();
//     });
  
//     return () => {
//       socket.off("connect");
//     };
//   }, []);
  
//   useEffect(() => {
//     const riderId = Date.now().toString(); 
//     socket.emit("register-rider", { riderId });
//   }, []);

//   useEffect(() => {
//     if (previousLocation && currentLocation) {
//       const newHeading = calculateBearing(
//         previousLocation.latitude,
//         previousLocation.longitude,
//         currentLocation.latitude,
//         currentLocation.longitude
//       );
      
//       if (
//         previousLocation.latitude !== currentLocation.latitude || 
//         previousLocation.longitude !== currentLocation.longitude
//       ) {
//         setHeading(newHeading);
//       }
//     }
//     setPreviousLocation(currentLocation);
//   }, [currentLocation]);

//   const showAddressAlert = (type, address) => {
//     Alert.alert(
//       `${type} Address Updated`,
//       `Your ${type.toLowerCase()} address has been set to:\n${address}`,
//       [{ text: "OK", onPress: () => console.log("OK Pressed") }]
//     );
//   };

//   const handleChairSelection = (chairCount) => {
//     setNumberOfChairs(chairCount);
//   };

//   const getCurrentLocation = async () => {
//     try {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         setPickupAddress("Location permission denied");
//         return;
//       }

//       let location = await Location.getCurrentPositionAsync({});
      
//       const { latitude, longitude } = location.coords;
//       setCurrentLocation({ latitude, longitude });
      
//       let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
//       if (addressResponse.length > 0) {
//         const addr = addressResponse[0];
//         const addressString = [
//           addr.name,
//           addr.street,
//           addr.city,
//           addr.region,
//           addr.country
//         ].filter(Boolean).join(', ');
//         setPickupAddress(addressString || "Location found");
//       }
//     } catch (error) {
//       console.log("Location error:", error);
//       setPickupAddress("Unable to get location");
//     }
//   };

//   const searchLocation = async (text, isDestination = false) => {
//     if (isDestination) {
//       setDestinationSearchText(text);
//     } else {
//       setSearchText(text);
//     }

//     if (text.length < 2) {
//       if (isDestination) {
//         setDestinationSearchResults([]);
//       } else {
//         setSearchResults([]);
//       }
//       return;
//     }

//     try {
//       const response = await api.get('/rides/places/autocomplete/', {
//         params: {
//           input: text,
//           latitude: currentLocation?.latitude,
//           longitude: currentLocation?.longitude,
//         },
//       });
//       const data = response.data;

//       if (isDestination) {
//         setDestinationSearchResults(data.predictions || []);
//       } else {
//         setSearchResults(data.predictions || []);
//       }
//     } catch (error) {
//       console.log("Search error:", error);
//     }
//   };

//   const selectLocation = async (placeId, description, isDestination = false) => {
//     try {
//       const response = await api.get('/rides/places/details/', {
//         params: { place_id: placeId },
//       });

//       const place = response.data;
//       if (place && place.latitude != null && place.longitude != null) {
//         const location = { lat: place.latitude, lng: place.longitude };
//         if (isDestination) {
//           setDestinationAddress(description);
//           setDestinationCoords({
//             latitude: location.lat,
//             longitude: location.lng
//           });
          
//           setDestinationModalVisible(false);
//           setDestinationSearchText("");
//           setDestinationSearchResults([]);
//         } else {
//           setPickupAddress(description);
//           setCurrentLocation({
//             latitude: location.lat,
//             longitude: location.lng
//           });
//           setLocationModalVisible(false);
//           setSearchText("");
//           setSearchResults([]);
//         }
//       }
//     } catch (error) {
//       console.log("Select location error:", error);
//     }
//   };

//   const pickupLocationModal = () => {
//     return (
//       <Modal visible={locationModalVisible} animationType="slide" transparent>
//         <TouchableWithoutFeedback
//           onPress={() => setLocationModalVisible(false)}
//         >
//           <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
//             <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
//               <View style={styles.modalContent}> 
//                 <View style={styles.modalHeader}>
//                   <Text style={styles.modalTitle}>Search Pickup Location</Text>
//                   <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
//                     <Ionicons name="close" size={24} color={Colors.grayColor} />
//                   </TouchableOpacity>
//                 </View>
//                 <TextInput
//                   placeholder="Search pickup location..."
//                   value={searchText}
//                   onChangeText={(text) => searchLocation(text, false)}
//                   style={styles.modalSearchInput}
//                   autoFocus
//                 />

//                 <ScrollView style={{ maxHeight: 250 }}>
//                   {searchResults.map((item) => (
//                     <TouchableOpacity
//                       key={item.place_id}
//                       onPress={() =>
//                         selectLocation(item.place_id, item.description, false)
//                       }
//                       style={styles.searchResultItem}
//                     >
//                       <Ionicons name="location-outline" size={20} color={Colors.primaryColor} />
//                       <Text style={styles.searchResultText}>{item.description}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </ScrollView>
//               </View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     );
//   };

//   const destinationLocationModal = () => {
//     return (
//       <Modal visible={destinationModalVisible} animationType="slide" transparent>
//         <TouchableWithoutFeedback
//           onPress={() => setDestinationModalVisible(false)}
//         >
//           <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
//             <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
//               <View style={styles.modalContent}>
//                 <View style={styles.modalHeader}>
//                   <Text style={styles.modalTitle}>Search Destination</Text>
//                   <TouchableOpacity onPress={() => setDestinationModalVisible(false)}>
//                     <Ionicons name="close" size={24} color={Colors.grayColor} />
//                   </TouchableOpacity>
//                 </View>
//                 <TextInput
//                   placeholder="Search destination location..."
//                   value={destinationSearchText}
//                   onChangeText={(text) => searchLocation(text, true)}
//                   style={styles.modalSearchInput}
//                   autoFocus
//                 />

//                 <ScrollView style={{ maxHeight: 250 }}>
//                   {destinationSearchResults.map((item) => (
//                     <TouchableOpacity
//                       key={item.place_id}
//                       onPress={() =>
//                         selectLocation(item.place_id, item.description, true)
//                       }
//                       style={styles.searchResultItem}
//                     >
//                       <Ionicons name="location-outline" size={20} color={Colors.redColor} />
//                       <Text style={styles.searchResultText}>{item.description}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </ScrollView>
//               </View>
//             </TouchableWithoutFeedback>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     );
//   };

//   const pickAddressMessage = () => {
//     return pickAlert ? (
//       <View style={styles.alertContainer}>
//         <Text style={styles.alertTextStyle}>
//           Please pick the correct locations
//         </Text>
//       </View>
//     ) : null;
//   };

//   const rideSelectionCard = () => {
//     return (
//       <View style={styles.rideCard}>
//         <View style={styles.rideTypeContainer}>
//           <TouchableOpacity
//             style={[
//               styles.rideTypeButton,
//               selectedTabIndex === 1 && styles.selectedRideType
//             ]}
//             onPress={() => {
//               setselectedTabIndex(1);      
//               setSelectedRideType('standard'); 
//             }}
//           >
//             <Ionicons 
//               name="car-sport" 
//               size={24} 
//               color={selectedTabIndex === 1 ? Colors.whiteColor : Colors.grayColor} 
//             />
//             <Text style={[
//               styles.rideTypeText,
//               selectedTabIndex === 1 && styles.selectedRideTypeText
//             ]}>
//               Solo
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.rideTypeButton,
//               selectedTabIndex === 2 && styles.selectedRideType
//             ]}
//             onPress={() => {
//               setselectedTabIndex(2);      
//               setSelectedRideType('shared');   
//             }}
//           >
//             <Ionicons 
//               name="people" 
//               size={24} 
//               color={selectedTabIndex === 2 ? Colors.whiteColor : Colors.grayColor} 
//             />
//             <Text style={[
//               styles.rideTypeText,
//               selectedTabIndex === 2 && styles.selectedRideTypeText
//             ]}>
//               Sharing
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.locationRow}>
//           <View style={styles.locationDotContainer}>
//             <View style={[styles.locationDot, styles.greenDot]} />
//             <View style={styles.verticalLine} />
//             <View style={[styles.locationDot, styles.redDot]} />
//           </View>

//           <View style={styles.locationInputsContainer}>
//             <TouchableOpacity 
//               style={styles.locationInput}
//               onPress={() => setLocationModalVisible(true)}
//             >
//               <Text style={styles.locationLabel}>Current location</Text>
//               <Text style={styles.locationAddress} numberOfLines={1}>
//                 {pickupAddress}
//               </Text>
//             </TouchableOpacity>

//             <View style={styles.separator} />

//             <TouchableOpacity 
//               style={styles.locationInput}
//               onPress={() => setDestinationModalVisible(true)}
//             >
//               <Text style={styles.locationLabel}>Where to?</Text>
//               <Text style={[styles.locationAddress, !destinationAddress && styles.destinationPlaceholder]} numberOfLines={1}>
//                 {destinationAddress || "Enter destination"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {selectedTabIndex === 2 && (
//           <View style={styles.chairsContainer}>
//             <Text style={styles.chairsLabel}>Number of chairs needed:</Text>
//             <View style={styles.chairsSelection}>
//               {[1, 2, 3].map((chairCount) => (
//                 <TouchableOpacity
//                   key={chairCount}
//                   style={[
//                     styles.chairButton,
//                     numberOfChairs === chairCount && styles.selectedChairButton
//                   ]}
//                   onPress={() => handleChairSelection(chairCount)}
//                 >
//                   <Ionicons 
//                     name="person" 
//                     size={20} 
//                     color={numberOfChairs === chairCount ? Colors.whiteColor : Colors.grayColor} 
//                   />
//                   <Text style={[
//                     styles.chairButtonText,
//                     numberOfChairs === chairCount && styles.selectedChairButtonText
//                   ]}>
//                     {chairCount}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}
        
//         <TouchableOpacity
//           style={[
//             styles.confirmButton,
//             (isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords) && styles.disabledButton
//           ]}
//           disabled={isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords}
//           onPress={async () => {
//             if (!currentLocation) {
//               Alert.alert("Error", "Location is still loading. Please wait.");
//               return;
//             }
//             const locationData = currentLocation;
//             if (pickupAddress && destinationAddress && pickupAddress !== "Getting your location..." && pickupAddress !== "Unable to get location" && destinationCoords) {
              
//               setIsProcessing(true); 

//               try {
//                 if (!locationData?.latitude || !destinationCoords?.latitude) {
//                    console.error("Missing pickup or dropoff coordinates.");
//                    return;
//                 }

//                 // Backend setup implementation injected here
//                 const vehicleTypes = VEHICLE_TYPE_KEYS;
//                 const estimatePromises = vehicleTypes.map(async (vType) => {
//                   const cleanPayload = {
//                     pickup: { latitude: parseFloat(locationData.latitude), longitude: parseFloat(locationData.longitude) },
//                     dropoff: { latitude: parseFloat(destinationCoords.latitude), longitude: parseFloat(destinationCoords.longitude) },
//                     vehicle_type: vType,
//                   };
//                   const response = await api.post('/rides/estimate/', cleanPayload);
//                   return { type: vType, data: response.data };
//                 });

//                 const estimatesResults = await Promise.all(estimatePromises);
                
//                 const fareEstimatesBreakdown = {};
//                 estimatesResults.forEach(res => { fareEstimatesBreakdown[res.type] = res.data; });

//                 const navigationParams = {
//                   numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
//                   pickupAddress: pickupAddress,
//                   destinationAddress: destinationAddress,
//                   lat: locationData.latitude.toString(),
//                   lng: locationData.longitude.toString(),
//                   destLat: destinationCoords?.latitude?.toString(),
//                   destLng: destinationCoords?.longitude?.toString(),
//                   locationData: JSON.stringify(locationData),
//                   fareEstimates: JSON.stringify(fareEstimatesBreakdown),
//                   ride_type: selectedRideType
//                 };
                
//                 router.push({
//                   pathname: "availableRides/availableRidesScreen",
//                   params: navigationParams
//                 });

//               } catch (error) {
//                 Alert.alert("Error", "Could not fetch ride estimates. Please try again.");
//                 console.error("CRITICAL ERROR:", error);
//               } finally {
//                 setIsProcessing(false); 
//               }

//             } else {
//               setpickAlert(true);
//               setTimeout(() => setpickAlert(false), 2000);
//             }
//           }}
//         >
//           {isProcessing ? (
//              <ActivityIndicator color="white" />
//           ) : (
//              <Text style={styles.confirmButtonText}>
//                Confirm {selectedTabIndex === 1 ? "Solo" : "Sharing"}
//              </Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const header = () => {
//     return (
//       <View style={styles.header}>
//         <View style={styles.profileContainer}>
//           <Image
//             source={avatarUrl ? { uri: avatarUrl } : require("../../../assets/images/user/user1.jpeg")}
//             style={styles.profileImage}
//           />
//           <View style={styles.welcomeContainer}>
//             <Text style={styles.welcomeText}>Welcome back,</Text>
//             <Text style={styles.userName}>{firstName}</Text>
//           </View>
//         </View>
        
//         <View style={styles.headerRight}>
//           <TouchableOpacity style={styles.menuButton}>
//             <Ionicons name="menu-outline" size={24} color={Colors.whiteColor} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
//       <View style={{ flex: 1 }}>
//         {header()}
//         <MapSection
//           currentLocation={currentLocation}
//           destinationCoords={destinationCoords}
//           showMap={showMap}
//           mapRef={mapRef}
//           heading={heading}
//           nearbyCars={nearbyCars}
//           routeCoordinates={routeCoordinates}
//         />
//         {rideSelectionCard()}
//       </View>
//       {pickAddressMessage()}
//       {pickupLocationModal()}
//       {destinationLocationModal()}
//     </View>
//   );
// };

// export default HomeScreen;

// const styles = StyleSheet.create({
//   alertContainer: {
//     position: "absolute",
//     bottom: 0,
//     alignSelf: "center",
//     zIndex: 100,
//   },
//   Map: {
//     width: '100%',
//     height: '100%',
//   },
//   currentLocationDotOuter: {
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     backgroundColor: 'rgba(255, 140, 0, 0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   currentLocationDotInner: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: Colors.secondaryColor,
//     borderWidth: 2,
//     borderColor: Colors.whiteColor,
//   },
//   simpleMarker: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#22C55E',
//     borderWidth: 4,
//     borderColor: '#FF8811',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   destinationMarker: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#EF4444',
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//   },
//   alertTextStyle: {
//     ...Fonts.whiteColor14Medium,
//     backgroundColor: Colors.blackColor,
//     paddingHorizontal: Sizes.fixPadding + 5.0,
//     paddingVertical: Sizes.fixPadding - 5.0,
//     borderRadius: Sizes.fixPadding - 5.0,
//     overflow: "hidden",
//   },
//   header: {
//     backgroundColor: Colors.primaryColor,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: Sizes.fixPadding * 2.0,
//     paddingVertical: Sizes.fixPadding + 5.0,
//     paddingTop: Sizes.fixPadding * 3.0,
//     zIndex: 10,
//   },
//   profileContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   profileImage: {
//     width: 45.0,
//     height: 45.0,
//     borderRadius: 22.5,
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   welcomeContainer: {
//     marginLeft: Sizes.fixPadding,
//   },
//   welcomeText: {
//     ...Fonts.whiteColor12Medium,
//     opacity: 0.8,
//   },
//   userName: {
//     ...Fonts.whiteColor18Bold,
//     marginTop: 2,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   menuButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rideCard: {
//     position: "absolute",
//     left: Sizes.fixPadding,
//     right: Sizes.fixPadding,
//     bottom: Sizes.fixPadding * 2,
//     backgroundColor: Colors.whiteColor,
//     borderRadius: Sizes.fixPadding * 2,
//     ...CommonStyles.shadow,
//     padding: Sizes.fixPadding * 1.5,
//     zIndex: 10,
//   },
//   rideTypeContainer: {
//     flexDirection: "row",
//     backgroundColor: Colors.bodyBackColor,
//     borderRadius: Sizes.fixPadding,
//     padding: Sizes.fixPadding - 5,
//     marginBottom: Sizes.fixPadding * 1.5,
//   },
//   rideTypeButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: Sizes.fixPadding,
//     borderRadius: Sizes.fixPadding - 2,
//   },
//   selectedRideType: {
//     backgroundColor: Colors.secondaryColor,
//   },
//   rideTypeText: {
//     ...Fonts.grayColor15SemiBold,
//     marginLeft: Sizes.fixPadding - 5,
//   },
//   selectedRideTypeText: {
//     ...Fonts.whiteColor15SemiBold,
//   },
//   locationRow: {
//     flexDirection: "row",
//     marginBottom: Sizes.fixPadding * 1.5,
//   },
//   locationDotContainer: {
//     alignItems: "center",
//     marginRight: Sizes.fixPadding,
//     width: 24,
//   },
//   locationDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//   },
//   greenDot: {
//     backgroundColor: Colors.greenColor,
//   },
//   redDot: {
//     backgroundColor: Colors.redColor,
//   },
//   verticalLine: {
//     width: 2,
//     height: 20,
//     backgroundColor: Colors.lightGrayColor,
//     marginVertical: 2,
//   },
//   locationInputsContainer: {
//     flex: 1,
//   },
//   locationInput: {
//     paddingVertical: Sizes.fixPadding,
//   },
//   locationLabel: {
//     ...Fonts.grayColor12Medium,
//     marginBottom: 2,
//   },
//   locationAddress: {
//     ...Fonts.blackColor16SemiBold,
//   },
//   destinationPlaceholder: {
//     color: Colors.grayColor,
//   },
//   separator: {
//     height: 1,
//     backgroundColor: Colors.lightGrayColor,
//     marginVertical: Sizes.fixPadding - 5,
//   },
//   confirmButton: {
//     backgroundColor: Colors.secondaryColor,
//     borderRadius: Sizes.fixPadding,
//     padding: Sizes.fixPadding + 5,
//     alignItems: "center",
//   },
//   disabledButton: {
//     backgroundColor: Colors.lightGrayColor,
//     opacity: 0.5,
//   },
//   confirmButtonText: {
//     ...Fonts.whiteColor18Bold,
//   },
//   chairsContainer: {
//     marginBottom: Sizes.fixPadding * 1.5,
//   },
//   chairsLabel: {
//     ...Fonts.grayColor14Medium,
//     marginBottom: Sizes.fixPadding,
//     textAlign: 'center',
//   },
//   chairsSelection: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: Colors.bodyBackColor,
//     borderRadius: Sizes.fixPadding,
//     padding: Sizes.fixPadding - 5,
//   },
//   chairButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: Sizes.fixPadding,
//     borderRadius: Sizes.fixPadding - 2,
//     marginHorizontal: 2,
//   },
//   selectedChairButton: {
//     backgroundColor: Colors.secondaryColor,
//   },
//   chairButtonText: {
//     ...Fonts.grayColor14SemiBold,
//     marginLeft: Sizes.fixPadding - 5,
//   },
//   selectedChairButtonText: {
//     ...Fonts.whiteColor14SemiBold,
//   },
//   modalContent: {
//     backgroundColor: "white",
//     marginTop: 120,
//     marginHorizontal: 20,
//     borderRadius: 10,
//     padding: 15,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   modalTitle: {
//     ...Fonts.blackColor18SemiBold,
//   },
//   modalSearchInput: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 10,
//     ...Fonts.blackColor14Medium,
//   },
//   searchResultItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   searchResultText: {
//     ...Fonts.blackColor14Medium,
//     marginLeft: 10,
//     flex: 1,
//   },
// });


import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import * as Location from 'expo-location';
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE ,Callout} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Ionicons from "react-native-vector-icons/Ionicons";
import { API_HOST } from "../../../constants/apiConfig";
import { Key } from "../../../constants/key";
import { LIVE_TRACKING_DELTA, MAP_THEME } from "../../../constants/mapTheme";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
} from "../../../constants/styles";
import { VEHICLE_TYPE_KEYS } from "../../../constants/vehicleTypes";
import api from "../../../services/api";
import socket from "../../../services/socketService";
import { useProfile } from "../../context/ProfileContext";

const GOOGLE_MAPS_API_KEY = Key.apiKey;
const customMapTheme = MAP_THEME;

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

function generateRandomDriverLocation(baseCoords, index) {
  const metersPerDegree = 111000;
  const minDistance = 300;
  const maxDistance = 1200;
  const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
  
  const angle = (index * 75 + Math.random() * 45) % 360;
  const angleInRadians = (angle * Math.PI) / 180;

  const deltaLat = (randomDistance * Math.cos(angleInRadians)) / metersPerDegree;
  const deltaLng = (randomDistance * Math.sin(angleInRadians)) / (metersPerDegree * Math.cos((baseCoords.latitude * Math.PI) / 180));

  return {
    id: `mock_nearby_car_${index}_${Date.now()}`,
    latitude: baseCoords.latitude + deltaLat,
    longitude: baseCoords.longitude + deltaLng,
    heading: (angle + 180) % 360,
  };
}

const MAP_ZOOM_DELTA = 0.007;
// const MapSection = ({
//   currentLocation,
  // destinationCoords,
  // showMap,
  // mapRef,
  // heading,
//   avatarUrl,
//   // nearbyCars = []
// }) => {

//   useEffect(() => {
//     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: MAP_ZOOM_DELTA,
//         longitudeDelta: MAP_ZOOM_DELTA,
//       }, 1000); 
//     }
//   }, [currentLocation, destinationCoords, showMap]);
  
//   if (!showMap || !currentLocation) {
//     return null;
//   }
  
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.Map}
//         customMapStyle={customMapTheme}
//         initialRegion={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         }}
//       >
//         <Marker
//           coordinate={{
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//           }}
//           anchor={{ x: 0.5, y: 1 }} // Keeps the pin tip exactly on the GPS coordinate
//         >
//           <View style={styles.customMarkerWrap}>
//             <View style={styles.markerOuterRing}>
//               <View style={styles.markerInnerRing}>
//                 {avatarUrl ? (
//                   <Image source={{ uri: avatarUrl }} style={styles.markerProfileImg} />
//                 ) : (
//                   <Ionicons name="person" size={26} color={Colors.primaryColor} />
//                 )}
//               </View>
//             </View>
//             <View style={styles.markerTriangle} />
//           </View>
//         </Marker>
        
        
//         {destinationCoords && (
//           <Marker
//             coordinate={destinationCoords}
//             image={require("../../../assets/images/destination.png")}
//             anchor={{ x: 0.5, y: 0.8 }}
//             flat={true}
//           />
//         )}

//         {destinationCoords && (
//           <MapViewDirections
//             origin={currentLocation}
//             destination={destinationCoords}
//             apikey={GOOGLE_MAPS_API_KEY}
//             strokeWidth={5}
//             strokeColor='#1A202C'
//             onReady={(result) => {
//               mapRef.current.fitToCoordinates(
//                 result.coordinates,
//                 {
//                   edgePadding: {
//                     top: 100,
//                     right: 50,
//                     bottom: 300,
//                     left: 50,
//                   },
//                   animated: true,
//                 }
//               );
//             }}
//             onError={(error) => {
//               console.log(error);
//             }}
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// const MapSection = ({
//   currentLocation,
//   destinationCoords,
//   showMap,
//   mapRef,
//   heading,
//   avatarUrl, // Added this prop to receive the profile image
//   nearbyCars = []
// }) => {

//   useEffect(() => {
//     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: MAP_ZOOM_DELTA,
//         longitudeDelta: MAP_ZOOM_DELTA,
//       }, 1000); 
//     }
//   }, [currentLocation, destinationCoords, showMap]);
  
//   // If the device's GPS is off, currentLocation is null, and the map will disappear.
//   if (!showMap || !currentLocation) {
//     return null;
//   }
  
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.Map}
//         customMapStyle={customMapTheme}
//         initialRegion={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         }}
//       >
//         {/* Pickup Marker (Dynamic Profile) */}
//         <Marker
//           coordinate={{
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//           }}
//           anchor={{ x: 0.5, y: 1 }} // Keeps the pin tip exactly on the GPS coordinate
//         >
//           <View style={styles.customMarkerWrap}>
//             <View style={styles.markerOuterRing}>
//               <View style={styles.markerInnerRing}>
//                 {avatarUrl ? (
//                   <Image source={{ uri: avatarUrl }} style={styles.markerProfileImg} />
//                 ) : (
//                   <Ionicons name="person" size={26} color={Colors.primaryColor} />
//                 )}
//               </View>
//             </View>
//             <View style={styles.markerTriangle} />
//           </View>
//         </Marker>
        
//         {/* Destination Marker (Your Original Image) */}
//         {destinationCoords && (
//           <Marker
//             coordinate={destinationCoords}
//             image={require("../../../assets/images/destination.png")}
//             anchor={{ x: 0.5, y: 0.8 }}
//             flat={true}
//           />
//         )}

//         {/* Route Path Line */}
//         {destinationCoords && (
//           <MapViewDirections
//             origin={currentLocation}
//             destination={destinationCoords}
//             apikey={GOOGLE_MAPS_API_KEY}
//             strokeWidth={5}
//             strokeColor='#1A202C'
//             precision="high"
//             onReady={(result) => {
//               mapRef.current.fitToCoordinates(
//                 result.coordinates,
//                 {
//                   edgePadding: { top: 120, right: 50, bottom: 350, left: 50 },
//                   animated: true,
//                 }
//               );
//             }}
//             onError={(error) => {
//               // This is what prints the API error to your console
//               console.warn("Routing Error (Directions API):", error);
//             }}
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

const MapSection = ({
  currentLocation,
  destinationCoords,
  showMap,
  mapRef,
  heading,
  avatarUrl, 
  nearbyCars = [],
  pickupAddress // <-- ADD THIS PROP
}) => {

  useEffect(() => {
    if (showMap && currentLocation && !destinationCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: MAP_ZOOM_DELTA,
        longitudeDelta: MAP_ZOOM_DELTA,
      }, 1000); 
    }
  }, [currentLocation, destinationCoords, showMap]);
  
  if (!showMap || !currentLocation) {
    return null;
  }
  
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.Map}
        customMapStyle={customMapTheme}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        }}
      >
        {/* Pickup Marker (Red Pulse Dot) */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={999}
        >
          <View style={styles.currentLocationDotOuter}>
            <View style={styles.currentLocationDotInner} />
          </View>
        </Marker>
        
        {/* Destination Marker */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            image={require("../../../assets/images/destination.png")}
            anchor={{ x: 0.5, y: 0.8 }}
            flat={true}
          />
        )}

        {/* Route Path Line */}
        {destinationCoords && (
          <MapViewDirections
            origin={currentLocation}
            destination={destinationCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor='#000000'
            precision="high"
            onReady={(result) => {
              mapRef.current.fitToCoordinates(
                result.coordinates,
                {
                  edgePadding: { top: 120, right: 50, bottom: 350, left: 50 },
                  animated: true,
                }
              );
            }}
            onError={(error) => {
              console.warn("Routing Error (Directions API):", error);
            }}
          />
        )}
      </MapView>
    </View>
  );
};


const HomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { addressFor, address } = useLocalSearchParams();
  const { profileData, fetchProfileDetails } = useProfile();

  const [pickupAddress, setPickupAddress] = useState("Getting your location...");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickAlert, setpickAlert] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedTabIndex, setselectedTabIndex] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [numberOfChairs, setNumberOfChairs] = useState(1);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false); 
  const [searchText, setSearchText] = useState("");
  const [destinationSearchText, setDestinationSearchText] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [destinationSearchResults, setDestinationSearchResults] = useState([]); 
  const router = useRouter();
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [previousLocation, setPreviousLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [nearbyCars, setNearbyCars] = useState([]);
  const [serviceUnavailableVisible, setServiceUnavailableVisible] = useState(false);
  const [serviceUnavailableMessage, setServiceUnavailableMessage] = useState("");

  // Integrate Profile Avatar exactly into existing UI
  const avatarUrl = profileData?.profile_photo
    ? (profileData.profile_photo.startsWith("http")
        ? profileData.profile_photo
        : `http://${API_HOST}${profileData.profile_photo}`)
    : null;
  const firstName = profileData?.full_name?.split(" ")[0] || "John Doe";

  useEffect(() => {
    if (isFocused) {
      fetchProfileDetails();
    }
  }, [isFocused]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const generatedCars = Array.from({ length: 5 }).map((_, index) => 
        generateRandomDriverLocation(currentLocation, index)
      );
      setNearbyCars(generatedCars);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        },
        1000
      );
    }
  }, [currentLocation]);

  useEffect(() => {
    if (address && isFocused) {
      if (addressFor === "pickup") {
        setPickupAddress(address);
        showAddressAlert("Pickup", address);
      }
       else {
        setDestinationAddress(address);
      //   showAddressAlert("Destination", address);
      }
    }
  }, [address, addressFor, isFocused]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 1000);
    return () => { clearTimeout(timer) }
  }, []);

  useEffect(() => {
    const registerRider = async () => {
      try {
        const riderId = await AsyncStorage.getItem("riderId");
        if (riderId) {
          socket.emit("register-rider", { riderId: parseInt(riderId) });
        }
      } catch (err) {
        console.log("Error reading riderId from storage:", err);
      }
    };
  
    socket.on("connect", () => {
      registerRider();
    });
  
    return () => {
      socket.off("connect");
    };
  }, []);
  
  useEffect(() => {
    const riderId = Date.now().toString(); 
    socket.emit("register-rider", { riderId });
  }, []);

  useEffect(() => {
    if (previousLocation && currentLocation) {
      const newHeading = calculateBearing(
        previousLocation.latitude,
        previousLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      if (
        previousLocation.latitude !== currentLocation.latitude || 
        previousLocation.longitude !== currentLocation.longitude
      ) {
        setHeading(newHeading);
      }
    }
    setPreviousLocation(currentLocation);
  }, [currentLocation]);

  const showAddressAlert = (type, address) => {
    Alert.alert(
      `${type} Address Updated`,
      `Your ${type.toLowerCase()} address has been set to:\n${address}`,
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
  };

  const handleChairSelection = (chairCount) => {
    setNumberOfChairs(chairCount);
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickupAddress("Location permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      
      let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const addressString = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');
        setPickupAddress(addressString || "Location found");
      }
    } catch (error) {
      console.log("Location error:", error);
      setPickupAddress("Unable to get location");
    }
  };

  // const searchLocation = async (text, isDestination = false) => {
  //   if (isDestination) {
  //     setDestinationSearchText(text);
  //   } else {
  //     setSearchText(text);
  //   }

  //   if (text.length < 2) {
  //     if (isDestination) {
  //       setDestinationSearchResults([]);
  //     } else {
  //       setSearchResults([]);
  //     }
  //     return;
  //   }

  //   try {
  //     const response = await api.get('/rides/places/autocomplete/', {
  //       params: {
  //         input: text,
  //         latitude: currentLocation?.latitude,
  //         longitude: currentLocation?.longitude,
  //       },
  //     });
  //     const data = response.data;

  //     if (isDestination) {
  //       setDestinationSearchResults(data.predictions || []);
  //     } else {
  //       setSearchResults(data.predictions || []);
  //     }
  //   } catch (error) {
  //     console.log("Search error:", error);
  //   }
  // };


  const searchLocation = (text, isDestination = false) => {
    if (isDestination) {
      setDestinationSearchText(text);
    } else {
      setSearchText(text);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length < 2) {
      if (isDestination) {
        setDestinationSearchResults([]);
      } else {
        setSearchResults([]);
      }
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/rides/places/autocomplete/', {
          params: {
            input: text,
            latitude: currentLocation?.latitude,
            longitude: currentLocation?.longitude,
          },
        });
        
        const data = response.data;
        console.log("Autocomplete Raw Data:", JSON.stringify(data)); // <-- Debug log
        
        // Aggressively search for the array
        let results = [];
        if (Array.isArray(data)) {
          results = data;
        } else if (data.predictions && Array.isArray(data.predictions)) {
          results = data.predictions;
        } else if (data.results && Array.isArray(data.results)) {
          results = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          results = data.data; 
        } else {
          // Fallback: Find the first array inside the response object
          const firstArray = Object.values(data).find(val => Array.isArray(val));
          if (firstArray) results = firstArray;
        }

        if (isDestination) {
          setDestinationSearchResults(results);
        } else {
          setSearchResults(results);
        }
      } catch (error) {
        console.log("Search error:", error);
      }
    }, 500); 
  };


  const selectLocation = async (placeId, description, isDestination = false) => {
    try {
      const response = await api.get('/rides/places/details/', {
        params: { place_id: placeId },
      });

      const place = response.data;
      if (place && place.latitude != null && place.longitude != null) {
        const location = { lat: place.latitude, lng: place.longitude };
        if (isDestination) {
          setDestinationAddress(description);
          setDestinationCoords({
            latitude: location.lat,
            longitude: location.lng
          });
          
          setDestinationModalVisible(false);
          setDestinationSearchText("");
          setDestinationSearchResults([]);
          // showAddressAlert("Destination", description);
        } else {
          setPickupAddress(description);
          setCurrentLocation({
            latitude: location.lat,
            longitude: location.lng
          });
          setLocationModalVisible(false);
          setSearchText("");
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.log("Select location error:", error);
    }
  };

  const pickupLocationModal = () => {
    return (
      <Modal visible={locationModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}> 
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Search Pickup Location</Text>
                  <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.grayColor} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Search pickup location..."
                  value={searchText}
                  onChangeText={(text) => searchLocation(text, false)}
                  style={styles.modalSearchInput}
                  autoFocus
                />

                <ScrollView style={{ maxHeight: 250 }}>
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={() =>
                        selectLocation(item.place_id, item.description, false)
                      }
                      style={styles.searchResultItem}
                    >
                      <Ionicons name="location-outline" size={20} color={Colors.primaryColor} />
                      <Text style={styles.searchResultText}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const destinationLocationModal = () => {
    return (
      <Modal visible={destinationModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback
          onPress={() => setDestinationModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Search Destination</Text>
                  <TouchableOpacity onPress={() => setDestinationModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.grayColor} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Search destination location..."
                  value={destinationSearchText}
                  onChangeText={(text) => searchLocation(text, true)}
                  style={styles.modalSearchInput}
                  autoFocus
                />

                <ScrollView style={{ maxHeight: 250 }}>
                  {destinationSearchResults.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={() =>
                        selectLocation(item.place_id, item.description, true)
                      }
                      style={styles.searchResultItem}
                    >
                      <Ionicons name="location-outline" size={20} color={Colors.redColor} />
                      <Text style={styles.searchResultText}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const pickAddressMessage = () => {
    return pickAlert ? (
      <View style={styles.alertContainer}>
        <Text style={styles.alertTextStyle}>
          Please pick the correct locations
        </Text>
      </View>
    ) : null;
  };

  const rideSelectionCard = () => {
    return (
      <View style={styles.rideCard}>
        <View style={styles.rideTypeContainer}>
          <TouchableOpacity
            style={[
              styles.rideTypeButton,
              selectedTabIndex === 1 && styles.selectedRideType
            ]}
            onPress={() => {
              setselectedTabIndex(1);      
              setSelectedRideType('standard'); 
            }}
          >
            <Ionicons 
              name="car-sport" 
              size={24} 
              color={selectedTabIndex === 1 ? Colors.whiteColor : Colors.grayColor} 
            />
            <Text style={[
              styles.rideTypeText,
              selectedTabIndex === 1 && styles.selectedRideTypeText
            ]}>
              Solo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rideTypeButton,
              selectedTabIndex === 2 && styles.selectedRideType
            ]}
            onPress={() => {
              setselectedTabIndex(2);      
              setSelectedRideType('shared');   
            }}
          >
            <Ionicons 
              name="people" 
              size={24} 
              color={selectedTabIndex === 2 ? Colors.whiteColor : Colors.grayColor} 
            />
            <Text style={[
              styles.rideTypeText,
              selectedTabIndex === 2 && styles.selectedRideTypeText
            ]}>
              Sharing
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationDotContainer}>
            <View style={[styles.locationDot, styles.greenDot]} />
            <View style={styles.verticalLine} />
            <View style={[styles.locationDot, styles.redDot]} />
          </View>

          <View style={styles.locationInputsContainer}>
            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.locationLabel}>Current location</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {pickupAddress}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.locationInput}
              onPress={() => setDestinationModalVisible(true)}
            >
              <Text style={styles.locationLabel}>Where to?</Text>
              <Text style={[styles.locationAddress, !destinationAddress && styles.destinationPlaceholder]} numberOfLines={1}>
                {destinationAddress || "Enter destination"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedTabIndex === 2 && (
          <View style={styles.chairsContainer}>
            <Text style={styles.chairsLabel}>Number of chairs needed:</Text>
            <View style={styles.chairsSelection}>
              {[1, 2, 3].map((chairCount) => (
                <TouchableOpacity
                  key={chairCount}
                  style={[
                    styles.chairButton,
                    numberOfChairs === chairCount && styles.selectedChairButton
                  ]}
                  onPress={() => handleChairSelection(chairCount)}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={numberOfChairs === chairCount ? Colors.whiteColor : Colors.grayColor} 
                  />
                  <Text style={[
                    styles.chairButtonText,
                    numberOfChairs === chairCount && styles.selectedChairButtonText
                  ]}>
                    {chairCount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords) && styles.disabledButton
          ]}
          disabled={isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords}
          onPress={async () => {
            if (!currentLocation) {
              Alert.alert("Error", "Location is still loading. Please wait.");
              return;
            }
            const locationData = currentLocation;
            if (pickupAddress && destinationAddress && pickupAddress !== "Getting your location..." && pickupAddress !== "Unable to get location" && destinationCoords) {
              
              setIsProcessing(true); 

              try {
                if (!locationData?.latitude || !destinationCoords?.latitude) {
                   console.error("Missing pickup or dropoff coordinates.");
                   return;
                }
///////////////////////////////////////////////////////////////////////////////////////serviceability check
                const serviceResponse = await api.get('/serviceability/check/', { // Ensure this matches your Django URL route prefix
                  params: {
                    pickup_lat: locationData.latitude,
                    pickup_lng: locationData.longitude,
                    dest_lat: destinationCoords.latitude,
                    dest_lng: destinationCoords.longitude
                  }
                });

                // If outside service area, stop and show the custom unavailable modal
                if (serviceResponse.data && serviceResponse.data.serviceable === false) {
                  setServiceUnavailableMessage(
                    serviceResponse.data.message || "No rides are available on this route right now."
                  );
                  setServiceUnavailableVisible(true);
                  setIsProcessing(false);
                  return; // Exit early!
                }

/////////////////////////////////////////////////////////////////////////////////////////////
                // Backend setup implementation injected here
                const vehicleTypes = VEHICLE_TYPE_KEYS;
                const estimatePromises = vehicleTypes.map(async (vType) => {
                  const cleanPayload = {
                    pickup: { latitude: parseFloat(locationData.latitude), longitude: parseFloat(locationData.longitude) },
                    dropoff: { latitude: parseFloat(destinationCoords.latitude), longitude: parseFloat(destinationCoords.longitude) },
                    vehicle_type: vType,
                  };
                  const response = await api.post('/rides/estimate/', cleanPayload);
                  return { type: vType, data: response.data };
                });
                
                const estimatesResults = await Promise.all(estimatePromises);
                
                const fareEstimatesBreakdown = {};
                estimatesResults.forEach(res => { fareEstimatesBreakdown[res.type] = res.data; });

                const navigationParams = {
                  numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
                  pickupAddress: pickupAddress,
                  destinationAddress: destinationAddress,
                  lat: locationData.latitude.toString(),
                  lng: locationData.longitude.toString(),
                  destLat: destinationCoords?.latitude?.toString(),
                  destLng: destinationCoords?.longitude?.toString(),
                  locationData: JSON.stringify(locationData),
                  fareEstimates: JSON.stringify(fareEstimatesBreakdown),
                  ride_type: selectedRideType
                };
                
                router.push({
                  pathname: "availableRides/availableRidesScreen",
                  params: navigationParams
                });

              } catch (error) {
                Alert.alert("Error", "Could not fetch ride estimates. Please try again.");
                console.error("CRITICAL ERROR:", error);
              } finally {
                setIsProcessing(false); 
              }

            } else {
              setpickAlert(true);
              setTimeout(() => setpickAlert(false), 2000);
            }
          }}
        >
          {isProcessing ? (
             <ActivityIndicator color="white" />
          ) : (
             <Text style={styles.confirmButtonText}>
               Confirm {selectedTabIndex === 1 ? "Solo" : "Sharing"}
             </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const header = () => {
    return (
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require("../../../assets/images/user/user1.jpeg")}
            style={styles.profileImage}
          />
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={24} color={Colors.whiteColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const serviceUnavailableModal = () => {
    return (
      <Modal
        visible={serviceUnavailableVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServiceUnavailableVisible(false)}
      >
        <View style={styles.unavailableOverlay}>
          <View style={styles.unavailableCard}>
            <View style={styles.unavailablePinWrap}>
              <Ionicons name="location" size={44} color={Colors.whiteColor} />
            </View>
            <Text style={styles.unavailableTitle}>Oops, service unavailable</Text>
            <Text style={styles.unavailableMessage}>{serviceUnavailableMessage}</Text>

            <TouchableOpacity
              style={styles.unavailablePrimaryButton}
              activeOpacity={0.8}
              onPress={() => setServiceUnavailableVisible(false)}
            >
              <Text style={styles.unavailablePrimaryButtonText}>Notify me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unavailableSecondaryButton}
              activeOpacity={0.8}
              onPress={() => {
                setServiceUnavailableVisible(false);
                setDestinationCoords(null);
                setDestinationAddress("");
                setDestinationModalVisible(true);
              }}
            >
              <Text style={styles.unavailableSecondaryButtonText}>Change location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        {header()}
        {/* <MapSection
          currentLocation={currentLocation}
          destinationCoords={destinationCoords}
          showMap={showMap}
          mapRef={mapRef}
          heading={heading}
          nearbyCars={nearbyCars}
          avatarUrl={avatarUrl} 
        /> */}
        <MapSection
          currentLocation={currentLocation}
          destinationCoords={destinationCoords}
          showMap={showMap}
          mapRef={mapRef}
          heading={heading}
          nearbyCars={nearbyCars}
          avatarUrl={avatarUrl} 
          pickupAddress={pickupAddress} // <-- ADD THIS LINE
        />
        {rideSelectionCard()}
      </View>
      {pickAddressMessage()}
      {pickupLocationModal()}
      {destinationLocationModal()}
      {serviceUnavailableModal()}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  alertContainer: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    zIndex: 100,
  },
  Map: {
    width: '100%',
    height: '100%',
  },
  simpleMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#22C55E',
    borderWidth: 4,
    borderColor: '#FF8811',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  alertTextStyle: {
    ...Fonts.whiteColor14Medium,
    backgroundColor: Colors.blackColor,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding - 5.0,
    borderRadius: Sizes.fixPadding - 5.0,
    overflow: "hidden",
  },
  header: {
    backgroundColor: Colors.primaryColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding + 5.0,
    paddingTop: Sizes.fixPadding * 3.0,
    zIndex: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 45.0,
    height: 45.0,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  welcomeContainer: {
    marginLeft: Sizes.fixPadding,
  },
  welcomeText: {
    ...Fonts.whiteColor12Medium,
    opacity: 0.8,
  },
  userName: {
    ...Fonts.whiteColor18Bold,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideCard: {
    position: "absolute",
    left: Sizes.fixPadding,
    right: Sizes.fixPadding,
    bottom: Sizes.fixPadding * 2,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 2,
    ...CommonStyles.shadow,
    padding: Sizes.fixPadding * 1.5,
    zIndex: 10,
  },
  rideTypeContainer: {
    flexDirection: "row",
    backgroundColor: Colors.bodyBackColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding - 5,
    marginBottom: Sizes.fixPadding * 1.5,
  },
  rideTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding - 2,
  },
  selectedRideType: {
    backgroundColor: Colors.secondaryColor,
  },
  rideTypeText: {
    ...Fonts.grayColor15SemiBold,
    marginLeft: Sizes.fixPadding - 5,
  },
  selectedRideTypeText: {
    ...Fonts.whiteColor15SemiBold,
  },
  locationRow: {
    flexDirection: "row",
    marginBottom: Sizes.fixPadding * 1.5,
  },
  locationDotContainer: {
    alignItems: "center",
    marginRight: Sizes.fixPadding,
    width: 24,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  greenDot: {
    backgroundColor: Colors.greenColor,
  },
  redDot: {
    backgroundColor: Colors.redColor,
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.lightGrayColor,
    marginVertical: 2,
  },
  locationInputsContainer: {
    flex: 1,
  },
  locationInput: {
    paddingVertical: Sizes.fixPadding,
  },
  locationLabel: {
    ...Fonts.grayColor12Medium,
    marginBottom: 2,
  },
  locationAddress: {
    ...Fonts.blackColor16SemiBold,
  },
  destinationPlaceholder: {
    color: Colors.grayColor,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrayColor,
    marginVertical: Sizes.fixPadding - 5,
  },
  confirmButton: {
    backgroundColor: Colors.secondaryColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding + 5,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.lightGrayColor,
    opacity: 0.5,
  },
  confirmButtonText: {
    ...Fonts.whiteColor18Bold,
  },
  chairsContainer: {
    marginBottom: Sizes.fixPadding * 1.5,
  },
  chairsLabel: {
    ...Fonts.grayColor14Medium,
    marginBottom: Sizes.fixPadding,
    textAlign: 'center',
  },
  chairsSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.bodyBackColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding - 5,
  },
  chairButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding - 2,
    marginHorizontal: 2,
  },
  selectedChairButton: {
    backgroundColor: Colors.secondaryColor,
  },
  chairButtonText: {
    ...Fonts.grayColor14SemiBold,
    marginLeft: Sizes.fixPadding - 5,
  },
  selectedChairButtonText: {
    ...Fonts.whiteColor14SemiBold,
  },
  modalContent: {
    backgroundColor: "white",
    marginTop: 120,
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    ...Fonts.blackColor18SemiBold,
  },
  modalSearchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    ...Fonts.blackColor14Medium,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    ...Fonts.blackColor14Medium,
    marginLeft: 10,
    flex: 1,
  },

  // customMarkerWrap: {
  //   alignItems: 'center',
  //   justifyContent: 'flex-end',
  // },
  // markerOuterRing: {
  //   width: 54,
  //   height: 54,
  //   borderRadius: 27,
  //   backgroundColor: Colors.primaryColor, // Uses your app's main color theme
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   ...CommonStyles.shadow, // Reuses your existing shadow token
  // },
  // markerInnerRing: {
  //   width: 46,
  //   height: 46,
  //   borderRadius: 23,
  //   backgroundColor: Colors.whiteColor, // Clean white border separation
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   overflow: 'hidden',
  // },
  // markerProfileImg: {
  //   width: '100%',
  //   height: '100%',
  //   resizeMode: 'cover',
  // },
  // markerTriangle: {
  //   width: 0,
  //   height: 0,
  //   backgroundColor: "transparent",
  //   borderStyle: "solid",
  //   borderLeftWidth: 10,
  //   borderRightWidth: 10,
  //   borderTopWidth: 16,
  //   borderLeftColor: "transparent",
  //   borderRightColor: "transparent",
  //   borderTopColor: Colors.primaryColor, // Matches the outer ring color
  //   marginTop: -2, // Pulls the triangle up slightly to overlap seamlessly with the circle
  // },

  /* --- PICKUP PULSE DOT (red, matches reference halo-dot design) --- */
  pulseDotOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryColor, // soft red halo
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondaryColor,
    borderWidth: 2,
    borderColor: Colors.whiteColor,
  },

  /* --- MARKER STYLES --- */
  customMarkerWrap: {
    // width: 60,       // Fixed width prevents horizontal clipping on iOS
    // height: 75,      // Fixed height (54px ring + 16px triangle + padding) prevents vertical clipping
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  markerOuterRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    ...CommonStyles.shadow,
  },
  markerInnerRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.whiteColor,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  markerProfileImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primaryColor,
    marginTop: -2, 
  },

  /* --- CALLOUT (POP-UP) STYLES --- */
  calloutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250, // Gives the text room to breathe
  },
  calloutBubble: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding - 3.0,
    borderRadius: Sizes.fixPadding - 2.0,
    ...CommonStyles.shadow,
    elevation: 4,
  },
  calloutText: {
    ...Fonts.blackColor14Medium,
    textAlign: 'center',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.whiteColor,
    marginTop: -1,
  },

  /* --- SERVICE UNAVAILABLE MODAL --- */
  unavailableOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  unavailableCard: {
    width: "100%",
    backgroundColor: Colors.whiteColor,
    borderRadius: 18,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    ...CommonStyles.shadow,
  },
  unavailablePinWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  unavailableTitle: {
    ...Fonts.blackColor18SemiBold,
    marginBottom: 6,
    textAlign: "center",
  },
  unavailableMessage: {
    ...Fonts.grayColor14Medium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  unavailablePrimaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.secondaryColor,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  unavailablePrimaryButtonText: {
    ...Fonts.whiteColor15SemiBold,
  },
  unavailableSecondaryButton: {
    width: "100%",
    height: 42,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableSecondaryButtonText: {
    ...Fonts.blackColor16SemiBold,
    color: Colors.primaryColor,
  },
  currentLocationDotOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondaryColor,
    borderWidth: 2,
    borderColor: Colors.whiteColor,
  },
});