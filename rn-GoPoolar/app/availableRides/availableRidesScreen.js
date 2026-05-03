//available rides

import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import socket from "../../services/socketService";
const socketRef = useRef(null);
import { useRouter } from "expo-router"; 
const axios = require("axios");

const GOOGLE_MAPS_API_KEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA';
const API_BASE = "http://192.168.1.4:3000"; // Localhost for Android emulator

// Cancellation reasons dropdown options
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
  {
    id: "1",
    name: "Cash",
    icon: "attach-money",
    type: "cash",
  },
  {
    id: "2",
    name: "Fika Account",
    icon: "account-balance-wallet",
    type: "fika",
    balance: "R 245.50",
  },
  {
    id: "3",
    name: "Credit/Debit Card",
    icon: "credit-card",
    type: "card",
    lastFour: "4242",
  },
];

// Animated Dot Component for loading animation
const AnimatedDot = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.searchDot,
        { opacity, backgroundColor: Colors.primaryColor }
      ]}
    />
  );
};

const AvailableRidesScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null); // 'waiting' or 'confirmed'
  const webViewRef = useRef(null);
  const [matchedRide, setMatchedRide] = useState(null);
  // Cancellation modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(null);
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [destinationCoord, setDestinationCoord] = useState(null);
const socketRef = useRef(null);
const router = useRouter();
  

  
  useEffect(() => {
    const fetchCoords = async () => {
      const coords = await generateDestinationCoords(destinationAddress);
      if (coords) {
        setDestinationCoord(coords);
      } else {
        console.log("❌ Failed to fetch destination coords");
      }
      console.log("📍 Destination coords:", coords);
  
      setDestinationCoord(coords);
    };
  
    fetchCoords();
  }, [destinationAddress]);

  useEffect(() => {
    const sendLocation = async () => {
      const riderId = await AsyncStorage.getItem("riderId");
  
      if (!riderId) {
        console.log("❌ No riderId found");
        return;
      }
  
      const lat = currentLocation.latitude;
      const lng = currentLocation.longitude;
  
      console.log("📍 Sending location:", riderId, lat, lng);
  
      socket.emit("send-location", {
        riderId,
        lat,
        lng
      });
    };
  
    sendLocation();
  }, [currentLocation]);
  

  // Parse the passed parameters properly
  const rideType = params.rideType || "solo";
  const numberOfChairs = params.numberOfChairs ? parseInt(params.numberOfChairs) : 1;
  const pickupAddress = params.pickupAddress || "Current Location";
  const destinationAddress = params.destinationAddress || "Destination";
  
  // Parse current location - try multiple sources
  let currentLocation = { latitude: -26.2041, longitude: 28.0473 };
  
  // Try to get coordinates from lat/lng params (passed as strings)
  if (params.lat !== undefined && params.lng !== undefined) {
    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      currentLocation = {
        latitude: lat,
        longitude: lng
      };
      console.log(' Using lat/lng params:', currentLocation);
    }
  } 
  // Try to get from locationData JSON string
  else if (params.locationData) {
    try {
      const location = JSON.parse(params.locationData);
      if (location.latitude && location.longitude) {
        currentLocation = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        };
        console.log(' Using locationData JSON:', currentLocation);
      }
    } catch (e) {
      console.error('Error parsing locationData:', e);
    }
  }
  // Try to get from currentLocation param (if passed as string)
  else if (params.currentLocation && typeof params.currentLocation === 'string') {
    try {
      const location = JSON.parse(params.currentLocation);
      if (location.latitude && location.longitude) {
        currentLocation = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        };
        console.log(' Using currentLocation JSON:', currentLocation);
      }
    } catch (e) {
      console.error('Error parsing currentLocation:', e);
    }
  }
  
  // For solo rides, ensure numberOfChairs is at least 4
  // const finalNumberOfChairs = rideType === "solo" ? 3 : numberOfChairs;  ----AFIKA
  const finalNumberOfChairs = rideType === "solo" ? 1 : numberOfChairs;
  console.log('📦 Final parsed parameters:', {
    rideType,
    numberOfChairs: finalNumberOfChairs,
    pickupAddress,
    destinationAddress,
    currentLocation
  });

  // Fetch available rides from API
  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add ride type if provided
      if (rideType && rideType !== 'all') {
        queryParams.append('rideType', rideType);
      }
      
      // Add number of chairs
      if (finalNumberOfChairs && finalNumberOfChairs > 0) {
        queryParams.append('numberOfChairs', finalNumberOfChairs.toString());
      }
      
      // Add addresses
      if (pickupAddress) {
        queryParams.append('pickupAddress', pickupAddress);
      }
      
      if (destinationAddress) {
        queryParams.append('destinationAddress', destinationAddress);
      }
      
      // Add coordinates (these are the most important!)
      if (currentLocation.latitude && !isNaN(currentLocation.latitude)) {
        queryParams.append('latitude', currentLocation.latitude.toString());
      } else {
        console.log(' Using default latitude');
        // queryParams.append('latitude', '-26.2041');
        Alert.alert(
          "Location Error ",
          "Location is not fetched. implement a function that fetch location.",
          [{ text: "OK" }]
        );
      }
      
      if (currentLocation.longitude && !isNaN(currentLocation.longitude)) {
        queryParams.append('longitude', currentLocation.longitude.toString());
      } else {
        console.log(' Using default longitude');
        // queryParams.append('longitude', '28.0473');
        Alert.alert(
          "Location Error ",
          "Location is not fetched. implement a function that fetch location.",
          [{ text: "OK" }]
        );
      }
      
      const url = `${API_BASE}/api/rides/available?${queryParams.toString()}`;
      console.log(' Fetching rides from URL:', url);
      
      const response = await fetch(url);
      console.log(' Response status:', response.status);
      
      const data = await response.json();
      console.log(' API Response success:', data.success);
      console.log(' Rides count:', data.data?.length || 0);
      console.log("data from available api",data.data)
      if (data.success) {
        console.log(' Rides fetched:', data.data.length);
        if (data.data.length > 0) {
          console.log(' First ride sample:', data.data[0]);
        }
        setAvailableRides(data.data);
      } else {
        setError(data.message || 'Failed to fetch rides');
        Alert.alert('Error', data.message || 'Failed to fetch available rides');
      }
    } catch (error) {
      console.error(' Error fetching rides:', error);
      setError('Network error. Please check your connection.');
      Alert.alert('Error', 'Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableRides();

    
  
    socketRef.current = socket;
  
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });
  
    //  LISTEN FOR DRIVER ACCEPT

    socket.on("rideAccepted", (data) => {
      console.log("🎉 Ride accepted:", data);
    
      setBookingStatus("accepted");
    
      Alert.alert(
        "Driver Found 🚗",
        "Your driver is on the way!",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.push("rideTracking/rideTracking", data);
            }
          }
        ]
      );
    });




  
    return () => {
      socket.disconnect();
    };
  }, [currentTripId]);


  // Generate destination coordinates (in a real app, you'd geocode the address)
  const generateDestinationCoords = async (address) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
  
    const data = await res.json();
  
    if (data.results.length > 0) {
      const loc = data.results[0].geometry.location;
  
      return {
        latitude: loc.lat,
        longitude: loc.lng
      };
    }
  
    return null;
  };

  

  const generateMapHTML = (pickupLat, pickupLng, destLat, destLng) => `
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
        let routePolyline;

        function initMap() {
            // Create blue and white styled map
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 15,
                center: { lat: ${pickupLat}, lng: ${pickupLng} },
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

            // Current location marker (blue pin)
            currentMarker = new google.maps.Marker({
                position: { lat: ${pickupLat}, lng: ${pickupLng} },
                map: map,
                title: "Your location",
                icon: {
                    url: 'data:image/svg+xml;base64,' + btoa('<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C12.268 0 6 6.268 6 14C6 24.5 20 40 20 40C20 40 34 24.5 34 14C34 6.268 27.732 0 20 0Z" fill="%23264D66"/><circle cx="20" cy="14" r="6" fill="white"/></svg>'),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 40)
                }
            });

            // Destination marker (red pin)
            destinationMarker = new google.maps.Marker({
                position: { lat: ${destLat}, lng: ${destLng} },
                map: map,
                title: "Destination",
                icon: {
                    url: 'data:image/svg+xml;base64,' + btoa('<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C12.268 0 6 6.268 6 14C6 24.5 20 40 20 40C20 40 34 24.5 34 14C34 6.268 27.732 0 20 0Z" fill="%23dc2626"/><circle cx="20" cy="14" r="6" fill="white"/></svg>'),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 40)
                }
            });

            // Draw route between points (simplified straight line)
            // const routeCoordinates = [
            //     { lat: ${pickupLat}, lng: ${pickupLng} },
            //     { lat: ${destLat}, lng: ${destLng} }
            // ];

            // routePolyline = new google.maps.Polyline({
            //     path: routeCoordinates,
            //     geodesic: true,
            //     strokeColor: "#264D66",
            //     strokeOpacity: 1.0,
            //     strokeWeight: 4,
            // });

            // routePolyline.setMap(map);

            // Real route using roads
const directionsService = new google.maps.DirectionsService();
const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true, // keep your custom markers
    polylineOptions: {
        strokeColor: "#264D66",
        strokeOpacity: 1.0,
        strokeWeight: 4,
    }
});

directionsRenderer.setMap(map);

directionsService.route(
    {
        origin: { lat: ${pickupLat}, lng: ${pickupLng} },
        destination: { lat: ${destLat}, lng: ${destLng} },
        travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);
        } else {
            console.error("Directions request failed:", status);
        }
    }
);

            // Center map on both locations
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(currentMarker.getPosition());
            bounds.extend(destinationMarker.getPosition());
            map.fitBounds(bounds);
        }

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

const generateRouteHTML = (sequence) => {
  const waypoints = sequence.map(s => ({
    lat: s.lat,
    lng: s.lng
  }));

  return `
  <html>
  <body>
    <div id="map" style="height:100vh"></div>
    <script>
      function initMap() {
        const map = new google.maps.Map(document.getElementById("map"), {
          zoom: 13,
          center: { lat: ${waypoints[0].lat}, lng: ${waypoints[0].lng} }
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        directionsService.route({
          origin: ${JSON.stringify(waypoints[0])},
          destination: ${JSON.stringify(waypoints[waypoints.length - 1])},
          waypoints: ${JSON.stringify(
            waypoints.slice(1, -1).map(w => ({
              location: w,
              stopover: true
            }))
          )},
          travelMode: "DRIVING"
        }, (result, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(result);
          }
        });
      }

      const script = document.createElement("script");
      script.src = "https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap";
      script.async = true;
      document.head.appendChild(script);
    </script>
  </body>
  </html>
  `;
};
  // Function to cancel ride with reason
  const cancelRide = async (tripId, reason) => {
    try {
      setIsCancelling(true);
      const riderId = await AsyncStorage.getItem("riderId");
      
      if (!riderId) {
        Alert.alert('Error', 'Please login again');
        setIsCancelling(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/rides/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          cancellation_reason: reason,
          cancelled_by: riderId
          // cancelled_by: parseInt(riderId)

        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Ride Cancelled',
          'Your ride has been cancelled successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCancelModal(false);
                setIsBooking(false);
                setBookingStatus(null);
                setCurrentTripId(null);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel ride');
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Function to handle cancel waiting
  const handleCancelWaiting = () => {
    setShowCancelModal(true);
  };

  // Function to handle cancellation reason selection
  const handleReasonSelect = (reason) => {
    setSelectedCancelReason(reason);
    if (reason.label !== 'Other') {
      setCustomCancelReason('');
    }
  };

  // Function to submit cancellation
  const submitCancellation = () => {
    if (!selectedCancelReason) {
      Alert.alert('Error', 'Please select a reason for cancellation');
      return;
    }
    
    let finalReason = selectedCancelReason.label;
    if (selectedCancelReason.label === 'Other' && customCancelReason.trim()) {
      finalReason = customCancelReason.trim();
    } else if (selectedCancelReason.label === 'Other' && !customCancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    
    cancelRide(currentTripId, finalReason);
  };

  const bookTrip = async () => {
    // if (rideType === "sharing") {
    //   console.log("🚀 Sending shared ride request");
    
    //   setIsBooking(true);
    //   setBookingStatus("waiting");
    
    //   const rider = {
    //     id:availableRides.id,
    //     name: "Rider_" + Date.now(),
    //     pickup: {
    //       lat: currentLocation.latitude,
    //       lng: currentLocation.longitude,
    //     },
    //     destination: {
    //       lat: destinationCoords.latitude,
    //       lng: destinationCoords.longitude,
    //     },
    //   };
    
    //   socket.emit("request-ride", {
    //     rideType: "shared",
    //     rider,
    //     seats: numberOfChairs,
    //   });
    
    //   console.log("📤 Shared ride requested from AvailableRides");
    
    //   return;
    // }

    try {
      // First, show waiting state
      setIsBooking(true);
      setBookingStatus('waiting');
      
      const selectedRideData = availableRides.find(r => r.id === selectedRide);
      console.log("selectedRideData".selectedRideData);
      // Validate required data
      if (!selectedRideData) {
        Alert.alert('Error', 'Please select a ride');
        setIsBooking(false);
        setBookingStatus(null);
        return;
      }
      
      if (!selectedPaymentMethod) {
        Alert.alert('Error', 'Please select a payment method');
        setIsBooking(false);
        setBookingStatus(null);
        return;
      }
      
      let riderId = await AsyncStorage.getItem("riderId");
     
      if (!riderId) {
        console.error("No rider ID found");
        setIsBooking(false);
        setBookingStatus(null);
        return;
      }

      // Prepare trip data with driver_id empty and status as 'requested'
      const tripData = {
        rideOptionId: parseInt(selectedRide),
        pickup_location: pickupAddress,
        pickup_latitude: currentLocation.latitude,
        pickup_longitude: currentLocation.longitude,
        dropoff_location: destinationAddress,
        dropoff_latitude: destinationCoord.latitude,
        dropoff_longitude: destinationCoord.longitude,
        // distance: 5.2,
        // duration: 15,
        tripType: rideType,
        fare_amount: parseFloat(selectedRideData.amount.replace('R', '').trim()),
        discount_amount: 0,
        total_amount: parseFloat(selectedRideData.amount.replace('R', '').trim()),
        payment_method_id: selectedPaymentMethod.id,
        rider_id: parseInt(riderId),
        driver_id: null, // Leave driver_id empty initially
        trip_status: 'requested', // Set status as requested
        scheduled_time: null,
        
      };
      console.log (riderId,tripType),
      console.log('📤 Booking trip with data:', tripData);
      
      // Simulate API delay for waiting screen (remove in production)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`${API_BASE}/api/rides/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tripData)
      });
      
      console.log('📡 Response status:', response.status);
      
      // Check if response is OK
      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Error response body:', text);
        
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log('✅ Booking response:', data);
      
      if (data.success && data.data?.trip_id) {
        // Update to confirmed state
        // setBookingStatus('confirmed');

        setBookingStatus('waiting');
        setCurrentTripId(data.data.trip_id);  


        
        
        // Show success message with waiting info
        Alert.alert(
          'Ride Requested!', 
          `Your ${selectedRideData.name} has been requested. We're finding a driver for you.`,
          [
            {
              text: 'OK',
              
              onPress: () => {
                setIsBooking(true);
setBookingStatus("waiting");
setCurrentTripId(data.data.trip_id);
              }
            }
          ]
        );
      } else {
        // If booking fails, clear waiting state
        setIsBooking(false);
        setBookingStatus(null);
        Alert.alert('Error', data.message || 'Failed to book trip');
      }
    } catch (error) {
      console.error('❌ Error booking trip:', error);
      
      // Clear waiting state on error
      setIsBooking(false);
      setBookingStatus(null);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to book trip. Please try again.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('JSON Parse error')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const bookTrip1 = async () => {
    
    try {
      const selectedRideData = availableRides.find(r => r.id === selectedRide);
      if (!selectedRideData) {
        Alert.alert("Error", "Please select a ride");
        return;
      }
      let riderId = await AsyncStorage.getItem("riderId");

      if (!riderId) {
        riderId = Date.now().toString();
        await AsyncStorage.setItem("riderId", riderId);
      }
      const payload = {
        riderId, // replace with real user id
        
        pickup: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude
        },
        destination: {
          lat: destinationCoord.latitude,
          lng: destinationCoord.longitude
        },
        pickupAddress:
        pickupAddress,

destinationAddress:
destinationAddress,  
        seats: numberOfChairs || 1
      };
  
      console.log("🚀 Sending ride request:", payload);
  
      const response = await fetch(`${API_BASE}/api/rides/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      const data = await response.json();
  
      console.log("📡 Response:", data);
  
      if (data.success) {
        Alert.alert("Matched 🎉", "Ride found!");
  
        console.log("🚗 Assigned:", data.data);
  
        // navigate or store result
      } else {
        Alert.alert("⏳ Waiting", data.message);
      }
  
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("Error", "Failed to request ride");
    }
  };

  const renderWaitingState = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.waitingOverlay}>
        <View style={styles.waitingCard}>
          {/* Spinner Animation */}
          <ActivityIndicator size="large" color={Colors.primaryColor} style={styles.waitingSpinner} />
          
          {/* Title - Changes based on status */}
          <Text style={styles.waitingTitle}>
            {/* {bookingStatus === 'waiting' ? 'Finding your driver...' : 'Ride Requested!'} */}
            {bookingStatus === 'accepted' && (
  <Text style={{ color: "green", fontSize: 18 }}>
    Driver Assigned 🚗
  </Text>
)}
          </Text>
          
          {/* Waiting Message */}
          <Text style={styles.waitingMessage}>
            {bookingStatus === 'waiting' 
              ? 'Please wait while we connect you with a nearby driver'
              : 'Your ride has been requested. We\'ll notify you when a driver accepts.'}
          </Text>
          
          {/* Estimated Time - Only show for waiting status */}
          {bookingStatus === 'waiting' && (
            <View style={styles.waitingTimeContainer}>
              <MaterialIcons name="schedule" size={18} color={Colors.grayColor} />
              <Text style={styles.waitingTimeText}>
                Estimated wait time: 2-5 minutes
              </Text>
            </View>
          )}
          
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: bookingStatus === 'waiting' ? Colors.primaryColor : Colors.greenColor }]} />
            <Text style={styles.statusText}>
              {bookingStatus === 'waiting' ? 'Searching for drivers...' : 'Driver assignment pending'}
            </Text>
          </View>
          
          {/* Animated Dots - Only show for waiting status */}
          {bookingStatus === 'waiting' && (
            <View style={styles.searchAnimationContainer}>
              <AnimatedDot delay={0} />
              <AnimatedDot delay={300} />
              <AnimatedDot delay={600} />
            </View>
          )}
          
          {/* Cancel Button - Only show during waiting */}
          {bookingStatus === 'waiting' && (
            <TouchableOpacity 
              style={styles.cancelWaitingButton}
              onPress={handleCancelWaiting}
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

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedRide(item.id)}
        style={[
          styles.rideCard,
          selectedRide === item.id && styles.selectedRideCard
        ]}
      >
        {/* Left: Vehicle Icon and Info */}
        <View style={styles.rideLeft}>
          <View style={styles.vehicleIconContainer}>
            <MaterialIcons 
              name="directions-car" 
              size={40} 
              color={Colors.primaryColor} 
            />
          </View>
          <View style={styles.rideInfo}>
            <Text style={styles.rideName}>{item.name}</Text>
            <Text style={styles.rideType}>{item.type}</Text>
            <View style={styles.etaContainer}>
              <Ionicons name="time-outline" size={14} color={Colors.grayColor} />
              <Text style={styles.etaText}>{item.eta}</Text>
            </View>
            {item.discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {item.discountPercentage}% OFF
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Price and Seats */}
        <View style={styles.rideRight}>
          <View>
            <Text style={styles.amount}>{item.amount}</Text>
            {item.surgeFactor > 1 && (
              <Text style={styles.surgeText}>
                {item.surgeFactor}x surge
              </Text>
            )}
          </View>
          <View style={styles.seatsContainer}>
            {[1, 2, 3, 4].map((seat) => (
              <MaterialIcons
                key={seat}
                name="event-seat"
                color={seat > item.availableSheet ? Colors.lightGrayColor : Colors.primaryColor}
                size={16}
                style={styles.seatIcon}
              />
            ))}
            <Text style={styles.seatCount}>{item.availableSheet} seats</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentMethod = ({ item }) => (
    <View style={styles.paymentMethodItem}>
      <TouchableOpacity
        style={[
          styles.paymentMethodCard,
          selectedPaymentMethod?.id === item.id && styles.selectedPaymentMethod
        ]}
        onPress={() => {
          setSelectedPaymentMethod(item);
          setShowPaymentModal(false);
        }}
      >
        <View style={styles.paymentMethodLeft}>
          <MaterialIcons 
            name={item.icon} 
            size={24} 
            color={Colors.primaryColor} 
          />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>{item.name}</Text>
            {item.balance && (
              <Text style={styles.paymentMethodBalance}>{item.balance}</Text>
            )}
            {item.lastFour && (
              <Text style={styles.paymentMethodDetails}>•••• {item.lastFour}</Text>
            )}
          </View>
        </View>
        {selectedPaymentMethod?.id === item.id && (
          <MaterialIcons name="check-circle" size={24} color={Colors.primaryColor} />
        )}
      </TouchableOpacity>
      
      {/* Delete Button only for Credit/Debit Card */}
      {item.type === "card" && (
        <TouchableOpacity 
          style={styles.deletePaymentButton}
          onPress={() => console.log('Delete card:', item.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color={Colors.redColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  const isConfirmEnabled = selectedRide && selectedPaymentMethod;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primaryColor} />
        <Text style={styles.loadingText}>Finding available rides...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && availableRides.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={60} color={Colors.redColor} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAvailableRides}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.whiteColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Ride</Text>
        <TouchableOpacity 
          style={styles.paymentHeaderButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <MaterialIcons name="payment" size={24} color={Colors.whiteColor} />
        </TouchableOpacity>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
      {destinationCoord ? (
  <WebView 
    ref={webViewRef}
    source={{ html: generateMapHTML(
      currentLocation.latitude, 
      currentLocation.longitude,
      destinationCoord.latitude,
      destinationCoord.longitude
    )}}
    style={styles.webview}
    javaScriptEnabled={true}
    domStorageEnabled={true}
  />
) : (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" />
    <Text>Loading map...</Text>
  </View>
)}
        
        {/* Route Info Overlay */}
        <View style={styles.routeInfoCard}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.greenDot]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {pickupAddress}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.redDot]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {destinationAddress}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Rides List */}
      <View style={styles.ridesContainer}>
        <Text style={styles.sectionTitle}>
          Available Rides ({availableRides.length})
        </Text>
        
        {availableRides.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="local-taxi" size={60} color={Colors.grayColor} />
            <Text style={styles.emptyStateText}>
              No rides available at the moment
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try changing your filters or check back later
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableRides}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ridesList}
          />
        )}
        
        {/* Selected Payment Method Display */}
        <TouchableOpacity
          style={styles.paymentMethodDisplay}
          onPress={() => setShowPaymentModal(true)}
        >
          <View style={styles.paymentMethodDisplayLeft}>
            <MaterialIcons 
              name={selectedPaymentMethod?.icon || "payment"} 
              size={20} 
              color={selectedPaymentMethod ? Colors.primaryColor : Colors.grayColor} 
            />
            <Text style={[
              styles.paymentMethodDisplayText,
              !selectedPaymentMethod && styles.paymentMethodPlaceholder
            ]}>
              {selectedPaymentMethod ? selectedPaymentMethod.name : "Choose Payment Method"}
            </Text>
          </View>
          <MaterialIcons 
            name="keyboard-arrow-right" 
            size={20} 
            color={Colors.grayColor} 
          />
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity 
            style={[
              styles.confirmButton,
              !isConfirmEnabled && styles.disabledButton
            ]}
            disabled={!isConfirmEnabled}
            // onPress={bookTrip}
            onPress={bookTrip1}
          >
            <Text style={styles.confirmButtonText}>
              {isConfirmEnabled 
                ? `Book ${availableRides.find(r => r.id === selectedRide)?.name || 'Ride'}`
                : 'Select Ride & Payment'
              }
          </Text>
       </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>
            <TouchableOpacity 
              onPress={() => setShowPaymentModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.blackColor} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.id}
            renderItem={renderPaymentMethod}
            contentContainerStyle={styles.paymentMethodsList}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Add Payment Method Button - Uber/Bolt Style */}
          <View style={styles.addPaymentSection}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() =>
                navigation.push("creditCard/creditCardScreen")
              }
            >
              <MaterialIcons
                name="add"
                size={20}
                color={Colors.primaryColor}
              />
              <Text style={styles.addPaymentButtonText}>Add payment method</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Show waiting state if booking */}
      {isBooking && renderWaitingState()}
      
      {/* Show cancellation reason modal */}
      {showCancelModal && renderCancelReasonModal()}
    </SafeAreaView>
  );
};

// Define styles after the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.whiteColor,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Fonts.grayColor14Medium,
    marginTop: Sizes.fixPadding,
  },
  errorText: {
    ...Fonts.redColor14Medium,
    marginTop: Sizes.fixPadding,
    textAlign: 'center',
    paddingHorizontal: Sizes.fixPadding * 2,
  },
  retryButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding,
    marginTop: Sizes.fixPadding * 2,
  },
  retryButtonText: {
    ...Fonts.whiteColor14Bold,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding + 5,
    backgroundColor: Colors.primaryColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayColor,
  },
  backButton: {
    padding: Sizes.fixPadding - 5,
  },
  headerTitle: {
    ...Fonts.whiteColor18Bold,
    textAlign: "center",
  },
  paymentHeaderButton: {
    padding: Sizes.fixPadding - 5,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  routeInfoCard: {
    position: "absolute",
    top: Sizes.fixPadding * 2,
    left: Sizes.fixPadding * 2,
    right: Sizes.fixPadding * 2,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Sizes.fixPadding,
  },
  greenDot: {
    backgroundColor: Colors.greenColor,
  },
  redDot: {
    backgroundColor: Colors.redColor,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    ...Fonts.grayColor12Medium,
    marginBottom: 2,
  },
  routeAddress: {
    ...Fonts.blackColor14SemiBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrayColor,
    marginVertical: Sizes.fixPadding,
  },
  ridesContainer: {
    flex: 1,
    backgroundColor: Colors.bodyBackColor,
    borderTopLeftRadius: Sizes.fixPadding * 2,
    borderTopRightRadius: Sizes.fixPadding * 2,
    padding: Sizes.fixPadding * 2,
  },
  sectionTitle: {
    ...Fonts.blackColor16Bold,
    marginBottom: Sizes.fixPadding * 1.5,
  },
  ridesList: {
    paddingBottom: Sizes.fixPadding,
  },
  rideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.5,
    marginBottom: Sizes.fixPadding,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedRideCard: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.whiteColor,
  },
  rideLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  vehicleIconContainer: {
    width: 50,
    height: 50,
    marginRight: Sizes.fixPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    ...Fonts.blackColor16SemiBold,
    marginBottom: 2,
  },
  rideType: {
    ...Fonts.grayColor13Medium,
    marginBottom: 4,
  },
  etaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  etaText: {
    ...Fonts.grayColor12Medium,
    marginLeft: 4,
  },
  discountBadge: {
    backgroundColor: Colors.greenColor + '20',
    paddingHorizontal: Sizes.fixPadding - 2,
    paddingVertical: 2,
    borderRadius: Sizes.fixPadding - 5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    ...Fonts.greenColor12Bold,
    fontSize: 10,
  },
  rideRight: {
    alignItems: "flex-end",
  },
  amount: {
    ...Fonts.blackColor18Bold,
    marginBottom: Sizes.fixPadding - 5,
  },
  surgeText: {
    ...Fonts.redColor10Medium,
    marginTop: -4,
    marginBottom: 4,
  },
  seatsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatIcon: {
    marginHorizontal: 1,
  },
  seatCount: {
    ...Fonts.grayColor10Medium,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Sizes.fixPadding * 4,
  },
  emptyStateText: {
    ...Fonts.blackColor16SemiBold,
    marginTop: Sizes.fixPadding,
  },
  emptyStateSubtext: {
    ...Fonts.grayColor12Medium,
    marginTop: Sizes.fixPadding - 5,
    textAlign: 'center',
  },
  paymentMethodDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.5,
    marginTop: Sizes.fixPadding,
    borderWidth: 1,
    borderColor: Colors.lightGrayColor,
  },
  paymentMethodDisplayLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodDisplayText: {
    ...Fonts.blackColor14SemiBold,
    marginLeft: Sizes.fixPadding,
  },
  paymentMethodPlaceholder: {
    ...Fonts.grayColor14Medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.whiteColor,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding + 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayColor,
  },
  modalTitle: {
    ...Fonts.blackColor18Bold,
  },
  closeButton: {
    padding: Sizes.fixPadding - 5,
  },
  paymentMethodsList: {
    padding: Sizes.fixPadding * 2,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Sizes.fixPadding,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding * 1.5,
    borderWidth: 1,
    borderColor: Colors.lightGrayColor,
    flex: 1,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.primaryColor + '10',
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: Sizes.fixPadding,
    flex: 1,
  },
  paymentMethodName: {
    ...Fonts.blackColor16SemiBold,
  },
  paymentMethodBalance: {
    ...Fonts.primaryColor14Medium,
    marginTop: 2,
  },
  paymentMethodDetails: {
    ...Fonts.grayColor12Medium,
    marginTop: 2,
  },
  deletePaymentButton: {
    padding: Sizes.fixPadding,
    marginLeft: Sizes.fixPadding,
  },
  addPaymentSection: {
    paddingHorizontal: Sizes.fixPadding * 2,
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding + 5,
    borderWidth: 1,
    borderColor: Colors.lightGrayColor,
    marginBottom: Sizes.fixPadding * 2,
  },
  addPaymentButtonText: {
    ...Fonts.primaryColor16SemiBold,
    marginLeft: Sizes.fixPadding,
  },
  confirmButton: {
    backgroundColor: Colors.secondaryColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding + 5,
    alignItems: "center",
    marginTop: Sizes.fixPadding,
  },
  disabledButton: {
    backgroundColor: Colors.lightGrayColor,
  },
  confirmButtonText: {
    ...Fonts.whiteColor16Bold,
  },
  // Waiting State Styles
  waitingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizes.fixPadding * 2,
  },
  waitingCard: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 2,
    padding: Sizes.fixPadding * 3,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  waitingSpinner: {
    marginBottom: Sizes.fixPadding * 2,
  },
  waitingTitle: {
    ...Fonts.blackColor20Bold,
    marginBottom: Sizes.fixPadding,
    textAlign: 'center',
  },
  waitingMessage: {
    ...Fonts.grayColor14Medium,
    textAlign: 'center',
    marginBottom: Sizes.fixPadding * 1.5,
    lineHeight: 20,
  },
  waitingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrayColor + '30',
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding - 2,
    borderRadius: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2,
  },
  waitingTimeText: {
    ...Fonts.grayColor12Medium,
    marginLeft: Sizes.fixPadding - 5,
  },
  searchAnimationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Sizes.fixPadding * 2,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryColor,
    marginHorizontal: 4,
  },
  cancelWaitingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.redColor,
    borderRadius: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding,
    paddingHorizontal: Sizes.fixPadding * 2,
    marginTop: Sizes.fixPadding,
  },
  cancelWaitingText: {
    ...Fonts.redColor14Bold,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrayColor + '20',
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding - 2,
    borderRadius: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Sizes.fixPadding - 5,
  },
  statusText: {
    ...Fonts.grayColor12Medium,
  },
  // Cancel Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cancelModalContainer: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 2,
    borderTopRightRadius: Sizes.fixPadding * 2,
    padding: Sizes.fixPadding * 2,
    maxHeight: '80%',
  },
  cancelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.fixPadding,
  },
  cancelModalTitle: {
    ...Fonts.blackColor20Bold,
  },
  cancelModalSubtitle: {
    ...Fonts.grayColor14Medium,
    marginBottom: Sizes.fixPadding * 2,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Sizes.fixPadding,
    paddingHorizontal: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding - 5,
  },
  selectedReasonItem: {
    backgroundColor: Colors.primaryColor + '10',
  },
  reasonText: {
    ...Fonts.blackColor16Medium,
    marginLeft: Sizes.fixPadding,
    flex: 1,
  },
  selectedReasonText: {
    ...Fonts.primaryColor16Medium,
  },
  customReasonContainer: {
    marginTop: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: Colors.lightGrayColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    ...Fonts.blackColor14Medium,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Sizes.fixPadding * 2,
    gap: Sizes.fixPadding,
  },
  cancelModalKeepButton: {
    flex: 1,
    paddingVertical: Sizes.fixPadding + 2,
    borderRadius: Sizes.fixPadding,
    borderWidth: 1,
    borderColor: Colors.primaryColor,
    alignItems: 'center',
  },
  cancelModalKeepText: {
    ...Fonts.primaryColor16Bold,
  },
  cancelModalConfirmButton: {
    flex: 1,
    paddingVertical: Sizes.fixPadding + 2,
    borderRadius: Sizes.fixPadding,
    backgroundColor: Colors.redColor,
    alignItems: 'center',
  },
  cancelModalConfirmText: {
    ...Fonts.whiteColor16Bold,
  },
  disabledCancelButton: {
    backgroundColor: Colors.lightGrayColor,
    opacity: 0.7,
  },
});

export default AvailableRidesScreen;