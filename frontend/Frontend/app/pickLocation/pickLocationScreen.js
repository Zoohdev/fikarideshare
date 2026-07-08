// PickLocationScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
  SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from "expo-router";
import MapView, { PROVIDER_GOOGLE,Marker} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MAP_THEME, LIVE_TRACKING_DELTA } from '../../constants/mapTheme';
import api from '../../services/api';
const customMapTheme = MAP_THEME;

const MapSection = ({
  currentLocation,
  mapRef,
  onMapPress,
}) => {

  if (!currentLocation) {
    return null;
  }

  return (
    <MapView
      ref={mapRef}

      provider={PROVIDER_GOOGLE}

      style={styles.webview}

      customMapStyle={customMapTheme}

      onPress={onMapPress}

      showsCompass={false}

      showsBuildings={true}

      toolbarEnabled={false}

      initialRegion={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,

        latitudeDelta: LIVE_TRACKING_DELTA,
        longitudeDelta: LIVE_TRACKING_DELTA,
      }}
      onMapReady={() => {

        mapRef.current.animateCamera({
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
      
          zoom: 16,
        });
      
      }}
    >

      {/* PICKUP MARKER */}

      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}

        anchor={{
          x: 0.5,
          y: 1,
        }}
      >
        <View style={styles.simpleMarker}>
          <Ionicons
            name="person"
            size={18}
            color="white"
          />
        </View>
      </Marker>

    </MapView>
  );
};

export default function PickLocationScreen() {
  const navigation = useNavigation();
  const { addressFor } = useLocalSearchParams();

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [address, setAddress] = useState("");
  
  const mapRef  = useRef(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (showBottomSheet) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showBottomSheet]);

  const checkLocationPermission = async () => {
    try {
      setIsLoading(true);
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        getCurrentLocation();
      } else {
        await requestLocationPermission();
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setErrorMsg('Error checking location permission');
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        getCurrentLocation();
      } else {
        setPermissionGranted(false);
        setErrorMsg('Location permission denied. Using default location.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setPermissionGranted(false);
      setErrorMsg('Error requesting location permission');
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location request timeout')), 10000)
        )
      ]);

      setLocation(location);
      setErrorMsg(null);
      
      // Set current location as selected location automatically
      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setSelectedLocation({
        ...currentCoords,
        name: "Current Location",
        address: "Getting address..."
      });
      
      // Get address for current location
      await getAddressFromCoordinates(currentCoords);
      
      // Show bottom sheet automatically with current location
      setShowBottomSheet(true);
      
    } catch (error) {
      console.error('Location error:', error);
      
      if (error.message === 'Location request timeout') {
        setErrorMsg('Location request timed out. Using default location.');
      } else if (error.code === 'CURRENT_LOCATION_UNAVAILABLE') {
        setErrorMsg('Location services disabled. Please enable location services.');
      } else {
        setErrorMsg('Could not get current location. Using default location.');
      }
      
      const defaultLocation = {
        coords: {
          latitude: -26.2041,
          longitude: 28.0473,
        }
      };
      setLocation(defaultLocation);
      
      const defaultCoords = {
        latitude: -26.2041,
        longitude: 28.0473
      };
      
      setSelectedLocation({
        ...defaultCoords,
        name: "Default Location",
        address: "Johannesburg, South Africa"
      });
      
      await getAddressFromCoordinates(defaultCoords);
      setShowBottomSheet(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (coords) => {
    try {
      let [response] = await Location.reverseGeocodeAsync(coords);
      let fullAddress = `${response.street || ""}, ${response.city || ""}, ${response.region || ""}, ${response.country || ""}`.replace(/^,\s*|,\s*$/g, '');
      setAddress(fullAddress);
      
      // Update selected location with proper address
      if (selectedLocation) {
        setSelectedLocation(prev => ({
          ...prev,
          address: fullAddress
        }));
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress("Address not available");
    }
  };

  const searchDestinations = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get('/rides/places/autocomplete/', {
        params: {
          input: query,
          latitude: location?.coords?.latitude,
          longitude: location?.coords?.longitude,
        },
      });

      if (response.data.predictions) {
        setSearchResults(response.data.predictions);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectDestination = async (placeId, description) => {
    try {
      const response = await api.get('/rides/places/details/', {
        params: { place_id: placeId },
      });

      const place = response.data;
      if (place) {
        const locationData = {
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          placeId: placeId
        };
        
        setSelectedLocation(locationData);
        setSearchQuery(description);
        setAddress(place.address);
        setShowSearchResults(false);
        setShowBottomSheet(true);
        
        if (mapRef.current) {
          mapRef.current.postMessage(JSON.stringify({
            type: 'SET_DESTINATION',
            destination: locationData
          }));
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  const handleMapPress = async (event) => {
    if (event.nativeEvent && event.nativeEvent.coordinate) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const locationData = {
        latitude,
        longitude,
        name: "Selected Location",
        address: "Getting address..."
      };
      
      setSelectedLocation(locationData);
      await getAddressFromCoordinates({ latitude, longitude });
      setShowBottomSheet(true);
      
      if (mapRef.current) {
        mapRef.current.postMessage(JSON.stringify({
          type: 'SET_DESTINATION',
          destination: locationData
        }));
      }
    }
  };

  const confirmLocation = () => {
    if (selectedLocation && address) {
      navigation.navigate("(tabs)", {
        screen: "home/homeScreen",
        params: { 
          address: address,
          addressFor: addressFor 
        },
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

 
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#264D66" />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  const currentLat = location?.coords?.latitude || -26.2041;
  const currentLng = location?.coords?.longitude || 28.0473;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>
            {addressFor === "pickup" ? "Pick Pickup Location" : "Choose Destination"}
          </Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Where to"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchDestinations(text);
            }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            placeholderTextColor="#666"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => selectDestination(item.place_id, item.description)}
              >
                <Ionicons name="location-outline" size={20} color="#666" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultTitle}>{item.main_text}</Text>
                  <Text style={styles.searchResultSubtitle}>{item.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <MapSection
  currentLocation={{
    latitude: currentLat,
    longitude: currentLng,
  }}

  mapRef={mapRef}

  onMapPress={handleMapPress}
/>
      
      {/* Location Indicator */}
      <View style={styles.locationIndicator}>
        <Ionicons name="navigate" size={16} color="#264D66" />
        <Text style={styles.locationText}>
          {permissionGranted ? 'Using GPS location' : 'Using approximate location'}
        </Text>
      </View>

      {/* Bottom Confirmation Sheet */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.bottomSheetHandle} />
        
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>
            {addressFor === "pickup" ? "Pickup Location" : "Destination"}
          </Text>
          <View style={styles.selectedLocation}>
            <Ionicons 
              name="location" 
              size={20} 
              color={addressFor === "pickup" ? "#264D66" : "#dc2626"} 
            />
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {address || "Select a location on the map"}
              </Text>
              {selectedLocation && (
                <Text style={styles.locationCoordinates}>
                  {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            !selectedLocation && styles.disabledButton
          ]} 
          onPress={confirmLocation}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>
            Confirm {addressFor === "pickup" ? "Pickup" : "Destination"}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={getCurrentLocation}>
          <Ionicons name="navigate" size={24} color="#FF8C00" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  
    shadowColor: '#000',
  
    shadowOffset: {
      width: 0,
      height: 2,
    },
  
    shadowOpacity: 0.2,
  
    shadowRadius: 4,
  
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#264D66',
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  // Header Styles
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: '#FF8C00',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  // Search Styles
  searchCard: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
    marginRight: 8,
  },
  // Search Results Styles
  searchResults: {
    position: 'absolute',
    top: 170,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Location Indicator
  locationIndicator: {
    position: 'absolute',
    top: 170,
    alignSelf: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#264D66',
  },
  // Bottom Sheet Styles
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e5e5',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#666',
  },
  // Button Styles
  confirmButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Action Buttons
  actionButtons: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
});