
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Colors, Sizes } from "../../../constants/styles";
import { MAP_THEME, LIVE_TRACKING_DELTA, GOOGLE_MAP_ID } from "../../../constants/mapTheme";
import AnimatedDriverMarker from "../../rideTracking/components/AnimatedDriverMarker";
import api from "../../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { WS_BASE_URL, API_HOST } from "../../../constants/apiConfig";

const WS_BASE = `${WS_BASE_URL}/ws/tracking/`;
const REQUEST_TIMEOUT_SECONDS = 20;
const COUNTDOWN_RADIUS = 20;
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
};

const getInitials = (fullName) => {
  if (!fullName) return "FK";
  const parts = fullName.trim().split(/\s+/);
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return initials.toUpperCase() || "FK";
};

const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { profileData, fetchProfileDetails } = useProfile();
  const mapRef = useRef(null);

  const [ws, setWs] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationSubscription = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [recentMessage, setRecentMessage] = useState(null);
  const driverSocketRef = useRef(null);
  const locationStreamIntervalRef = useRef(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const activeRideIdRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);
  const [countdown, setCountdown] = useState(REQUEST_TIMEOUT_SECONDS);
  const [dashboardStats, setDashboardStats] = useState({
    today_earnings: 0,
    trips_today: 0,
    rating: null,
    total_ratings: 0,
  });

  const avatarUrl = profileData?.profile_photo
    ? (profileData.profile_photo.startsWith("http")
        ? profileData.profile_photo
        : `http://${API_HOST}${profileData.profile_photo}`)
    : null;
  const firstName = profileData?.full_name?.split(" ")[0] || "Driver";

  useEffect(() => {
    if (isFocused) {
      fetchProfileDetails();
      fetchDashboardStats();
    }
  }, [isFocused]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/rides/driver/stats/");
      if (response.data) setDashboardStats(response.data);
    } catch (err) {
      console.log("Failed to fetch driver dashboard stats:", err.response?.data || err.message);
    }
  };

  // Center the map on the driver's own area immediately, even before going
  // online - matches the "FIKA Driver Home" claude.ai/design prototype's
  // full-bleed map background instead of the old blank gray page.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const location = await Location.getCurrentPositionAsync({});
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setCurrentLocation(coords);

        const addressResponse = await Location.reverseGeocodeAsync(coords);
        if (addressResponse.length > 0) {
          const addr = addressResponse[0];
          setCurrentArea(addr.district || addr.subregion || addr.city || null);
        }
      } catch (err) {
        console.log("Initial driver location fetch failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        },
        1000
      );
    }
  }, [currentLocation]);

  const connectUnifiedSocket = async () => {
    const user_id = await AsyncStorage.getItem("userId");
    if (!user_id) {
      Alert.alert("Error", "No authentication token found.");
      setIsAvailable(false);
      return;
    }

    // Use your defined WS_BASE
    const socketUrl = `${WS_BASE}?user_id=${user_id}`;
    driverSocketRef.current = new WebSocket(socketUrl);

    driverSocketRef.current.onopen = () => {
      console.log("WebSocket connected. Starting location sync...");
      startLocationTracking(driverSocketRef.current);
    };



    driverSocketRef.current.onmessage = (event) => {

      try {

        const msg = JSON.parse(event.data);

        console.log(
          "FULL DRIVER SOCKET MESSAGE:",
          JSON.stringify(msg, null, 2)
        );

        switch(msg.type) {

          case "new_ride_request":

            setIncomingRequest(msg.data);
            setSelectedRequest(msg.data);
            setShowRequestSheet(true);

            break;

          case "ride_status":

            if(msg.status === "cancelled") {

              Alert.alert(
                "Ride Cancelled",
                msg.data?.reason || "Rider cancelled ride"
              );

              setIncomingRequest(null);
              setSelectedRequest(null);
              setShowRequestSheet(false);

            }

            break;

          case "driver_location":

            setDriverLocation({
              latitude: msg.latitude,
              longitude: msg.longitude
            });

            break;

          case "rider_location":

            setRiderLocation({
              latitude: msg.latitude,
              longitude: msg.longitude
            });

            break;

          case "chat_received":

            setRecentMessage(msg);

            break;

          case "joined_ride":

            console.log(
              "Joined ride:",
              msg.ride_id
            );

            break;

          case "error":

            Alert.alert(
              "Socket Error",
              msg.message
            );

            break;

          default:

            console.log(
              "UNKNOWN EVENT",
              msg
            );
        }


    driverSocketRef.current.onclose = (event) => {

      console.log(
        "SOCKET CLOSED",
        event.code
      );

      if (isAvailable) {

        setTimeout(() => {

          console.log(
            "RECONNECTING..."
          );

          connectUnifiedSocket();

        }, 3000);

      }
    };


  } catch(err) {

    console.log(
      "PARSE ERROR",
      err
    );

  }
};
  };

  const terminateDriverSession = () => {
    if (driverSocketRef.current) {
      driverSocketRef.current.close();
      driverSocketRef.current = null;
    }
    if (locationStreamIntervalRef.current) {
      clearInterval(locationStreamIntervalRef.current);
      locationStreamIntervalRef.current = null;
    }
    console.log("Driver node session closed successfully.");
  };

  // API execution handling driver acceptance flow
  const acceptIncomingRide = async (rideId) => {
    setLoading(true);
    try {
      // Post request matches DriverAcceptRideView route signature exactly
      const response = await api.post(`/rides/driver/accept/${rideId}/`);
      if (response.status === 200 || response.data) {
        setActiveRideId(rideId);
        activeRideIdRef.current = rideId;
        if (
          driverSocketRef.current &&
          driverSocketRef.current.readyState === WebSocket.OPEN
        ) {
          driverSocketRef.current.send(
            JSON.stringify({
              type: "join_ride",
              ride_id: rideId
            })
          );
        }
        else{
          console.log("issue with accept incoming ride functon join_ride connection")
        }

        console.log("Ride reservation assignment confirmed:", response.data);
        // The modal's actual visibility is `!!incomingRequest` (see the
        // Modal below) - setShowRequestSheet(false) alone never closed it,
        // since nothing reads showRequestSheet for that. Clearing both
        // here is what actually dismisses it.
        setIncomingRequest(null);
        setSelectedRequest(null);
        setShowRequestSheet(false);

        // Route driver straight into their live navigation map interface
        router.push({
          pathname:"/rideTracking/rideTrackingScreen",
          params:{
            rideId:selectedRequest.ride_id,
            pickupLat: selectedRequest.pickup?.lat, // Fix: access nested object property
            pickupLng: selectedRequest.pickup?.lng, // Fix: access nested object property
            dropoffLat: selectedRequest.dropoff?.lat, // Fix: access nested object property
            dropoffLng: selectedRequest.dropoff?.lng,
            pickupAddress:selectedRequest.pickup_address,
            dropoffAddress:selectedRequest.dropoff_address,
            fare:selectedRequest.fare,
            role:"driver"
          }
         });
      }
    } catch (err) {
      console.error("Failed to confirm match assignment:", err.response?.data || err.message);
      Alert.alert("Assignment Error", "This ride invitation is no longer active or was taken by another operator.");
    }finally{
      setLoading(false);
    }
  };

  const declineRequest = () => {
    setIncomingRequest(null);
    setSelectedRequest(null);
    setShowRequestSheet(false);
  };

  const startLocationTracking = async (activeWs) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permissions are required for driver tracking.");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // every 5 seconds
          distanceInterval: 5, // or every 5 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (activeWs && activeWs.readyState === WebSocket.OPEN) {
            const payload = {
              type: "location_update",
              ride_id: activeRideIdRef.current || null,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading || 0,
              speed: location.coords.speed || 0,
              accuracy: location.coords.accuracy || 10,
            };
            activeWs.send(JSON.stringify(payload));
          }
        }
      );
    } catch (err) {
      console.error("Tracking setup failure:", err);
    }
  };


  useEffect(() => {
    let timeoutId = null;

    if (isAvailable) {
      connectUnifiedSocket();

      // Give the socket a brief moment to connect, then signal availability
      timeoutId = setTimeout(() => {
        if (driverSocketRef.current && driverSocketRef.current.readyState === WebSocket.OPEN) {
          driverSocketRef.current.send(JSON.stringify({
            type: "driver_update_status",
            status: "available"
          }));
          console.log("Sent availability status update to backend.");
        }
      }, 1000);

    } else {
      if (driverSocketRef.current && driverSocketRef.current.readyState === WebSocket.OPEN) {
        driverSocketRef.current.send(JSON.stringify({
          type: "driver_update_status",
          status: "offline"
        }));
      }
      terminateDriverSession();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      terminateDriverSession();
    };
  }, [isAvailable]);

  // Auto-decline countdown - mirrors the "FIKA Driver Home" prototype's
  // ring timer so a ride offer doesn't sit unanswered forever.
  useEffect(() => {
    if (!incomingRequest) {
      setCountdown(REQUEST_TIMEOUT_SECONDS);
      return;
    }
    setCountdown(REQUEST_TIMEOUT_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          declineRequest();
          return REQUEST_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingRequest]);

  const toggleDriverStatus = () => {
    setIsAvailable(!isAvailable);
  };

  const formattedRating = dashboardStats.total_ratings > 0
    ? Number(dashboardStats.rating).toFixed(2)
    : "New";

  const renderMap = () => (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapId={GOOGLE_MAP_ID}
        customMapStyle={MAP_THEME}
        initialRegion={currentLocation ? {
          ...currentLocation,
          latitudeDelta: LIVE_TRACKING_DELTA,
          longitudeDelta: LIVE_TRACKING_DELTA,
        } : undefined}
      >
        {isAvailable && currentLocation && (
          <AnimatedDriverMarker coordinate={currentLocation} heading={0} vehicleType="economy" />
        )}
      </MapView>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.greetingRow, { top: insets.top + 10 }]}>
      <View style={styles.greetingPill}>
        <View style={styles.avatarRing}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={["#1B6B4A", "#0A2E24"]} style={styles.avatarGradient}>
              <Text style={styles.avatarInitials}>{getInitials(profileData?.full_name)}</Text>
            </LinearGradient>
          )}
        </View>
        <View>
          <Text style={styles.greetingLabel}>{getGreeting()}</Text>
          <Text style={styles.greetingName} numberOfLines={1}>{firstName}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/(driverTabs)/profile/profileScreen")}
      >
        <Ionicons name="menu-outline" size={22} color={Colors.primaryColor} />
      </TouchableOpacity>
    </View>
  );

  const renderOnlineToggle = () => (
    <View style={[styles.toggleRow, { top: insets.top + 64 }]}>
      <TouchableOpacity
        onPress={toggleDriverStatus}
        activeOpacity={0.85}
        style={[styles.onlinePill, isAvailable ? styles.onlinePillActive : styles.onlinePillInactive]}
      >
        <View style={[styles.onlineDot, { backgroundColor: isAvailable ? Colors.successGreen : Colors.platinumGray }]} />
        <Text style={[styles.onlinePillText, { color: isAvailable ? Colors.creamBackground : Colors.mutedTextColor }]}>
          {isAvailable ? "You're online" : "You're offline"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOfflineState = () => (
    <View style={styles.offlineWrap}>
      <View style={styles.offlineIconCircle}>
        <Ionicons name="car-outline" size={30} color={Colors.platinumGray} />
      </View>
      <Text style={styles.offlineTitle}>You're offline</Text>
      <Text style={styles.offlineSubtext}>
        Go online to start receiving{"\n"}ride requests in your area.
      </Text>
      <TouchableOpacity activeOpacity={0.88} onPress={toggleDriverStatus}>
        <LinearGradient colors={["#1B6B4A", "#0A2E24"]} style={styles.goOnlineButton}>
          <Text style={styles.goOnlineText}>Go online</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderWaitingState = () => (
    <View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today's earnings</Text>
          <Text style={styles.statValue}>R{Number(dashboardStats.today_earnings || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Trips today</Text>
          <Text style={styles.statValue}>{dashboardStats.trips_today || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.statValue}>{formattedRating}</Text>
            {dashboardStats.total_ratings > 0 && (
              <Svg width={14} height={14} viewBox="0 0 16 16" style={{ marginBottom: 1 }}>
                <Path d="M8 1 l2.2 4.5 5 0.7 -3.6 3.5 0.9 5 -4.5 -2.4 -4.5 2.4 0.9 -5 -3.6 -3.5 5 -0.7 Z" fill={Colors.goldAccent} />
              </Svg>
            )}
          </View>
        </View>
      </View>

      <View style={styles.waitingCard}>
        <ActivityIndicator size="small" color={Colors.secondaryColor} />
        <View style={{ flex: 1, marginLeft: Sizes.fixPadding * 1.4 }}>
          <Text style={styles.waitingTitle}>Waiting for requests</Text>
          <Text style={styles.waitingSubtext}>
            You're live{currentArea ? ` in ${currentArea}` : ""} · matching nearby riders
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRequestState = () => {
    const dashOffset = COUNTDOWN_CIRCUMFERENCE * (1 - countdown / REQUEST_TIMEOUT_SECONDS);
    const distanceKm = ((incomingRequest?.distance_meters || 0) / 1000).toFixed(2);

    return (
      <View>
        <View style={styles.requestHeader}>
          <View>
            <Text style={styles.newRequestLabel}>NEW REQUEST</Text>
            <Text style={styles.newRequestTitle}>Ride offer</Text>
          </View>
          <View style={styles.countdownWrap}>
            <Svg width={52} height={52} viewBox="0 0 44 44" style={{ transform: [{ rotate: "-90deg" }] }}>
              <Circle cx={22} cy={22} r={COUNTDOWN_RADIUS} fill="none" stroke="rgba(28,28,30,0.08)" strokeWidth={3} />
              <Circle
                cx={22}
                cy={22}
                r={COUNTDOWN_RADIUS}
                fill="none"
                stroke={Colors.secondaryColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={COUNTDOWN_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </Svg>
            <View style={styles.countdownLabelWrap}>
              <Text style={styles.countdownLabel}>{countdown}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fareCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fareSubtext}>{distanceKm} km total trip</Text>
          </View>
          <Text style={styles.fareValue}>R{incomingRequest?.fare}</Text>
        </View>

        <View style={styles.routePreview}>
          <View style={styles.routeDotsColumn}>
            <View style={[styles.routeDot, { backgroundColor: Colors.successGreen }]} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, styles.routeDotSquare]} />
          </View>
          <View style={styles.routeAddresses}>
            <Text numberOfLines={1} style={styles.routeAddressText}>
              {incomingRequest?.pickup_address || "Fetching pickup location..."}
            </Text>
            <Text numberOfLines={1} style={[styles.routeAddressText, { marginTop: Sizes.fixPadding * 1.6 }]}>
              {incomingRequest?.dropoff_address || "Fetching dropoff destination..."}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.declineButton} onPress={declineRequest} disabled={loading}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={loading}
            onPress={() => acceptIncomingRide(incomingRequest.ride_id)}
            style={{ flex: 1 }}
          >
            <LinearGradient colors={["#1B6B4A", "#0A2E24"]} style={styles.acceptButton}>
              {loading ? (
                <ActivityIndicator color={Colors.creamBackground} size="small" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept ride</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSheet = () => (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + Sizes.fixPadding }]}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetContent}>
        {!isAvailable
          ? renderOfflineState()
          : incomingRequest
            ? renderRequestState()
            : renderWaitingState()}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.creamBackground }}>
      {renderMap()}
      {renderHeader()}
      {renderOnlineToggle()}
      {renderSheet()}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  map: { width: "100%", height: "100%" },

  // ── floating greeting bar ──
  greetingRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(250,247,242,0.92)",
    paddingVertical: 7,
    paddingRight: 15,
    paddingLeft: 7,
    borderRadius: 30,
    shadowColor: "#141E1A",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: Colors.goldAccent,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: Colors.creamBackground, fontSize: 14, fontWeight: "800", fontFamily: "Montserrat_Bold" },
  greetingLabel: { fontSize: 11, color: Colors.mutedTextColor, fontWeight: "600", fontFamily: "Montserrat_Medium" },
  greetingName: { fontSize: 15, color: Colors.blackColor, fontWeight: "700", marginTop: 1, fontFamily: "Montserrat_SemiBold" },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(250,247,242,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#141E1A",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  // ── online/offline toggle pill ──
  toggleRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 19,
    alignItems: "center",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#0A2E24",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  onlinePillActive: { backgroundColor: Colors.primaryColor },
  onlinePillInactive: { backgroundColor: "rgba(250,247,242,0.92)" },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlinePillText: { fontSize: 13.5, fontWeight: "700", fontFamily: "Montserrat_SemiBold" },

  // ── bottom sheet ──
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(250,247,242,0.97)",
    borderTopLeftRadius: Sizes.fixPadding * 2.8,
    borderTopRightRadius: Sizes.fixPadding * 2.8,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#141E1A",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(28,28,30,0.14)",
    alignSelf: "center",
    marginTop: 10,
  },
  sheetContent: {
    padding: Sizes.fixPadding * 1.6,
    paddingTop: Sizes.fixPadding * 1.4,
  },

  // ── offline state ──
  offlineWrap: { alignItems: "center", paddingVertical: Sizes.fixPadding * 0.6 },
  offlineIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(28,28,30,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Sizes.fixPadding * 1.4,
  },
  offlineTitle: { fontSize: 20, fontWeight: "800", color: Colors.blackColor, letterSpacing: -0.3, fontFamily: "Montserrat_Bold" },
  offlineSubtext: { fontSize: 13.5, color: Colors.mutedTextColor, fontWeight: "500", marginTop: 6, textAlign: "center", lineHeight: 19, fontFamily: "Montserrat_Medium" },
  goOnlineButton: {
    width: 260,
    marginTop: 20,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.primaryColor,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  goOnlineText: { fontSize: 16, fontWeight: "700", color: Colors.creamBackground, fontFamily: "Montserrat_SemiBold" },

  // ── waiting state ──
  statsRow: { flexDirection: "row", gap: 10, marginBottom: Sizes.fixPadding * 1.6 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.whiteColor,
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(28,28,30,0.07)",
    shadowColor: "#141E1A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.7, color: "#9A9082", textTransform: "uppercase", fontFamily: "Montserrat_SemiBold" },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.blackColor, letterSpacing: -0.4, marginTop: 4, fontFamily: "Montserrat_Bold" },
  ratingRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 },
  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Sizes.fixPadding * 1.4,
    backgroundColor: Colors.whiteColor,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(28,28,30,0.07)",
  },
  waitingTitle: { fontSize: 15, fontWeight: "700", color: Colors.blackColor, fontFamily: "Montserrat_SemiBold" },
  waitingSubtext: { fontSize: 12, color: "#9A9082", fontWeight: "500", marginTop: 3, fontFamily: "Montserrat_Medium" },

  // ── incoming request state ──
  requestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Sizes.fixPadding * 1.2 },
  newRequestLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, color: Colors.successGreen, textTransform: "uppercase", fontFamily: "Montserrat_SemiBold" },
  newRequestTitle: { fontSize: 20, fontWeight: "800", color: Colors.blackColor, letterSpacing: -0.3, marginTop: 2, fontFamily: "Montserrat_Bold" },
  countdownWrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  countdownLabelWrap: { position: "absolute" },
  countdownLabel: { fontSize: 16, fontWeight: "800", color: Colors.blackColor, fontFamily: "Montserrat_Bold" },
  fareCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Sizes.fixPadding * 1.4,
    backgroundColor: Colors.whiteColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.22)",
    marginBottom: Sizes.fixPadding * 1.2,
  },
  fareSubtext: { fontSize: 12, color: "#9A9082", fontWeight: "600", fontFamily: "Montserrat_SemiBold" },
  fareValue: { fontSize: 24, fontWeight: "800", color: Colors.blackColor, letterSpacing: -0.5, fontFamily: "Montserrat_Bold" },
  routePreview: {
    flexDirection: "row",
    padding: Sizes.fixPadding * 1.3,
    backgroundColor: Colors.creamBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(28,28,30,0.06)",
    marginBottom: Sizes.fixPadding * 1.6,
  },
  routeDotsColumn: { alignItems: "center", width: 16, marginRight: Sizes.fixPadding },
  routeDot: { width: 9, height: 9, borderRadius: 5 },
  routeDotSquare: { borderRadius: 2, backgroundColor: Colors.secondaryColor },
  routeLine: { width: 1.5, flex: 1, minHeight: 18, backgroundColor: "rgba(28,28,30,0.14)", marginVertical: 3 },
  routeAddresses: { flex: 1 },
  routeAddressText: { fontSize: 12.5, fontWeight: "600", color: "#5C7068", fontFamily: "Montserrat_SemiBold" },
  actionRow: { flexDirection: "row", gap: 11 },
  declineButton: {
    flex: 0,
    width: 108,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(28,28,30,0.12)",
    backgroundColor: Colors.whiteColor,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButtonText: { fontSize: 14, fontWeight: "700", color: "#6B6358", fontFamily: "Montserrat_SemiBold" },
  acceptButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: Colors.primaryColor,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  acceptButtonText: { fontSize: 15, fontWeight: "700", color: Colors.creamBackground, fontFamily: "Montserrat_SemiBold" },
});
