

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, Linking, SafeAreaView, Image,ScrollView, Modal,Share } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; 
import { Audio } from 'expo-av';
import api from '../../services/api';
import { Key } from '../../constants/key';
import { MAP_THEME, LIVE_TRACKING_DELTA, ROUTE_LINE_COLOR } from '../../constants/mapTheme';
import { WS_TRACKING_URL, WS_SOS_BASE_URL } from '../../constants/apiConfig';
import AnimatedDriverMarker from './components/AnimatedDriverMarker';



const GOOGLE_MAPS_APIKEY = Key.apiKey;
const WS_BASE = WS_TRACKING_URL;

const customMapTheme = MAP_THEME;

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
  const [driverLocation, setDriverLocation] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [messages, setMessages] = useState([]);
  const [rideDetails, setRideDetails] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [completedFare, setCompletedFare] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  // NEW STATES FOR UI
  const [hasUnread, setHasUnread] = useState(false);
  const [tripDetailsVisible, setTripDetailsVisible] = useState(false);
  const [sosVisible, setSOSVisible] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const activeRideId = rideData?.id || "e0032291-5df6-4458-8663-5757ff732a14";

  const [driverHeading, setDriverHeading] = useState(0);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
const sosLocationSubscription = useRef(null);
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
      const currentUserId = await AsyncStorage.getItem('userId');
      if (String(res.data.rider.id) === String(currentUserId)) {
        setVerificationCode(res.data.verification_code);
      } else {
        const myParticipantData = res.data.participants?.find(p => String(p.user.id) === String(currentUserId));
        if (myParticipantData) {
          setVerificationCode(myParticipantData.pickup_code);
        }
      }
      

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
            if (data.verification_code) {
              setVerificationCode(data.verification_code);
            }
    
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

  const verifyRiderOtp = async (participantId, isPrimary) => {
    try {
    


      const code = otpInputs[participantId];
      if (!code) return Alert.alert("Notice", "Please enter the PIN.");
      console.log("CODE ENTERED:", code);
      console.log("RIDE ID:", rideId);
      const response=await api.post(`/rides/verify-code/`, { ride_id: rideId, code: code });
      console.log(response.data);
      Alert.alert("Success", "Code Verified! Rider is now onboard.");
      fetchRideDetails();
      
    } catch (e) {

      console.error("Verification function crashed with error:", e); 
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


// Add to your state declarations:
const [recordingInstance, setRecordingInstance] = useState(null);
const sosSocketRef = useRef(null);
const sosLocationSub = useRef(null);

const triggerSOS = async () => {
  setIsEmergencyActive(true);
  console.log("⚠️ SOS TRIGGERED: Initializing critical safety overrides.");

  // TASK 1: Immediately route voice channels over cellular provider backbones
  Linking.openURL('tel:10111').catch(() => 
    Alert.alert("Dialer Error", "Could not automatically open native device phone dialer.")
  );

  try {
    // TASK 2: Notify backend instance to log incident and issue tracking key
    const response = await api.post(`/api/rides/pool/${activeRideId}/sos/`);
    const data = response.data;
    const sosId = data.sos_id;
    console.log(`📡 Incident indexed successfully. Tracking Token: ${sosId}`);

    // TASK 3: Spin up non-blocking, isolated safety telemetry channels
    await initializeWebSocketTelemetry(sosId);

    // TASK 4: Capture raw spatial ambient metrics as evidence variables
    await startAmbientAudioCapture();

  } catch (error) {
    console.error("Critical fallback failure during SOS network initialization: ", error);
    Alert.alert("Emergency Warning", "Network reporting failed, but local safety routines are armed.");
  }
};


const initializeWebSocketTelemetry = async (sosId) => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error("Location access denied for safety tracking pipeline.");
    return;
  }

  // Bind distinct socket instance separate from regular ride-matching channel layers
  sosSocketRef.current = new WebSocket(`${WS_SOS_BASE_URL}${sosId}/`);

  sosSocketRef.current.onopen = () => console.log("🔒 Secured safety telemetry tunnel initialized.");

  // Track and pipe spatial snapshots every 3 seconds to backend room groups
  sosLocationSubscription.current = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    },
    (location) => {
      if (sosSocketRef.current && sosSocketRef.current.readyState === WebSocket.OPEN) {
        sosSocketRef.current.send(JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        console.log("📍 Telemetry coordinates piped out.");
      }
    }
  );
};


const startAmbientAudioCapture = async () => {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status === 'granted') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY // Low bitrate compression optimized for immediate cell-tower relays
      );
      setRecordingInstance(recording);
      console.log("🎙️ Microphone hardware stream captured successfully.");
    }
  } catch (err) {
    console.error('Failed to initialize ambient audio recording hardware pipeline:', err);
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
// 3. Make sure to tear down these resources if the tracking screen unmounts
useEffect(() => {
  return () => {
    if (sosLocationSubscription.current) {
      sosLocationSubscription.current.remove();
    }
    if (sosSocketRef.current) {
      sosSocketRef.current.close();
    }
    if (recordingInstance) {
      recordingInstance.stopAndUnloadAsync().catch(() => {});
    }
  };
}, [recordingInstance]);


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
        customMapStyle={customMapTheme}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        }}
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

          return (
            <Marker 
            // ref={driverMarkerRef}
              key={`wp-${index}`} 
              coordinate={{ latitude: lat, longitude: lng }} 
              anchor={{ x: 0.5, y: 0.9 }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 8, borderWidth: 1, borderColor: '#334155',
                  shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
                  elevation: 5, marginBottom: 4, maxWidth: 140
                }}>
                  <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                    {wp.user_name || (isPickup ? "Rider Pickup" : "Drop Location")}
                  </Text>
                </View>
                <View style={{
                  width: 26, height: 26, borderRadius: 13,
                  backgroundColor: isPickup ? '#22C55E' : '#EF4444', 
                  borderWidth: 3, borderColor: '#FFFFFF',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 6
                }}>
                  <Ionicons name={isPickup ? "person" : "flag"} size={12} color="#FFFFFF" />
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
              strokeWidth={5}
              strokeColor={ROUTE_LINE_COLOR}
              onReady={(result) => {

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
              strokeWidth={4}
              strokeColor={ROUTE_LINE_COLOR}
              optimizeWaypoints={false}
              onReady={(result) => {

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
        status: rideData.status, 
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
 onPress={async () => {

   setDriverUnread(prev => ({
     ...prev,
     [item.id]: false
   }));

   await AsyncStorage.removeItem(
     `chat_unread_${rideId}_${item.id}`
   );

   router.push({
     pathname:
       "/Chat/chatScreen",
     params: {
       trip_id: rideId,
       role: "driver",
       target_user_id: item.id
     }
   });
 }}
>
 <Ionicons
   name="chatbubble-ellipses"
   size={20}
   color="#FF8811"
 />

 {driverUnread[item.id] && (
   <View
     style={{
       position: "absolute",
       top: 2,
       right: 2,
       width: 12,
       height: 12,
       borderRadius: 6,
       backgroundColor: "#22C55E",
       borderWidth: 2,
       borderColor: "#fff",
     }}
   />
 )}
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
                        {/* <TouchableOpacity
  style={styles.btnVerifyOrange}
  onPress={() => {

    const enteredOtp =
      otpInputs[item.id];

    if (
      enteredOtp !== "1122"
    ) {
      Alert.alert(
        "Invalid PIN",
        "Use 1122 for testing"
      );
      return;
    }

    console.log(
      "TEMP OTP VERIFIED"
    );

    router.replace({
      pathname:
        "/rideTracking/riderInTripScreen",

      params: {
        rideId,

        role: "rider",

        pickupLat,
        pickupLng,

        dropoffLat,
        dropoffLng,
      },
    });

  }}
></TouchableOpacity> */}
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
              <TouchableOpacity activeOpacity={0.9} style={styles.sosActionButton} onPress={() => { triggerSOS()}}>
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
    backgroundColor: '#f8fafc', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -10 }, 
    shadowOpacity: 0.15, 
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


});
