

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, Linking, Image,ScrollView, Modal,Share, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import { Key } from '../../constants/key';
import { GOOGLE_MAP_ID, getNavCamera, ROUTE_LINE_COLOR, ROUTE_GLOW_COLOR, ROUTE_HIGHLIGHT_COLOR } from '../../constants/mapTheme';
import { WS_TRACKING_URL } from '../../constants/apiConfig';
import AnimatedDriverMarker from './components/AnimatedDriverMarker';
import { useSOSEmergency } from '../../hooks/useSOSEmergency';
import { Colors } from '../../constants/styles';



const GOOGLE_MAPS_APIKEY = Key.apiKey;
const WS_BASE = WS_TRACKING_URL;

export default function ActiverideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    rideId,
    role,
    phase,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
  } = params;

  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const locationSubRef = useRef(null);
  const [otpArray, setOtpArray] = useState({ 0: '', 1: '', 2: '', 3: '' });
  const otpRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef()]);
  const [userId, setUserId] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [pinErrors, setPinErrors] = useState({});
  const otpCellRefs = useRef({});
  const shakeAnims = useRef({});
  const [messages, setMessages] = useState([]);
  const [rideDetails, setRideDetails] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [completedFare, setCompletedFare] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  // NEW STATES FOR UI
  const [hasUnread, setHasUnread] = useState(false);
  const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
  const [sosVisible, setSOSVisible] = useState(false);
  const sos = useSOSEmergency();

  const [driverHeading, setDriverHeading] = useState(0);
const hasNavigatedRef = useRef(false);
const [etaMinutes, setEtaMinutes] = useState(null);
const driverMarkerRef = useRef(null);
const [routeKey, setRouteKey] = useState(0);
const lastRouteRefresh = useRef(0);
const initialFitDone = useRef(false);
const routeOriginRef = useRef(null);
const routeFitDone = useRef(false);
const [driverUnread, setDriverUnread] = useState({});
const [routeOrigin,setRouteOrigin] =useState(null);
const [poolRequestVisible,
  setPoolRequestVisible]
  = useState(false);

const [poolRequest,
  setPoolRequest]
  = useState(null);

  useEffect(() => {

    console.log(
      "POOL MODAL CHANGED:",
      poolRequestVisible
    );
  
  }, [poolRequestVisible]);
  


  useEffect(() => {
    initializeScreen();
    return () => {
      wsRef.current?.close();
      locationSubRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    loadUnreadStatus();
  }, []);


  useEffect(() => {
    if (!routeOrigin && driverLocation) {
      setRouteOrigin(driverLocation);
    }
  }, [driverLocation]);

  const loadDriverUnreadStatus = async () => {
    const keys = await AsyncStorage.getAllKeys();
  
    const unreadKeys = keys.filter(
      key => key.startsWith(
        `chat_unread_${rideId}_`
      )
    );
  
    const unreadMap = {};
  
    unreadKeys.forEach(key => {
      const userId = key.split("_").pop();
      unreadMap[userId] = true;
    });
  
    setDriverUnread(unreadMap);
  };

  

  const shareTrip = async () => {

    const response =
      await api.post(
        `/rides/trips/${rideId}/share/`
      );
   
    const url =
      response.data.share_url;
   
    await Share.share({
      message:
        `Track my trip live:\n${url}`
    });
   };
   
  const loadUnreadStatus = async () => {
    const unread =
      await AsyncStorage.getItem(
        `chat_unread_${rideId}`
      );
  
    setHasUnread(unread === "true");
  };

  useEffect(() => {

    connectWebSocket();
  
    return () => {
      wsRef.current?.close();
    };
  
  }, [rideId]);

  const initializeScreen = async () => {
    await loadDriverUnreadStatus();
    const id = await AsyncStorage.getItem('userId');
    setUserId(id);
    
    await fetchRideDetails();
    // await loadChatHistory();
    // connectWebSocket(id);
    

    if (role === 'driver') {
      startDriverLocationBroadcast();
    }
  };


  // Copy this block directly into your side effects layout section


  const fetchRideDetails = async () => {
    try {
      const res = await api.get(`/rides/trips/${rideId}/`);
      setRideData(res.data);
      console.log(
        "FULL RIDE DATA",
        JSON.stringify(res.data, null, 2)
      );
      // my_pickup_code resolves to *this* viewer's own code server-side -
      // res.data.verification_code is always the organizer's code, which
      // is wrong for a pool-joiner reading their own ride (the
      // participants list also never exposed pickup_code, so the old
      // fallback below never actually worked for them either).
      setVerificationCode(res.data.my_pickup_code);
      

      if (res.data?.driver_location?.latitude && res.data?.driver_location?.longitude) {
        setDriverLocation({
          latitude: parseFloat(res.data.driver_location.latitude),
          longitude: parseFloat(res.data.driver_location.longitude)
        });
      }


      const locLat =
  res.data?.driver_location?.latitude ||
  res.data?.pickup_location?.latitude;

const locLng =
  res.data?.driver_location?.longitude ||
  res.data?.pickup_location?.longitude;
      fetchSmartWaypoints(locLat, locLng);
    } catch (e) {
      console.error("Error fetching ride:", e);
    }
  };

  
//   const loadChatHistory = async () => {
//     try {
//         const res = await api.get(`/rides/trips/${rideId}/chat/`); // Assuming you expose this endpoint
//         setChatHistory(res.data);
//         // If the newest message isn't from me, trigger the unread dot
//         if (res.data.length > 0 && res.data[res.data.length - 1].sender !== userId) {
//             setHasUnread(true);
//         }
//     } catch(e) { console.log("Chat history missing", e); }
// };


  // const fetchSmartWaypoints = async (lat, lng) => {
  //   try {
  //     const res = await api.get(`/rides/trips/${rideId}/smart_waypoints/?lat=${lat}&lng=${lng}`);
  //     setWaypoints(res.data.optimized_route);
  //   } catch (e) {
  //     console.error("Error fetching waypoints:", e);
  //   }
  // };

  const connectWebSocket = async () => {
    if (
      wsRef.current &&
      (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      )
    ) {
      console.log("SOCKET ALREADY EXISTS");
      return;
    }
  
    const uid = await AsyncStorage.getItem("userId");
  
    if (!uid) return;
  
    wsRef.current = new WebSocket(
      `${WS_BASE}?user_id=${uid}`
    );

    wsRef.current = new WebSocket(`${WS_BASE}?user_id=${uid}`);
    wsRef.current.onopen = () => {
      console.log(
        "SENDING JOIN_RIDE",
        rideId
      );
      wsRef.current.send(JSON.stringify({ type: 'join_ride', ride_id: rideId }));
    };

    wsRef.current.onmessage = (event) => {
      console.log(
        "FULL SOCKET MESSAGE:",
        event.data
      );
      try {
        
        const parsedMessage = JSON.parse(event.data);
        console.log(
          "RIDE SCREEN WS:",
          parsedMessage
        );
        console.log(
          "RAW WS MESSAGE:",
          event.data
        );
      
      
        console.log(
          "MESSAGE TYPE:",
          parsedMessage.type
        );

        if (!parsedMessage || !parsedMessage.type) return;
        const data = parsedMessage.data || {};
    
        switch (parsedMessage.type) {
          case 'driver_location':

            console.log(
              "RAW DRIVER LOCATION:",
              parsedMessage
            );
            console.log(
              "LOCATION RECEIVED:",
              new Date().toISOString(),
              parsedMessage.latitude,
              parsedMessage.longitude
            );
            const now = Date.now();

            // driverMarkerRef.current?.animateMarkerToCoordinate(
            //   {
            //     latitude: Number(
            //       parsedMessage.latitude
            //     ),
            //     longitude: Number(
            //       parsedMessage.longitude
            //     ),
            //   },
            //   1000
            // );

            setDriverLocation({
              latitude: Number(parsedMessage.latitude),
              longitude: Number(parsedMessage.longitude),
              heading: Number(parsedMessage.heading) || 0,
            });

            if (parsedMessage.eta_minutes !== undefined) {
              setEtaMinutes(parsedMessage.eta_minutes);
            }
            

            console.log(
              "Driver Location Updated:",
              parsedMessage.latitude,
              parsedMessage.longitude
            );

            break;
          
          case "pool_join_request":

            console.log(
              "POOL REQUEST FRONTEND RECEIVED"
            );

            console.log(
              JSON.stringify(
                parsedMessage,
                null,
                2
              )
            );
          
            setPoolRequest(parsedMessage);

            setPoolRequestVisible(true);

            break;

          case "route_updated":
            // Pushed by the backend whenever the participant set changes
            // (match/accept/decline/pickup/dropoff) - updates the route
            // immediately instead of waiting for the next location-driven
            // poll or an explicit fetchRideDetails() call.
            setWaypoints(parsedMessage.optimized_route);
            break;

          case 'ride_status':
            console.log(
              "===== RIDE STATUS CASE HIT ====="
            );
            if (
              data.event ===
              "pool_request_pending"
            ) {
          
              console.log(
                "SHOWING POOL MODAL"
              );
          
              setPoolRequest(data);
          
              setPoolRequestVisible(true);
          
              return;
            }
          
            console.log(
              JSON.stringify(parsedMessage, null, 2)
            );
            if (data.eta_minutes) {
              setEtaMinutes(data.eta_minutes);
            }

            setRideDetails(data);
            // Not reading data.verification_code here - this websocket
            // broadcast goes to the whole ride group, so it's always the
            // organizer's code, wrong for a pool-joiner. verificationCode
            // is already set correctly (per-viewer) via fetchRideDetails's
            // my_pickup_code on mount.

            // FIXED DROP-OFF CHECK (Navigates Rider Properly)
            if (data.event === 'individual_dropped_off' && String(data.user_id) === String(uid)) {
              wsRef.current?.close();
              setCompletedFare(data.final_fare); 
              return; 
            }
            
            console.log(
              "RIDE STATUS RECEIVED:",
              parsedMessage
            );
            
            console.log(
              "parsedMessage.status =",
              parsedMessage.status
            );
            
            console.log(
              "data.status =",
              data.status
            );

            const verifiedUserId =
  data?.verified_user_id;

if (
  data.status === "in_progress" &&
  verifiedUserId === uid
) {

  router.replace({
    pathname:
      "/rideTracking/riderInTripScreen",
    params: {
      rideId: data.ride_id,
      role: "rider"
    }
  });

}

            if (data.status === 'completed' || parsedMessage.status === 'completed') {
              wsRef.current?.close();
              setCompletedFare(data.final_fare || rideData?.estimated_fare);
            }
            
            if (data.event === 'passenger_joined_pool') {
              fetchRideDetails();
            }
            break;
    
          case "chat_received":

            const chatMsg = {
              id: Date.now().toString(),
              sender: parsedMessage.role,
              text: parsedMessage.message,
              time: new Date(
                parsedMessage.timestamp
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          
            const storageKey =
              `@chat_history_${rideId}`;
          
            AsyncStorage.getItem(storageKey)
              .then((stored) => {
                const existing =
                  stored
                    ? JSON.parse(stored)
                    : [];
          
                const updated = [
                  ...existing,
                  chatMsg,
                ];
          
                AsyncStorage.setItem(
                  storageKey,
                  JSON.stringify(updated)
                );
              });
          
              setHasUnread(true);

              const senderId =
                parsedMessage.sender_id;
              
              setDriverUnread(prev => ({
                ...prev,
                [senderId]: true
              }));
          
              AsyncStorage.setItem(
                `chat_unread_${rideId}_${senderId}`,
                "true"
              );
          
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

    const currentLocation =
  await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

setDriverLocation({
  latitude: currentLocation.coords.latitude,
  longitude: currentLocation.coords.longitude,
});

// if (
//   wsRef.current &&
//   wsRef.current.readyState === WebSocket.OPEN
// ) {
//   wsRef.current.send(
//     JSON.stringify({
//       type: "driver_location_update",
//       ride_id: rideId,
//       latitude: currentLocation.coords.latitude,
//       longitude: currentLocation.coords.longitude,
//       heading: currentLocation.coords.heading || 0,
//       speed: currentLocation.coords.speed || 0,
//     })
//   );
// }


    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000,distanceInterval: 1, },
      (location) => {
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log(
            "Sending Driver Location:",
            location.coords.latitude,
            location.coords.longitude
          );

          wsRef.current.send(JSON.stringify({
            type: "driver_location_update", ride_id: rideId,
            latitude: location.coords.latitude, longitude: location.coords.longitude,
            heading: location.coords.heading || 0, speed: location.coords.speed || 0,
          }));
        }
      }
    );
  };

  // One shared Animated.Value per rider (keyed by id) so each passenger-queue
  // card's PIN cells can shake independently without re-mounting the row.
  const getShakeAnim = (id) => {
    if (!shakeAnims.current[id]) shakeAnims.current[id] = new Animated.Value(0);
    return shakeAnims.current[id];
  };

  const triggerShake = (id) => {
    const anim = getShakeAnim(id);
    Animated.sequence([
      Animated.timing(anim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const initialsOf = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const renderPinCells = (value = '') => {
    return [0, 1, 2, 3].map((i) => {
      const ch = value[i] || '';
      const filled = !!ch;
      return (
        <View key={i} style={[styles.pinCell, filled && styles.pinCellFilled]}>
          <Text style={styles.pinDigitText}>{ch}</Text>
        </View>
      );
    });
  };

  const verifyRiderOtp = async (participantId, isPrimary) => {
    try {



      const code = otpInputs[participantId];
      if (!code) return Alert.alert("Notice", "Please enter the PIN.");
      console.log("CODE ENTERED:", code);
      console.log("RIDE ID:", rideId);
      const response=await api.post(`/rides/verify-code/`, { ride_id: rideId, code: code });
      console.log(response.data);
      setPinErrors((prev) => ({ ...prev, [participantId]: false }));
      Alert.alert("Success", "Code Verified! Rider is now onboard.");
      fetchRideDetails();

    } catch (e) {

      console.error("Verification function crashed with error:", e);
      setPinErrors((prev) => ({ ...prev, [participantId]: true }));
      triggerShake(participantId);
      Alert.alert("Error", "Invalid PIN provided.");
    }
  };

  const dropOffRider = async (targetUserId) => {
    const code = otpInputs[targetUserId];
    if (!code) return Alert.alert("Notice", "Please enter the rider's drop-off PIN.");
    try {
      const res = await api.post(`/rides/trips/${rideId}/dropoff_user/`, { user_id: targetUserId, code });
      setPinErrors((prev) => ({ ...prev, [targetUserId]: false }));
      Alert.alert("Dropped Off", `Fare to collect: R${res.data.fare}`);

      if (res.data.status === 'ride_fully_completed') {
        router.replace('/(driverTabs)/home/homeScreen');
      } else {
        fetchRideDetails();
      }
    } catch (e) {
      setPinErrors((prev) => ({ ...prev, [targetUserId]: true }));
      triggerShake(targetUserId);
      if (e.response?.status === 400) {
        Alert.alert("Error", e.response?.data?.error || "Invalid drop-off PIN.");
      } else {
        Alert.alert("Error", "Could not complete drop off.");
      }
    }
  };

  // Navigates once state updates securely
  useEffect(() => {
    if (completedFare !== null) {
      setTimeout(() => {
        router.replace({
          pathname: '/fareSummary/fareSummaryScreen',
          params: { fare: completedFare, rideId, role }
        });
      }, 100);
    }
  }, [completedFare]);

  // Actions for Rider UI
  const openChat = async () => {

  setHasUnread(false);

  await AsyncStorage.removeItem(
    `chat_unread_${rideId}`
  );

  router.push({
    pathname: "/Chat/chatScreen",
    params: {
      trip_id: rideId,
      role: role,
      target_user_id: rideData?.driver?.id
    }
  });
};

  const callDriver = () => {
    if (rideData?.driver?.phone_number) {
      Linking.openURL(`tel:${rideData.driver.phone_number}`);
    } else {
      Alert.alert("Notice", "Driver phone number unavailable.");
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


useEffect(() => {
  if (
    initialFitDone.current ||
    !driverLocation ||
    !pickupLat ||
    !pickupLng ||
    !mapRef.current
  ) {
    return;
  }

  initialFitDone.current = true;

  mapRef.current.fitToCoordinates(
    [
      {
        latitude: Number(
          driverLocation.latitude
        ),
        longitude: Number(
          driverLocation.longitude
        ),
      },
      {
        latitude: Number(pickupLat),
        longitude: Number(pickupLng),
      },
    ],
    {
      edgePadding: {
        top: 150,
        right: 80,
        bottom: 350,
        left: 80,
      },
      animated: true,
    }
  );
}, [driverLocation]);


const handleOtpChange = (value, index, participantId) => {
  const newOtpArray = { ...otpArray, [index]: value };
  setOtpArray(newOtpArray);
  
  // Auto-advance focus
  if (value && index < 3) {
      otpRefs.current[index + 1].current.focus();
  }
  
  // If all 4 filled, combine and set to main state
  const fullCode = `${newOtpArray[0]}${newOtpArray[1]}${newOtpArray[2]}${newOtpArray[3]}`;
  if (fullCode.length === 4) {
      setOtpInputs({...otpInputs, [participantId]: fullCode});
  }
};



  const getFilteredWaypointsForRider = () => {
    if (role === 'driver') return waypoints;
    const myDropoffIndex = waypoints.findIndex(w => String(w.user_id) === String(userId) && w.action === 'dropoff');
    if (myDropoffIndex === -1) return waypoints;
    return waypoints.slice(0, myDropoffIndex + 1);
  };

  // const renderMap = () => {
  //   if (!rideData || !waypoints.length) return null;
  //   const displayWaypoints = getFilteredWaypointsForRider();
  //   const destination = displayWaypoints[displayWaypoints.length - 1];
  //   const viaPoints = displayWaypoints.slice(0, -1).map(wp => ({ latitude: wp.latitude, longitude: wp.longitude }));

  //   return (
  //     <MapView 
  //       ref={mapRef} 
  //       style={styles.webview}
  //       customMapStyle={customMapTheme}
  //       initialRegion={{
  //         latitude: driverLocation?.latitude || displayWaypoints[0]?.latitude,
  //         longitude: driverLocation?.longitude || displayWaypoints[0]?.longitude,
  //         latitudeDelta: 0.02,
  //         longitudeDelta: 0.02,
  //       }}
  //     >
  //       {driverLocation && <Marker coordinate={driverLocation} title="Driver" pinColor="#000" />}
  //       {displayWaypoints.map((wp, index) => (
  //         <Marker 
  //           key={index} 
  //           coordinate={{ latitude: wp.latitude, longitude: wp.longitude }} 
  //           title={wp.action === 'pickup' ? `Pickup` : `Dropoff`}
  //           pinColor={wp.action === 'pickup' ? "#28a745" : "#dc3545"}
  //         />
  //       ))}
  //       {driverLocation && destination && (
  //         <MapViewDirections
  //           origin={driverLocation}
  //           waypoints={viaPoints}
  //           destination={{ latitude: destination.latitude, longitude: destination.longitude }}
  //           apikey={GOOGLE_MAPS_APIKEY}
  //           strokeWidth={5}
  //           strokeColor="#ff8811"
  //           optimizeWaypoints={false}
  //         />
  //       )}
  //     </MapView>
  //   );
  // };



  const acceptPoolRequest =
async () => {

  await api.post(
    "/rides/pool-request/accept/",
    {
      participant_id:
        poolRequest.participant_id
    }
  );

  setPoolRequestVisible(false);

  fetchRideDetails();
};

const declinePoolRequest =
async () => {

  await api.post(
    "/rides/pool-request/decline/",
    {
      participant_id:
        poolRequest.participant_id
    }
  );

  setPoolRequestVisible(false);
};


  // Single source of truth for "which number is this rider" - used by both
  // the map markers (renderMap, below) and the passenger-queue list
  // further down, so a rider's pickup pin, dropoff pin, and queue card all
  // show the same number. Primary rider is always 1; pool participants are
  // numbered in the same order compute_optimized_route (backend) and
  // allRiders (below) already iterate rideData.participants in.
  const getRiderNumber = (userId) => {
    if (!rideData) return null;
    if (String(rideData.rider?.id) === String(userId)) return 1;
    const acceptedParticipants = (rideData.participants || []).filter(
      (p) => p.status === 'accepted' || p.status === 'picked_up'
    );
    const index = acceptedParticipants.findIndex((p) => String(p.user.id) === String(userId));
    return index === -1 ? null : index + 2;
  };

  // ========================================================
  // MAP RENDERING LAYER (MODIFIED FOR EXACT RIDER ROUTING)
  // ========================================================
  const renderMap = () => {
    if (!rideData) return null;
    // 1. FORCE RIDER COORDINATES TO NUMBERS
    const safePickupLat = pickupLat ? parseFloat(pickupLat) : null;
    const safePickupLng = pickupLng ? parseFloat(pickupLng) : null;
    const hasValidPickup = safePickupLat && safePickupLng;

    // 2. FORCE DRIVER COORDINATES TO NUMBERS
    const safeDriverLat = driverLocation?.latitude ? parseFloat(driverLocation.latitude) : null;
    const safeDriverLng = driverLocation?.longitude ? parseFloat(driverLocation.longitude) : null;
    const hasValidDriver = safeDriverLat && safeDriverLng;

    if (
      !routeOriginRef.current &&
      hasValidDriver
    ) {
      routeOriginRef.current = {
        latitude: safeDriverLat,
        longitude: safeDriverLng,
      };
    }
    // 3. GET WAYPOINTS (For Driver)
    let displayWaypoints = [];
    if (role === "rider") {
      displayWaypoints = typeof getFilteredWaypointsForRider === "function" 
        ? getFilteredWaypointsForRider() 
        : (waypoints || []);
    } else {
      displayWaypoints = waypoints || [];
    }

    const destination = displayWaypoints.length > 0 ? displayWaypoints[displayWaypoints.length - 1] : null;
    const viaPoints = displayWaypoints.slice(0, -1).map(wp => ({ 
        latitude: parseFloat(wp.latitude), 
        longitude: parseFloat(wp.longitude) 
    }));

    // 4. SET INITIAL CAMERA FOCUS
    const initialLat = safeDriverLat || safePickupLat || 12.9550;
    const initialLng = safeDriverLng || safePickupLng || 77.7129;

    return (
      <MapView
        ref={mapRef}
        style={styles.webview}
        mapId={GOOGLE_MAP_ID}
        initialCamera={getNavCamera({ latitude: initialLat, longitude: initialLng })}
      >
        {/* =========================================
            A. DRIVER CAR MARKER (Visible to Both)
        ========================================= */}
        {hasValidDriver && (
          <AnimatedDriverMarker
            coordinate={{
              latitude: Number(driverLocation.latitude),
              longitude: Number(driverLocation.longitude),
            }}
            heading={driverLocation.heading || 0}
          />
        )}

        {/* =========================================
            B. RIDER PICKUP PIN (Visible to Rider)
        ========================================= */}
        {role === "rider" && hasValidPickup && (
          <Marker
          // ref={driverMarkerRef}
          coordinate={{
            latitude: safePickupLat,
            longitude: safePickupLng
          }}
            
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.simpleMarker}>
              <Ionicons name="person" size={18} color="white" />
            </View>
          </Marker>
        )}

        {/* =========================================
            C. DRIVER WAYPOINTS (Visible to Driver)
        ========================================= */}
        {role === "driver" && displayWaypoints.map((wp, index) => {
          const isPickup = wp.action === 'pickup';
          const lat = parseFloat(wp.latitude);
          const lng = parseFloat(wp.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          // Numbered per rider (not per stop) so a rider's pickup AND
          // dropoff pin share one number - matches the same number shown
          // on their passenger-queue card below.
          const riderNumber = getRiderNumber(wp.user_id);

          return (
            <Marker
            // ref={driverMarkerRef}
              key={`wp-${index}`}
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 0.9 }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  backgroundColor: Colors.primaryColor, paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
                  shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
                  elevation: 5, marginBottom: 4, maxWidth: 140
                }}>
                  <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                    {`Rider ${riderNumber ?? ''} ${isPickup ? 'Pickup' : 'Dropoff'}`}
                  </Text>
                </View>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: isPickup ? Colors.successGreen : Colors.secondaryColor,
                  borderWidth: 3, borderColor: '#FFFFFF',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 6
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>{riderNumber ?? '?'}</Text>
                </View>
                <View style={{
                  width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
                  borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6,
                  borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF',
                  marginTop: -1
                }} />
              </View>
            </Marker>
          );
        })}

        {/* =========================================
            D. ROUTE / DIRECTIONS
        ========================================= */}
        {role === "rider" ? (
          /* RIDER ROUTE: Draw line from Driver to Rider Pickup */
          hasValidDriver && hasValidPickup && (
            <MapViewDirections
              key={routeKey}
              // origin={{ latitude: safeDriverLat, longitude: safeDriverLng }}
              origin={routeOrigin}
              destination={{ latitude: safePickupLat, longitude: safePickupLng }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={13}
              strokeColor={`${ROUTE_GLOW_COLOR}38`}
              onReady={(result) => {
                setRouteCoords(result.coordinates);

                if (routeFitDone.current)
                  return;

                routeFitDone.current = true;

                mapRef.current?.fitToCoordinates(
                  result.coordinates,
                  {
                    edgePadding: {
                      top: 120,
                      right: 80,
                      bottom: 350,
                      left: 80,
                    },
                    animated: true,
                  }
                );
              }}
              onError={(error) => console.log("Rider Route Error:", error)}
            />
          )
        ) : (
          /* DRIVER ROUTE: Draw line through all waypoints */
          hasValidDriver && destination && (
            <MapViewDirections
              // origin={{ latitude: safeDriverLat, longitude: safeDriverLng }}
              origin={routeOrigin}
              waypoints={viaPoints}
              destination={{ latitude: parseFloat(destination.latitude), longitude: parseFloat(destination.longitude) }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={11}
              strokeColor={`${ROUTE_GLOW_COLOR}38`}
              optimizeWaypoints={false}
              onReady={(result) => {
                setRouteCoords(result.coordinates);

                if (routeFitDone.current)
                  return;

                routeFitDone.current = true;

                mapRef.current?.fitToCoordinates(
                  result.coordinates,
                  {
                    edgePadding: {
                      top: 120,
                      right: 80,
                      bottom: 350,
                      left: 80,
                    },
                    animated: true,
                  }
                );
              }}
              onError={(error) => console.log("Driver Route Error:", error)}
            />
          )
        )}
        {routeCoords.length > 0 && (
          <>
            <Polyline coordinates={routeCoords} strokeColor={ROUTE_LINE_COLOR} strokeWidth={6} />
            <Polyline coordinates={routeCoords} strokeColor={ROUTE_HIGHLIGHT_COLOR} strokeWidth={2} />
          </>
        )}
      </MapView>
    );
  };


  console.log("ETA MINUTES:", etaMinutes);


  

  console.log("Role:", role);
console.log("Pickup:", pickupLat, pickupLng);
console.log("Driver:", driverLocation);


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
        // The primary rider's OWN pickup state, not the ride-wide trip
        // status - rideData.status flips to 'in_progress' as soon as ANY
        // pool passenger is picked up, which would show the primary rider
        // as picked up too even if they were never actually verified.
        status: rideData.rider_pickup_status || 'accepted',
        isPrimary: true,
        pickup: rideData.pickup_address,
        dropoff: rideData.dropoff_address
      });
    }
    
    console.log(
      "PARTICIPANTS",
      JSON.stringify(
        rideData.participants,
        null,
        2
      )
    );  
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
        {/* <Modal
  visible={poolRequestVisible}
  transparent
>
  <View
    style={{
      flex:1,
      backgroundColor:
      "rgba(0,0,0,0.5)",
      justifyContent:"center"
    }}
  >

    <View
      style={{
        backgroundColor:"#fff",
        margin:20,
        padding:20
      }}
    >

<Text>
  Rider:
  {poolRequest?.rider_name}
</Text>

<Text>
  Pickup:
  {poolRequest?.pickup_address}
</Text>

<Text>
  Drop:
  {poolRequest?.dropoff_address}
</Text>

<Text>
  Seats:
  {poolRequest?.seats}
</Text>

<TouchableOpacity
  onPress={acceptPoolRequest}
>
  <Text>Accept</Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={declinePoolRequest}
>
  <Text>Decline</Text>
</TouchableOpacity>

    </View>

  </View>
</Modal> */}


<Modal
  visible={poolRequestVisible}
  transparent
  animationType="slide"
>
  <View style={styles.modalOverlay}>

    <View style={styles.premiumCard}>

      <View style={styles.headerIndicator} />

      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.newRequestText}>
            POOL RIDE REQUEST
          </Text>

          <Text style={styles.distanceSubtext}>
            Additional passenger wants to join
          </Text>
        </View>

        <View style={styles.fareContainer}>
          <Ionicons
            name="people"
            size={22}
            color="#10B981"
          />
        </View>
      </View>

      <View style={styles.routeContainer}>

        <View style={styles.routeTimeline}>
          <View
            style={[
              styles.timelineDot,
              { backgroundColor: "#22C55E" }
            ]}
          />

          <View style={styles.verticalDivider} />

          <View
            style={[
              styles.timelineDot,
              { backgroundColor: "#EF4444" }
            ]}
          />
        </View>

        <View style={styles.addressWrapper}>

          <View style={styles.addressNode}>
            <Text style={styles.addressLabel}>
              RIDER
            </Text>

            <Text style={styles.addressValue}>
              {poolRequest?.rider_name}
            </Text>
          </View>

          <View
            style={[
              styles.addressNode,
              { marginTop: 16 }
            ]}
          >
            <Text style={styles.addressLabel}>
              PICKUP LOCATION
            </Text>

            <Text style={styles.addressValue}>
              {poolRequest?.pickup_address ||
                "Pickup unavailable"}
            </Text>
          </View>

          <View
            style={[
              styles.addressNode,
              { marginTop: 16 }
            ]}
          >
            <Text style={styles.addressLabel}>
              DROPOFF LOCATION
            </Text>

            <Text style={styles.addressValue}>
              {poolRequest?.dropoff_address ||
                "Dropoff unavailable"}
            </Text>
          </View>

          <View
            style={[
              styles.addressNode,
              { marginTop: 16 }
            ]}
          >
            <Text style={styles.addressLabel}>
              SEATS
            </Text>

            <Text style={styles.addressValue}>
              {poolRequest?.seats}
            </Text>
          </View>

        </View>

      </View>

      <View style={styles.actionButtonGroup}>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={declinePoolRequest}
        >
          <Text style={styles.declineButtonText}>
            Decline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={acceptPoolRequest}
        >
          <Text style={styles.acceptButtonText}>
            Accept Rider
          </Text>
        </TouchableOpacity>

      </View>

    </View>

  </View>
</Modal>


        <View style={styles.mapContainer}>
          {renderMap()}
        </View>

        {/* Scrollable Driver Bottom Sheet - Passenger Queue (matches the
            FIKA Driver Queue hi-fi prototype: frosted sheet, numbered/
            avatar rider header, PIN-cell entry, in-transit drop-off CTA) */}
        <View style={styles.driverBottomSheet}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetTint} />
          <View style={{ flex: 1 }}>
            <View style={styles.dragHandleV2} />
            <View style={styles.sheetHeaderRowV2}>
              <View>
                <Text style={styles.sheetTitleV2}>Passenger Queue</Text>
                <Text style={styles.sheetSubtitleV2}>
                  {allRiders.length} active rider{allRiders.length === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.queueBadgeV2}>
                <Ionicons name="people" size={16} color="#8A6D1C" />
                <Text style={styles.queueBadgeTextV2}>{allRiders.length}</Text>
              </View>
            </View>

            <FlatList
              data={allRiders}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 20 }}
              renderItem={({ item, index }) => {
                const isWaitingForPickup = ['driver_assigned', 'driver_arriving', 'arrived', 'accepted'].includes(item.status);
                const isInTransit = ['in_progress', 'picked_up'].includes(item.status);
                const riderNumber = getRiderNumber(item.id) ?? index + 1;
                const pinValue = otpInputs[item.id] || '';
                const hasPinError = !!pinErrors[item.id];

                return (
                  <View style={styles.riderCardV2}>
                    <View style={styles.riderHeaderRowV2}>
                      <View style={styles.numberColumnV2}>
                        <View style={styles.numberPillV2}>
                          <Text style={styles.numberPillTextV2}>{riderNumber}</Text>
                        </View>
                        <LinearGradient
                          colors={['#0A2E24', 'rgba(10,46,36,0)']}
                          style={styles.numberLineV2}
                        />
                      </View>

                      <LinearGradient
                        colors={['#1B6B4A', '#0A2E24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarV2}
                      >
                        <Text style={styles.avatarTextV2}>{initialsOf(item.name)}</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.riderNameV2}>{item.name}</Text>
                        <View style={styles.roleBadgeV2}>
                          <Text style={styles.roleBadgeTextV2}>
                            {item.isPrimary ? "Primary trip" : "Pool rider"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.chatBtnV2}
                        onPress={async () => {
                          setDriverUnread(prev => ({ ...prev, [item.id]: false }));
                          await AsyncStorage.removeItem(`chat_unread_${rideId}_${item.id}`);
                          router.push({
                            pathname: "/Chat/chatScreen",
                            params: { trip_id: rideId, role: "driver", target_user_id: item.id }
                          });
                        }}
                      >
                        <Ionicons name="chatbubble-outline" size={18} color={Colors.primaryColor} />
                        {driverUnread[item.id] && <View style={styles.chatUnreadDotV2} />}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dividerV2} />

                    <View style={styles.tripDetailsV2}>
                      <View style={styles.detailRowV2}>
                        <View style={styles.pickupDotV2} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabelV2}>Pickup</Text>
                          <Text style={styles.detailAddressV2} numberOfLines={1}>
                            {item.pickup || "Pickup unavailable"}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.detailRowV2, { marginBottom: 13 }]}>
                        <View style={styles.dropoffDotV2} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabelV2}>Drop-off</Text>
                          <Text style={styles.detailAddressV2} numberOfLines={1}>
                            {item.dropoff || "Destination hidden"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusRowV2,
                          { backgroundColor: isInTransit ? 'rgba(91,201,160,0.1)' : 'rgba(232,163,61,0.1)' }
                        ]}
                      >
                        <View style={styles.statusRowLeftV2}>
                          <View style={[styles.statusDotV2, { backgroundColor: isInTransit ? '#5BC9A0' : '#E8A33D' }]} />
                          <Text style={styles.statusLabelV2}>Live status</Text>
                        </View>
                        <Text style={[styles.statusValueV2, { color: isInTransit ? '#1B8C5A' : '#C99A2E' }]}>
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {isWaitingForPickup && (
                      <View style={styles.actionZoneV2}>
                        <Text style={styles.pinLabelV2}>Enter 4-digit PIN from rider</Text>
                        <View style={styles.pinCellsWrapV2}>
                          <Animated.View style={[styles.pinCellsRowV2, { transform: [{ translateX: getShakeAnim(item.id) }] }]}>
                            {renderPinCells(pinValue)}
                          </Animated.View>
                          <TextInput
                            ref={(ref) => { otpCellRefs.current[item.id] = ref; }}
                            value={pinValue}
                            onChangeText={(val) => {
                              setOtpInputs({ ...otpInputs, [item.id]: val.replace(/\D/g, '').slice(0, 4) });
                              setPinErrors((prev) => ({ ...prev, [item.id]: false }));
                            }}
                            keyboardType="number-pad"
                            maxLength={4}
                            style={styles.hiddenPinInputV2}
                          />
                        </View>
                        {hasPinError && (
                          <Text style={styles.pinErrorTextV2}>Incorrect PIN — ask rider to check their app</Text>
                        )}
                        <TouchableOpacity onPress={() => verifyRiderOtp(item.id, item.isPrimary)} activeOpacity={0.9}>
                          <LinearGradient colors={['#EFB155', '#E8A33D']} style={styles.verifyCtaV2}>
                            <Ionicons name="shield-checkmark" size={19} color="#2A1F06" />
                            <Text style={styles.verifyCtaTextV2}>Verify PIN &amp; start trip</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}

                    {isInTransit && (
                      <View style={styles.actionZoneV2}>
                        <View style={styles.transitCardV2}>
                          <View style={styles.transitLeftV2}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#5BC9A0" />
                            <Text style={styles.transitTextV2}>Rider on board · In transit</Text>
                          </View>
                          <View style={styles.transitEtaRowV2}>
                            <Text style={styles.transitEtaNumV2}>{etaMinutes ?? '--'}</Text>
                            <Text style={styles.transitEtaUnitV2}>min</Text>
                          </View>
                        </View>

                        <Text style={styles.pinLabelV2}>Enter 4-digit drop-off PIN from rider</Text>
                        <View style={styles.pinCellsWrapV2}>
                          <Animated.View style={[styles.pinCellsRowV2, { transform: [{ translateX: getShakeAnim(item.id) }] }]}>
                            {renderPinCells(pinValue)}
                          </Animated.View>
                          <TextInput
                            ref={(ref) => { otpCellRefs.current[item.id] = ref; }}
                            value={pinValue}
                            onChangeText={(val) => {
                              setOtpInputs({ ...otpInputs, [item.id]: val.replace(/\D/g, '').slice(0, 4) });
                              setPinErrors((prev) => ({ ...prev, [item.id]: false }));
                            }}
                            keyboardType="number-pad"
                            maxLength={4}
                            style={styles.hiddenPinInputV2}
                          />
                        </View>
                        {hasPinError && (
                          <Text style={styles.pinErrorTextV2}>Incorrect PIN — ask rider to check their app</Text>
                        )}
                        <TouchableOpacity onPress={() => dropOffRider(item.id)} activeOpacity={0.9}>
                          <LinearGradient colors={['#1B6B4A', '#0A2E24']} style={styles.dropoffCtaV2}>
                            <Ionicons name="arrow-forward-circle-outline" size={20} color="#E8A33D" />
                            <Text style={styles.dropoffCtaTextV2}>Complete drop-off</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </View>
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
  const rideServerObject = {
    ...rideData,
    ...rideDetails,
  };
  console.log("RIDE STATUS:", rideServerObject?.status);

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
  {(rideServerObject?.status === "driver_assigned" ||
    rideServerObject?.status === "driver_arriving" ||
    rideServerObject?.status === "arrived") ? (
    <>
      <Text style={styles.etaText}>
        {etaMinutes !== null && etaMinutes !== undefined
          ? `${etaMinutes} min`
          : "-- min"}
      </Text>

      <Text style={styles.arrivingText}>
        {rideServerObject?.status === "arrived"
          ? "Driver arrived"
          : "Driver arriving"}
      </Text>
    </>
  ) : (
    <Text style={styles.statusText}>
      {rideServerObject?.status
        ? rideServerObject.status.replaceAll("_", " ")
        : "Locating your ride..."}
    </Text>
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
                <View style={styles.divider} />

<TouchableOpacity
  style={{
    backgroundColor: "#FF8811",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  }}
  onPress={shareTrip}
>
  <Ionicons
    name="share-social"
    size={20}
    color="#fff"
    style={{ marginRight: 8 }}
  />

  <Text
    style={{
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    }}
  >
    Share Trip
  </Text>
</TouchableOpacity>
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
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.sosActionButton}
                onPress={() => (sos.isActive ? sos.resolve() : sos.trigger(rideId))}
              >
                <View style={styles.sosIconContainer}>
                  <Ionicons name="shield" size={26} color="#FF3B30" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosButtonTitle}>{sos.isActive ? "Mark as Resolved" : "Send SOS Alert"}</Text>
                  <Text style={styles.sosButtonSubtitle}>{sos.isActive ? "Stop sharing location and audio" : "Notify emergency contacts"}</Text>
                </View>
              </TouchableOpacity>
              {sos.isActive && <View style={styles.successBox}><Ionicons name="checkmark-circle" size={24} color="#22C55E" /><Text style={styles.successText}>SOS Alert Sent Successfully</Text></View>}
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
  // DRIVER STYLES (Kept exactly as they were, but updated to fit standard flex patterns)
  // driverBottomSheet: { 
  //   flex: 0.45, // Set flex so it takes the remaining space and allows scrolling
  //   backgroundColor: '#f8fafc', borderTopLeftRadius: 28, borderTopRightRadius: 28,
  //   marginTop: -20, paddingHorizontal: 20, paddingTop: 12, shadowColor: '#000', 
  //   shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 
  // },
  driverBottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%', // Fixed height allowing map to be visible above
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.16,
    shadowRadius: 44,
    elevation: 20,
    zIndex: 10
  },
  driverMarkerContainer: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarker: {
    width: 64,
    height: 64,
    borderRadius: 32,
  
    backgroundColor: "#FF8811",
  
    justifyContent: "center",
    alignItems: "center",
  
    borderWidth: 5,
    borderColor: "#FFFFFF",
  
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  
    elevation: 10,
  },
  driverOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF8811",
  
    justifyContent: "center",
    alignItems: "center",
  
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 6,
  
    elevation: 10,
  },
  
  driverInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#111827",
  
    justifyContent: "center",
    alignItems: "center",
  },
  driverMarkerImage: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
  riderMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
  
    backgroundColor: "#22C55E",
  
    borderWidth: 4,
    borderColor: "#FFFFFF",
  
    justifyContent: "center",
    alignItems: "center",
  
    shadowColor: "#000",
    shadowOffset: { 
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  
    elevation: 8,
  },

  fourBoxContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  otpBoxSingle: { width: 60, height: 60, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', fontSize: 28, fontWeight: '900', textAlign: 'center', color: '#0f172a' },
  btnVerifyOrangeFull: { backgroundColor: '#FF8811', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
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
  etaText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  
  arrivingText: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "600",
  },





  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  
  premiumCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  
  headerIndicator: {
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  
    paddingBottom: 16,
    marginBottom: 16,
  },
  
  newRequestText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF8811",
    letterSpacing: 1,
  },
  
  distanceSubtext: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  
  fareContainer: {
    backgroundColor: "#EDFDF5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  
  routeContainer: {
    flexDirection: "row",
  },
  
  routeTimeline: {
    width: 20,
    alignItems: "center",
    marginRight: 12,
  },
  
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  
  verticalDivider: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 6,
  },
  
  addressWrapper: {
    flex: 1,
  },
  
  addressNode: {
    justifyContent: "center",
  },
  
  addressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  
  addressValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 4,
  },
  
  actionButtonGroup: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  
  declineButton: {
    flex: 1,
    height: 54,
  
    borderRadius: 14,
  
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  
    backgroundColor: "#F8FAFC",
  
    justifyContent: "center",
    alignItems: "center",
  },
  
  declineButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },
  
  acceptButton: {
    flex: 2,
    height: 54,
  
    borderRadius: 14,
  
    backgroundColor: "#FF8811",
  
    justifyContent: "center",
    alignItems: "center",
  
    shadowColor: "#FF8811",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ===== Driver Passenger Queue V2 (FIKA Driver Queue hi-fi prototype) =====
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250,247,242,0.94)',
  },
  dragHandleV2: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(28,28,30,0.13)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeaderRowV2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  sheetTitleV2: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  sheetSubtitleV2: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8A8175',
    marginTop: 2,
  },
  queueBadgeV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.42)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  queueBadgeTextV2: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A6D1C',
  },
  riderCardV2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(28,28,30,0.07)',
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  riderHeaderRowV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  numberColumnV2: {
    alignItems: 'center',
  },
  numberPillV2: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A2E24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberPillTextV2: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8A33D',
  },
  numberLineV2: {
    width: 2,
    height: 22,
  },
  avatarV2: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextV2: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAF7F2',
  },
  riderNameV2: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  roleBadgeV2: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(10,46,36,0.09)',
    borderRadius: 6,
  },
  roleBadgeTextV2: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#0A2E24',
    textTransform: 'uppercase',
  },
  chatBtnV2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,46,36,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatUnreadDotV2: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5BC9A0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dividerV2: {
    height: 1,
    backgroundColor: 'rgba(28,28,30,0.06)',
    marginHorizontal: 14,
  },
  tripDetailsV2: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailRowV2: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 9,
  },
  pickupDotV2: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5BC9A0',
    marginTop: 3,
  },
  dropoffDotV2: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#E8A33D',
    marginTop: 3,
  },
  detailLabelV2: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#9A9082',
    textTransform: 'uppercase',
  },
  detailAddressV2: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 1,
  },
  statusRowV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  statusRowLeftV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotV2: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelV2: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B6358',
    letterSpacing: 0.3,
  },
  statusValueV2: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionZoneV2: {
    paddingHorizontal: 2,
    paddingTop: 2,
    marginBottom: 4,
  },
  pinLabelV2: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#8A6D1C',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pinCellsWrapV2: {
    position: 'relative',
  },
  pinCellsRowV2: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pinCell: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
    borderWidth: 2,
    borderColor: 'rgba(28,28,30,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCellFilled: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 2,
  },
  pinDigitText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A2E24',
  },
  hiddenPinInputV2: {
    // Covers the full pin-cells row (not a tiny 1x1 dot) so the tap
    // lands directly on the input - a near-zero-size hidden TextInput
    // is unreliable for focus/keyboard on Android.
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  pinErrorTextV2: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.redColor,
    marginBottom: 10,
  },
  verifyCtaV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#E8A33D',
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    marginBottom: 6,
  },
  verifyCtaTextV2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1F06',
    letterSpacing: 0.3,
  },
  transitCardV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(91,201,160,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91,201,160,0.35)',
    borderRadius: 14,
    marginBottom: 14,
  },
  transitLeftV2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transitTextV2: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0A2E24',
  },
  transitEtaRowV2: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  transitEtaNumV2: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A2E24',
    letterSpacing: -0.5,
  },
  transitEtaUnitV2: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C7068',
  },
  dropoffCtaV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    paddingVertical: 17,
    borderRadius: 16,
    shadowColor: '#0A2E24',
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    marginBottom: 6,
  },
  dropoffCtaTextV2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAF7F2',
  },

});
