

// //home
// import { useIsFocused } from "@react-navigation/native";
// import * as Location from 'expo-location';
// import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert, // Added Alert import
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
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions';
// import Ionicons from "react-native-vector-icons/Ionicons";
// import { Key } from "../../../constants/key";
// import { LIVE_TRACKING_DELTA, MAP_THEME } from "../../../constants/mapTheme";
// import {
//   Colors,
//   CommonStyles,
//   Fonts,
//   Sizes,
// } from "../../../constants/styles";
// import api from "../../../services/api";
// import socket from "../../../services/socketService";
// const GOOGLE_MAPS_API_KEY = Key.apiKey;
// const customMapTheme = MAP_THEME;

// // Add this below your imports
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
//   // Rough approximation: 1 degree latitude ~= 111,000 meters
//   const metersPerDegree = 111000;
  
//   // Set a range between 300 meters and 1200 meters away from pickup point
//   const minDistance = 300;
//   const maxDistance = 1200;
//   const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
  
//   // Distribute headings evenly or randomly across 360 degrees
//   const angle = (index * 75 + Math.random() * 45) % 360;
//   const angleInRadians = (angle * Math.PI) / 180;

//   const deltaLat = (randomDistance * Math.cos(angleInRadians)) / metersPerDegree;
//   // Account for longitude shrinkage depending on distance from the equator
//   const deltaLng = (randomDistance * Math.sin(angleInRadians)) / (metersPerDegree * Math.cos((baseCoords.latitude * Math.PI) / 180));

//   return {
//     id: `mock_nearby_car_${index}_${Date.now()}`,
//     latitude: baseCoords.latitude + deltaLat,
//     longitude: baseCoords.longitude + deltaLng,
//     heading: (angle + 180) % 360, // Set the car pointing back roughly towards or around the center
//   };
// }

// const MAP_ZOOM_DELTA = 0.007;
// const MapSection = ({
//   currentLocation,
//   destinationCoords,
//   showMap,
//   mapRef,
//   heading,
//   nearbyCars = []
// }) => {

//   useEffect(() => {
//     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: MAP_ZOOM_DELTA,
//         longitudeDelta: MAP_ZOOM_DELTA,
//       }, 1000); // 1-second smooth panning animation
//     }
//   }, [currentLocation, destinationCoords, showMap]);
//   if (!showMap || !currentLocation) {
//     return null;
//   }
//   const scale = 0.8;
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.Map}
//         customMapStyle={customMapTheme}
//         // mapId="683bbaed124217965ad088fb"
//         initialRegion={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: LIVE_TRACKING_DELTA,
//           longitudeDelta: LIVE_TRACKING_DELTA,
//         }}
//       >
//         {/* PICKUP MARKER */}
        
//         {/* UPDATED PICKUP MARKER (Vehicle) */}
//         <Marker
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
//             source={require("../../../assets/images/car.png")} 
//             style={{ width: 42, height: 42, resizeMode: 'contain' }}
//           />
         
//         </Marker>
        
//         {/* RANDOM SURROUNDING VEHICLES */}
//         {nearbyCars.map((car) => (
//           <Marker
//             key={car.id}
//             coordinate={{
//               latitude: car.latitude,
//               longitude: car.longitude,
//             }}
//             flat={true}
//             rotation={car.heading}
//             anchor={{ x: 0.5, y: 0.5 }} // Center anchor is critical for clean car asset rotations
//           >
//             <Image 
//               source={require("../../../assets/images/car.png")} 
//               style={{ width: 40, height: 40, resizeMode: 'contain' }}
//             />
//           </Marker>
//         ))}

//         {/* <Marker
//           coordinate={{
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//           }}
//           anchor={{ x: 0.5, y: 1 }}
//         >
//           <View style={styles.simpleMarker}>
//             <Ionicons
//               name="person"
//               size={18}
//               color="white"
//             />
//           </View>
          

//         </Marker> */}

// {/* <Marker
//   coordinate={currentLocation}
//   image={require("../../../assets/images/car-marker-transparent.png")}
//   anchor={{ x: 0.5, y: 0.8 }}
//   flat={true}
// /> */}

//         {/* DESTINATION MARKER */}
//         {destinationCoords && (
//           <Marker
//             coordinate={destinationCoords}
//             image={require("../../../assets/images/destination.png")}
//             anchor={{ x: 0.5, y: 0.8 }}
//             flat={true}
//           />
//         )}

//         {/* ROUTE POLYLINE */}
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

// // const MAP_ZOOM_DELTA = 0.007;

// // const MapSection = ({
// //   currentLocation,
// //   destinationCoords,
// //   showMap,
// //   mapRef,
// //   heading,
// //   nearbyCars = []
// // }) => {
// //   useEffect(() => {
// //     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
// //       mapRef.current.animateToRegion({
// //         latitude: currentLocation.latitude,
// //         longitude: currentLocation.longitude,
// //         latitudeDelta: MAP_ZOOM_DELTA,
// //         longitudeDelta: MAP_ZOOM_DELTA,
// //       }, 1000); // 1-second smooth panning animation
// //     }
// //   }, [currentLocation, destinationCoords, showMap]);



// //   if (!showMap || !currentLocation) {
// //     return null;
// //   }

// //   return (
// //     <View style={{ flex: 1, overflow: 'hidden' }}>
// //       <MapView
// //         ref={mapRef}
// //         provider={PROVIDER_GOOGLE}
// //         style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
// //         customMapStyle={customMapTheme}
// //         initialRegion={{
// //           latitude: currentLocation.latitude,
// //           longitude: currentLocation.longitude,
// //           latitudeDelta: MAP_ZOOM_DELTA,
// //           longitudeDelta: MAP_ZOOM_DELTA,
// //         }}
// //       >
// //         {/* MAIN ACTIVE VEHICLE MARKER */}
// //         <Marker
// //           coordinate={{
// //             latitude: currentLocation.latitude,
// //             longitude: currentLocation.longitude,
// //           }}
// //           flat={true} // Keeps the asset parallel to the earth map grid plane
// //           rotation={heading || 0} 
// //           anchor={{ x: 0.5, y: 0.5 }} // Pivot rotation around absolute center of mass
// //         >
// //           <Image 
// //             source={require("../../../assets/images/car.png")} 
// //             style={{ width: 38, height: 38, resizeMode: 'contain' }}
// //           />
// //         </Marker>
        
// //         {/* AMBIENT SURROUNDING FLEET VEHICLES */}
// //         {nearbyCars.map((car) => (
// //           <Marker
// //             key={car.id}
// //             coordinate={{
// //               latitude: car.latitude,
// //               longitude: car.longitude,
// //             }}
// //             flat={true}
// //             rotation={car.heading || 0}
// //             anchor={{ x: 0.5, y: 0.5 }} // Rotates flawlessly on its center axis
// //           >
// //             <Image 
// //               source={require("../../../assets/images/car.png")} 
// //               style={{ width: 34, height: 34, resizeMode: 'contain', opacity: 0.85 }}
// //             />
// //           </Marker>
// //         ))}

// //         {/* DESTINATION MARKER */}
// //         {destinationCoords && (
// //           <Marker
// //             coordinate={destinationCoords}
// //             anchor={{ x: 0.5, y: 0.5 }}
// //           >
// //             <Image 
// //               source={require("../../../assets/images/destination.png")}
// //               style={{ width: 32, height: 32, resizeMode: 'contain' }}
// //             />
// //           </Marker>
// //         )}

// //         {/* MODERNIZED ROUTE POLYLINE */}
// //         {destinationCoords && (
// //           <MapViewDirections
// //             origin={currentLocation}
// //             destination={destinationCoords}
// //             apikey={GOOGLE_MAPS_API_KEY}
// //             strokeWidth={4} // Slightly thinner line for a more premium look
// //             strokeColor="#1A202C" // Dark slate charcoal line matching sleek light/minimal themes
// //             lineDashPattern={[0]} // Solid uniform line stream
// //             onReady={(result) => {
// //               mapRef.current.fitToCoordinates(
// //                 result.coordinates,
// //                 {
// //                   edgePadding: {
// //                     top: 80,
// //                     right: 60,
// //                     bottom: 320, // Generous breathing space padding for the bottom UI sheet
// //                     left: 60,
// //                   },
// //                   animated: true,
// //                 }
// //               );
// //             }}
// //             onError={(error) => {
// //               console.log("Directions Engine Error: ", error);
// //             }}
// //           />
// //         )}
// //       </MapView>
// //     </View>
// //   );
// // };


// // const CLOSE_ZOOM_DELTA = 0.005; 

// // const MapSection = ({
// //   currentLocation,
// //   destinationCoords,
// //   showMap,
// //   mapRef,
// //   heading,
// //   nearbyCars = []
// // }) => {

// //   // Automatically zoom and focus closely on current/pickup position if no route is active
// //   useEffect(() => {
// //     if (showMap && currentLocation && !destinationCoords && mapRef.current) {
// //       mapRef.current.animateToRegion({
// //         latitude: currentLocation.latitude,
// //         longitude: currentLocation.longitude,
// //         latitudeDelta: CLOSE_ZOOM_DELTA,
// //         longitudeDelta: CLOSE_ZOOM_DELTA,
// //       }, 1000); // 1-second smooth panning animation
// //     }
// //   }, [currentLocation, destinationCoords, showMap]);

// //   if (!showMap || !currentLocation) {
// //     return null;
// //   }

// //   return (
// //     <View style={{ flex: 1, overflow: 'hidden' }}>
// //       <MapView
// //         ref={mapRef}
// //         provider={PROVIDER_GOOGLE}
// //         style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
// //         customMapStyle={customMapTheme}
// //         initialRegion={{
// //           latitude: currentLocation.latitude,
// //           longitude: currentLocation.longitude,
// //           latitudeDelta: CLOSE_ZOOM_DELTA,
// //           longitudeDelta: CLOSE_ZOOM_DELTA,
// //         }}
// //       >
// //         {/* MAIN USER/PICKUP VEHICLE MARKER */}
// //         <Marker
// //           coordinate={{
// //             latitude: currentLocation.latitude,
// //             longitude: currentLocation.longitude,
// //           }}
// //           flat={true} // Keeps asset parallel to the earth map grid plane
// //           rotation={heading || 0} 
// //           anchor={{ x: 0.5, y: 0.5 }} // Pivot rotation around absolute center of mass
// //         >
// //           <Image 
// //             source={require("../../../assets/images/car.png")} 
// //             style={{ width: 38, height: 38, resizeMode: 'contain' }}
// //           />
// //         </Marker>
        
// //         {/* AMBIENT SURROUNDING FLEET VEHICLES (Only visible when destinationCoords exist) */}
// //         {destinationCoords && nearbyCars.map((car) => (
// //           <Marker
// //             key={car.id}
// //             coordinate={{
// //               latitude: car.latitude,
// //               longitude: car.longitude,
// //             }}
// //             flat={true}
// //             rotation={car.heading || 0}
// //             anchor={{ x: 0.5, y: 0.5 }}
// //           >
// //             <Image 
// //               source={require("../../../assets/images/car.png")} 
// //               style={{ width: 34, height: 34, resizeMode: 'contain', opacity: 0.85 }}
// //             />
// //           </Marker>
// //         ))}

// //         {/* DESTINATION MARKER */}
// //         {destinationCoords && (
// //           <Marker
// //             coordinate={destinationCoords}
// //             anchor={{ x: 0.5, y: 0.5 }}
// //           >
// //             <Image 
// //               source={require("../../../assets/images/destination.png")}
// //               style={{ width: 32, height: 32, resizeMode: 'contain' }}
// //             />
// //           </Marker>
// //         )}

// //         {/* MODERNIZED ROUTE POLYLINE */}
// //         {destinationCoords && (
// //           <MapViewDirections
// //             origin={currentLocation}
// //             destination={destinationCoords}
// //             apikey={GOOGLE_MAPS_API_KEY}
// //             strokeWidth={4} // Slightly thinner line for a more premium look
// //             strokeColor="#1A202C" // Dark slate charcoal line matching sleek light/minimal themes
// //             lineDashPattern={[0]} // Solid uniform line stream
// //             onReady={(result) => {
// //               if (mapRef.current) {
// //                 mapRef.current.fitToCoordinates(
// //                   result.coordinates,
// //                   {
// //                     edgePadding: {
// //                       top: 80,
// //                       right: 60,
// //                       bottom: 320, // Increased bottom safety padding to prevent UI sheet overlap
// //                       left: 60,
// //                     },
// //                     animated: true,
// //                   }
// //                 );
// //               }
// //             }}
// //             onError={(error) => {
// //               console.log("Directions Engine Error: ", error);
// //             }}
// //           />
// //         )}
// //       </MapView>
// //     </View>
// //   );
// // };

// const HomeScreen = () => {
//   const navigation = useNavigation();
//   const isFocused = useIsFocused();
//   const { addressFor, address } = useLocalSearchParams();

//   const [pickupAddress, setPickupAddress] = useState("Getting your location...");
//   const [destinationAddress, setDestinationAddress] = useState("");
//   const [pickAlert, setpickAlert] = useState(false);
//   const [showMap, setShowMap] = useState(false);
//   const [selectedTabIndex, setselectedTabIndex] = useState(1);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [numberOfChairs, setNumberOfChairs] = useState(1);
//   const mapRef = useRef(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [locationModalVisible, setLocationModalVisible] = useState(false);
//   const [destinationModalVisible, setDestinationModalVisible] = useState(false); // New state for destination modal
//   const [searchText, setSearchText] = useState("");
//   const [destinationSearchText, setDestinationSearchText] = useState(""); // New state for destination search
//   const [searchResults, setSearchResults] = useState([]);
//   const [destinationSearchResults, setDestinationSearchResults] = useState([]); // New state for destination results
//   const router = useRouter();
//   const [destinationCoords, setDestinationCoords] = useState(null);
//   const [selectedRideType, setSelectedRideType] = useState('standard');
//   const [previousLocation, setPreviousLocation] = useState(null);
//   const [heading, setHeading] = useState(0);

//   useEffect(() => {
//     getCurrentLocation();
//   }, []);

//   const [nearbyCars, setNearbyCars] = useState([]);

// useEffect(() => {
//   if (currentLocation?.latitude && currentLocation?.longitude) {
//     // Generate a pool of 5 random vehicles distributed around the new location
//     const generatedCars = Array.from({ length: 5 }).map((_, index) => 
//       generateRandomDriverLocation(currentLocation, index)
//     );
//     setNearbyCars(generatedCars);
//   }
// }, [currentLocation]);


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
//         showAddressAlert("Destination", address);
//       }
//     }
//   }, [address, addressFor, isFocused]);
  
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
//         console.log("📡 REGISTERING RIDER:", riderId);
//         if (riderId) {
//           socket.emit("register-rider", {
//             riderId: parseInt(riderId)
//           });
//         }
//       } catch (err) {
//         console.log("Error reading riderId from storage:", err);
//       }
//     };
  
//     socket.on("connect", () => {
//       console.log("✅ rider socket connected");
//       registerRider();
//     });
  
//     return () => {
//       socket.off("connect");
//     };
//   }, []);
  
//   useEffect(() => {
//     const riderId = Date.now().toString(); // replace with real user ID
//     socket.emit("register-rider", { riderId });
//     console.log("📡 Registered rider:", riderId);
//   }, []);

//   // Add this useEffect near your other useEffects
//   useEffect(() => {
//     if (previousLocation && currentLocation) {
//       const newHeading = calculateBearing(
//         previousLocation.latitude,
//         previousLocation.longitude,
//         currentLocation.latitude,
//         currentLocation.longitude
//       );
      
//       // Only update heading if the vehicle actually moved
//       if (
//         previousLocation.latitude !== currentLocation.latitude || 
//         previousLocation.longitude !== currentLocation.longitude
//       ) {
//         setHeading(newHeading);
//       }
//     }
//     // Save current location as previous for the next calculation
//     setPreviousLocation(currentLocation);
//   }, [currentLocation]);

  
//   // UTILITY: Generates a random coordinate around a base location within a specific radius (in meters)

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
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}`
//       );
//       const data = await response.json();
      
//       if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
//         console.log("Places API Error:", data.status, data.error_message);
//       }
    
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
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
//       );

//       const data = await response.json();
//       if (data.result && data.result.geometry) {
//         const location = data.result.geometry.location;
//         console.log("Selected Place Name:", data.result.name);
//         console.log("Selected Address:", description);
//         console.log("Selected Coordinates:", {
//           lat: location.lat,
//           lng: location.lng,
//         });
//         if (isDestination) {
//           setDestinationAddress(description);
//           setDestinationCoords({
//             latitude: location.lat,
//             longitude: location.lng
//           });
          
//           setDestinationModalVisible(false);
//           setDestinationSearchText("");
//           setDestinationSearchResults([]);
//           showAddressAlert("Destination", description);
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
//             // onPress={() => setselectedTabIndex(1)}
//             onPress={() => {
//               setselectedTabIndex(1);      // Updates UI styling
//               setSelectedRideType('standard'); // Updates backend data
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
//               setselectedTabIndex(2);      // Updates UI styling
//               setSelectedRideType('shared');   // Updates backend data
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
        

//         {/* <TouchableOpacity
//           style={[
//             styles.confirmButton,
//             (!destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords) && styles.disabledButton
//           ]}
//           disabled={!destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords}
//           onPress={async () => {
//             if (pickupAddress && destinationAddress && pickupAddress !== "Getting your location..." && pickupAddress !== "Unable to get location" && destinationCoords) {
//               const locationData = currentLocation;
              
//               console.log('Navigating with location:', locationData);
//               console.log('Latitude:', locationData.latitude);
//               console.log('Longitude:', locationData.longitude);
              
//               // try {
//               //   // Fetch estimates for all vehicle types matching your Django choices ['economy', 'comfort', 'premium', 'xl']
//               //   const vehicleTypes = ['economy', 'comfort', 'premium', 'xl'];
                
//               //   const estimatePromises = vehicleTypes.map(async (vType) => {
//               //     // 1. Using your configured api instance. The base url is automatically prepended.
//               //     // 2. Your request interceptor injects the Bearer Token automatically.
//               //     const response = await api.post('/rides/estimate/', {
//               //       pickup: {
//               //         latitude: locationData.latitude,
//               //         longitude: locationData.longitude,
//               //       },
//               //       dropoff: {
//               //         latitude: destinationCoords.latitude,
//               //         longitude: destinationCoords.longitude,
//               //       },
//               //       vehicle_type: vType,
//               //     });
              
//               //     // Axios resolves the promise directly with the response schema when successful.
//               //     // Non-2xx status codes automatically throw errors, handling '!response.ok' for you.
//               //     return { type: vType, data: response.data };
//               //   });
              
//               //   const estimatesResults = await Promise.all(estimatePromises);
                
//               //   // Map outcomes into a readable map for availableRidesScreen
//               //   const fareEstimatesBreakdown = {};
//               //   estimatesResults.forEach(res => {
//               //     fareEstimatesBreakdown[res.type] = res.data;
//               //   });
              
//               //   // Create navigation params object passing the live endpoints calculation
//               //   const navigationParams = {
//               //     rideType: selectedTabIndex === 1 ? "solo" : "sharing",
//               //     numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
//               //     pickupAddress: pickupAddress,
//               //     destinationAddress: destinationAddress,
//               //     lat: locationData.latitude.toString(),
//               //     lng: locationData.longitude.toString(),
//               //     destLat: destinationCoords?.latitude?.toString(),
//               //     destLng: destinationCoords?.longitude?.toString(),
//               //     locationData: JSON.stringify(locationData),
//               //     fareEstimates: JSON.stringify(fareEstimatesBreakdown) // JSON format containing calculated breakdown
//               //   };
                
//               //   console.log('Navigation params with live calculations:', navigationParams);
//               //   navigation.push("availableRides/availableRidesScreen", navigationParams);
//               // } catch (error) {
//               //   console.log("API estimation fetch failed:", error);
//               //   Alert.alert(
//               //     "Calculation Error", 
//               //     "Unable to compute fare estimates from your location. Please check server connections and try again."
//               //   );
//               // }
//               try {
//                 // 1. Guard check: Make sure coordinates exist before making network requests
//                 if (!locationData?.latitude || !destinationCoords?.latitude) {
//                   console.error("Missing pickup or dropoff coordinates.");
//                   return;
//                 }
              
//                 const vehicleTypes = ['economy', 'comfort', 'premium', 'xl'];
                
//                 const estimatePromises = vehicleTypes.map(async (vType) => {
//                   // Force coordinates to numeric floating values to satisfy Django's FloatField serializer
//                   const cleanPayload = {
//                     pickup: {
//                       latitude: parseFloat(locationData.latitude),
//                       longitude: parseFloat(locationData.longitude),
//                     },
//                     dropoff: {
//                       latitude: parseFloat(destinationCoords.latitude),
//                       longitude: parseFloat(destinationCoords.longitude),
//                     },
//                     vehicle_type: vType,
//                   };
              
//                   // Replace '/rides/estimate/' with your exact route string if needed
//                   const response = await api.post('/rides/estimate/', cleanPayload);
//                   return { type: vType, data: response.data };
//                 });
              
//                 const estimatesResults = await Promise.all(estimatePromises);
                
//                 const fareEstimatesBreakdown = {};
//                 estimatesResults.forEach(res => {
//                   fareEstimatesBreakdown[res.type] = res.data;
//                 });
              
//                 const navigationParams = {
//                   rideType: selectedTabIndex === 1 ? "solo" : "sharing",
//                   numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
//                   pickupAddress: pickupAddress,
//                   destinationAddress: destinationAddress,
//                   lat: locationData.latitude.toString(),
//                   lng: locationData.longitude.toString(),
//                   destLat: destinationCoords?.latitude?.toString(),
//                   destLng: destinationCoords?.longitude?.toString(),
//                   locationData: JSON.stringify(locationData),
//                   fareEstimates: JSON.stringify(fareEstimatesBreakdown)
//                 };
                
//                 console.log('Navigation params with live calculations:', navigationParams);
//                 navigation.push("availableRides/availableRidesScreen", navigationParams);
              
//               } catch (error) {
//                 // If the server returns a 400 Bad Request, this will log the exact validation messages from Django
//                 if (error.response) {
//                   console.error("Validation error details from Django:", error.response.status, error.response.data);
//                 } else {
//                   console.error("Network error message:", error.message);
//                 }
//               }
//             } else {
//               setpickAlert(true);
//               setTimeout(() => {
//                 setpickAlert(false);
//               }, 2000);
//             }
//           }}
//         >
//           <Text style={styles.confirmButtonText}>
//             Confirm {selectedTabIndex === 1 ? "Solo" : "Sharing"}
//           </Text>
//         </TouchableOpacity> */}

// <TouchableOpacity
//   style={[
//     styles.confirmButton,
//     // Add isProcessing to the disabled condition
//     (isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords) && styles.disabledButton
//   ]}
//   disabled={isProcessing || !destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location" || !destinationCoords}
//   onPress={async () => {
//     console.log("DEBUG: Current location state:", currentLocation);
//     if (!currentLocation) {
//       Alert.alert("Error", "Location is still loading. Please wait.");
//       return;
//   }
//   const locationData = currentLocation;
//     console.log("DEBUG: locationData is:", locationData);
//     // Basic validation check
//     if (pickupAddress && destinationAddress && pickupAddress !== "Getting your location..." && pickupAddress !== "Unable to get location" && destinationCoords) {
      
//       setIsProcessing(true); // 1. Start loading state

//       try {
//         if (!locationData?.latitude || !destinationCoords?.latitude) {
//            console.error("Missing pickup or dropoff coordinates.");
//            return;
//         }

//         const vehicleTypes = ['economy', 'comfort', 'premium', 'xl'];
//         const estimatePromises = vehicleTypes.map(async (vType) => {
//           const cleanPayload = {
//             pickup: { latitude: parseFloat(locationData.latitude), longitude: parseFloat(locationData.longitude) },
//             dropoff: { latitude: parseFloat(destinationCoords.latitude), longitude: parseFloat(destinationCoords.longitude) },
//             vehicle_type: vType,
//           };
//           const response = await api.post('/rides/estimate/', cleanPayload);
//           return { type: vType, data: response.data };
//         });

//         const estimatesResults = await Promise.all(estimatePromises);
        
//         const fareEstimatesBreakdown = {};
//         estimatesResults.forEach(res => { fareEstimatesBreakdown[res.type] = res.data; });

//         const navigationParams = {
//           // rideType: selectedTabIndex === 1 ? "solo" : "sharing",
//           numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
//           pickupAddress: pickupAddress,
//           destinationAddress: destinationAddress,
//           lat: locationData.latitude.toString(),
//           lng: locationData.longitude.toString(),
//           destLat: destinationCoords?.latitude?.toString(),
//           destLng: destinationCoords?.longitude?.toString(),
//           locationData: JSON.stringify(locationData),
//           fareEstimates: JSON.stringify(fareEstimatesBreakdown),
//           ride_type: selectedRideType
//         };
        
        
//         router.push({
//           pathname: "availableRides/availableRidesScreen",
//           params: navigationParams
//       });

//       } catch (error) {
//         if (error.response) {
//           console.error("Validation error details from Django:", error.response.status, error.response.data);
//         } else {
//           console.error("Network error message:", error.message);
//         }
//         Alert.alert("Error", "Could not fetch ride estimates. Please try again.");
//         console.error("CRITICAL ERROR:", error);
//       } finally {
//         setIsProcessing(false); // 2. Stop loading state (this runs on success AND error)
//       }

//     } else {
//       setpickAlert(true);
//       setTimeout(() => setpickAlert(false), 2000);
//     }
//   }}
// >
//   {/* UX Tip: Show an indicator inside the button when processing */}
//   {isProcessing ? (
//      <ActivityIndicator color="white" />
//   ) : (
//      <Text style={styles.confirmButtonText}>
//        Confirm {selectedTabIndex === 1 ? "Solo" : "Sharing"}
//      </Text>
//   )}
// </TouchableOpacity>

//       </View>
//     );
//   };

//   const header = () => {
//     return (
//       <View style={styles.header}>
//         <View style={styles.profileContainer}>
//           <Image
//             source={require("../../../assets/images/user/user1.jpeg")}
//             style={styles.profileImage}
//           />
//           <View style={styles.welcomeContainer}>
//             <Text style={styles.welcomeText}>Welcome back,</Text>
//             <Text style={styles.userName}>John Doe</Text>
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
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
const MapSection = ({
  currentLocation,
  destinationCoords,
  showMap,
  mapRef,
  heading,
  nearbyCars = []
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
            source={require("../../../assets/images/car.png")} 
            style={{ width: 42, height: 42, resizeMode: 'contain' }}
          />
        </Marker>
        
        {nearbyCars.map((car) => (
          <Marker
            key={car.id}
            coordinate={{
              latitude: car.latitude,
              longitude: car.longitude,
            }}
            flat={true}
            rotation={car.heading}
            anchor={{ x: 0.5, y: 0.5 }} 
          >
            <Image 
              source={require("../../../assets/images/car.png")} 
              style={{ width: 40, height: 40, resizeMode: 'contain' }}
            />
          </Marker>
        ))}

        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            image={require("../../../assets/images/destination.png")}
            anchor={{ x: 0.5, y: 0.8 }}
            flat={true}
          />
        )}

        {destinationCoords && (
          <MapViewDirections
            origin={currentLocation}
            destination={destinationCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor='#1A202C'
            onReady={(result) => {
              mapRef.current.fitToCoordinates(
                result.coordinates,
                {
                  edgePadding: {
                    top: 100,
                    right: 50,
                    bottom: 300,
                    left: 50,
                  },
                  animated: true,
                }
              );
            }}
            onError={(error) => {
              console.log(error);
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
      } else {
        setDestinationAddress(address);
        showAddressAlert("Destination", address);
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

  const searchLocation = async (text, isDestination = false) => {
    if (isDestination) {
      setDestinationSearchText(text);
    } else {
      setSearchText(text);
    }

    if (text.length < 2) {
      if (isDestination) {
        setDestinationSearchResults([]);
      } else {
        setSearchResults([]);
      }
      return;
    }

    try {
      const response = await api.get('/rides/places/autocomplete/', {
        params: {
          input: text,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        },
      });
      const data = response.data;

      if (isDestination) {
        setDestinationSearchResults(data.predictions || []);
      } else {
        setSearchResults(data.predictions || []);
      }
    } catch (error) {
      console.log("Search error:", error);
    }
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
          showAddressAlert("Destination", description);
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        {header()}
        <MapSection
          currentLocation={currentLocation}
          destinationCoords={destinationCoords}
          showMap={showMap}
          mapRef={mapRef}
          heading={heading}
          nearbyCars={nearbyCars}
        />
        {rideSelectionCard()}
      </View>
      {pickAddressMessage()}
      {pickupLocationModal()}
      {destinationLocationModal()}
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
});