//home
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert // Added Alert import
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  Colors,
  Sizes,
  Fonts,
  CommonStyles,
} from "../../../constants/styles";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import * as Location from 'expo-location';
import socket from "../../../services/socketService";
// IMPORTANT: Move API key to environment variables for security
const GOOGLE_MAPS_API_KEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA';

const HomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { addressFor, address } = useLocalSearchParams();

  const [pickupAddress, setPickupAddress] = useState("Getting your location...");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickAlert, setpickAlert] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedTabIndex, setselectedTabIndex] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [numberOfChairs, setNumberOfChairs] = useState(1);
  const webViewRef = useRef(null);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false); // New state for destination modal
  const [searchText, setSearchText] = useState("");
  const [destinationSearchText, setDestinationSearchText] = useState(""); // New state for destination search
  const [searchResults, setSearchResults] = useState([]);
  const [destinationSearchResults, setDestinationSearchResults] = useState([]); // New state for destination results

  const [destinationCoords, setDestinationCoords] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

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
    const riderId = Date.now().toString(); // replace with real user ID
  
    socket.emit("register-rider", { riderId });
  
    console.log("📡 Registered rider:", riderId);
  }, []);



  // New function to show address alert
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
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
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
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
      if (data.result && data.result.geometry) {
        const location = data.result.geometry.location;

        if (isDestination) {
          setDestinationAddress(description);
          // ----------------------------------
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

  const generateMapHTML = (lat = -26.2041, lng = 28.0473) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body, html { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        #map { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let currentMarker;
        let destinationMarker;

        function initMap() {
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 15,
                center: { lat: ${lat}, lng: ${lng} },
                styles: [
                    {
                        "elementType": "geometry",
                        "stylers": [{ "color": "#f5f5f5" }]
                    },
                    {
                        "elementType": "labels.icon",
                        "stylers": [{ "visibility": "off" }]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#616161" }]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#f5f5f5" }]
                    },
                    {
                        "featureType": "administrative.land_parcel",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#bdbdbd" }]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#eeeeee" }]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#757575" }]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#e5e5e5" }]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#9e9e9e" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#ffffff" }]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#757575" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#dadada" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#616161" }]
                    },
                    {
                        "featureType": "road.local",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#9e9e9e" }]
                    },
                    {
                        "featureType": "transit.line",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#e5e5e5" }]
                    },
                    {
                        "featureType": "transit.station",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#eeeeee" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#c9c9c9" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#9e9e9e" }]
                    }
                ],
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: false
            });

            currentMarker = new google.maps.Marker({
                position: { lat: ${lat}, lng: ${lng} },
                map: map,
                title: "Your location",
                icon: {
                    url: 'data:image/svg+xml;base64,' + btoa('<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C12.268 0 6 6.268 6 14C6 24.5 20 40 20 40C20 40 34 24.5 34 14C34 6.268 27.732 0 20 0Z" fill="%23264D66"/><circle cx="20" cy="14" r="6" fill="white"/></svg>'),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 40)
                }
            });

            map.addListener('click', function(event) {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MAP_CLICK',
                        coordinate: event.latLng.toJSON()
                    }));
                }
            });
        }

        function setDestination(dest) {
            if (destinationMarker) {
                destinationMarker.setMap(null);
            }

            destinationMarker = new google.maps.Marker({
                position: { lat: dest.latitude, lng: dest.longitude },
                map: map,
                title: dest.name,
                icon: {
                    url: 'data:image/svg+xml;base64,' + btoa('<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C12.268 0 6 6.268 6 14C6 24.5 20 40 20 40C20 40 34 24.5 34 14C34 6.268 27.732 0 20 0Z" fill="%23dc2626"/><circle cx="20" cy="14" r="6" fill="white"/></svg>'),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 40)
                }
            });

            const bounds = new google.maps.LatLngBounds();
            bounds.extend(currentMarker.getPosition());
            bounds.extend(destinationMarker.getPosition());
            map.fitBounds(bounds);
        }

        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'SET_DESTINATION') {
                    setDestination(data.destination);
                }
            } catch (error) {
                console.log('Error parsing message:', error);
            }
        });

        function loadScript() {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=geometry';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        
        window.onload = loadScript;
    </script>
</body>
</html>
`;

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
            onPress={() => setselectedTabIndex(1)}
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
            onPress={() => setselectedTabIndex(2)}
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
              onPress={() => setDestinationModalVisible(true)} // Updated to use local modal
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

          // In HomeScreen, update the onPress for confirm button
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location") && styles.disabledButton
            ]}
            disabled={!destinationAddress || !pickupAddress || pickupAddress === "Getting your location..." || pickupAddress === "Unable to get location"}
            onPress={() => {
              if (pickupAddress && destinationAddress && pickupAddress !== "Getting your location..." && pickupAddress !== "Unable to get location") {
                // Ensure currentLocation has proper coordinates
                const locationData = currentLocation;
                
                console.log('Navigating with location:', locationData);
                console.log('Latitude:', locationData.latitude);
                console.log('Longitude:', locationData.longitude);
                
                // Create a data object to pass
                const navigationParams = {
                  rideType: selectedTabIndex === 1 ? "solo" : "sharing",
                  numberOfChairs: selectedTabIndex === 2 ? numberOfChairs : 1,
                  pickupAddress: pickupAddress,
                  destinationAddress: destinationAddress,
                  // Convert to strings explicitly
                  lat: locationData.latitude.toString(),
                  lng: locationData.longitude.toString(),
                  // Also pass as JSON for backup
                  locationData: JSON.stringify(locationData),
                };
                
                console.log('Navigation params:', navigationParams);
                
                navigation.push("availableRides/availableRidesScreen", navigationParams);
              } else {
                setpickAlert(true);
                setTimeout(() => {
                  setpickAlert(false);
                }, 2000);
              }
            }}
          >
            <Text style={styles.confirmButtonText}>
              Confirm {selectedTabIndex === 1 ? "Solo" : "Sharing"}
            </Text>
          </TouchableOpacity>
          </View>
        );
      };

      const map = () => {
        const currentLat = currentLocation?.latitude || -26.2041;
        const currentLng = currentLocation?.longitude || 28.0473;

        return (
          showMap && (
            <WebView 
              ref={webViewRef}
              source={{ html: generateMapHTML(currentLat, currentLng) }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'MAP_CLICK') {
                    console.log('Map clicked at:', data.coordinate);
                  }
                } catch (error) {
                  console.log('Error parsing WebView message:', error);
                }
              }}
            />
          )
        );
      };

      const header = () => {
        return (
          <View style={styles.header}>
            <View style={styles.profileContainer}>
              <Image
                source={require("../../../assets/images/user/user1.jpeg")}
                style={styles.profileImage}
              />
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>John Doe</Text>
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
        {map()}
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