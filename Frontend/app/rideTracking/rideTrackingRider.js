
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Share,
  Dimensions,
  Platform,
} from "react-native";

import MapViewDirections from "react-native-maps-directions";

import MapView, {
  Marker,
  Polyline,
  AnimatedRegion,
} from "react-native-maps";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Location from "expo-location";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";

import BottomSheet from "@gorhom/bottom-sheet";

import api from "../../services/api";

import RideMap from "./components/RideMap";

import DriverInfoCard from "./components/DriverInfoCard";

import VerificationCodeCard from "./components/VerificationCodeCard";

import ETAWidget from "./components/ETAWidget";

import TripDetailsModal from "./components/TripDetailsModal";

import useRideSocket from "./hooks/useRideSocket";

import useDriverTracking from "./hooks/useDriverTracking";

import { shareRide } from "./services/shareRide";

import { Key } from "../../constants/key";
import { MAP_THEME } from "../../constants/mapTheme";
import { API_BASE_URL, WS_BASE_URL, API_HOST } from "../../constants/apiConfig";
const GOOGLE_MAPS_API_KEY = Key.apiKey;

const API_BASE = API_BASE_URL;

const WS_BASE = WS_BASE_URL;

const { width, height } =
  Dimensions.get("window");

const customMapTheme = MAP_THEME;

export default function RideTrackingRider() {
    const [driverLocation, setDriverLocation] =
    useState(null);

  const router =
    useRouter();

  const params =
    useLocalSearchParams();

    console.log(
        "Ride Params",
        params
      );
      
  const mapRef =
    useRef(null);

  const bottomSheetRef =
    useRef(null);

  const rideId =
    params?.rideId;

    const verificationCode =
  rideData?.verification_code?.toString() ||
  "";
  const pickupLat =
 rideData?.pickup_location?.longitude;

  const pickupLng =
  rideData?.pickup_location?.longitude;
  rideData?.pickup_location?.longitude;


  const dropoffLng =
  rideData?.pickup_location?.longitude;;

  const [token,setToken] =
    useState(null);

  const [loading,setLoading] =
    useState(true);

  const [rideData,setRideData] =
    useState(null);

  const [driver,setDriver] =
    useState(null);

  const [vehicle,setVehicle] =
    useState(null);

  const [routeCoordinates,
         setRouteCoordinates] =
    useState([]);

  const [eta,setEta] =
    useState(0);

  const [distance,setDistance] =
    useState(0);

  const [trackingUrl,
         setTrackingUrl] =
    useState("");

  const [driverPhone,
         setDriverPhone] =
    useState("");

  const [pickupAddress,
         setPickupAddress] =
    useState("");

  const [destinationAddress,
         setDestinationAddress] =
    useState("");

  const [fare,setFare] =
    useState("");

  const [showTripDetails,
         setShowTripDetails] =
    useState(false);

  const [userProfileImage,
         setUserProfileImage] =
    useState(
      "https://ui-avatars.com/api/?name=Rider"
    );

  const [riderCoordinate,
         setRiderCoordinate] =
    useState({
      latitude:
        pickupLat || 0,
      longitude:
        pickupLng || 0,
    });

  const {
    heading,
    driverCoordinate,
    updateDriverLocation,
  } =
    useDriverTracking();

    const pickupCoordinate =
    rideData?.pickup_location
      ? {
          latitude:
            rideData.pickup_location.latitude,
          longitude:
            rideData.pickup_location.longitude,
        }
      : null;
  
  const destinationCoordinate =
    rideData?.dropoff_location
      ? {
          latitude:
            rideData.dropoff_location.latitude,
          longitude:
            rideData.dropoff_location.longitude,
        }
      : null;

  const snapPoints =
    useMemo(
      () => ["25%","60%"],
      []
    );

const getImageUrl = (path) => {
        if (!path) {
          return "https://ui-avatars.com/api/?name=Driver";
        }
      
        if (path.startsWith("http")) {
          return path;
        }
      
        return `http://${API_HOST}${path}`;
      };
  const fetchRideDetails =
    async () => {

      try {

        const accessToken =
          await AsyncStorage.getItem(
            "accessToken"
          );

        setToken(
          accessToken
        );

        const response =
          await api.get(
            `/rides/trips/${rideId}/`
          );

        const data =
          response.data;

        setRideData(data);
        console.log(
            "Verification",
            rideData?.verification_code
          );

        if (
          data.driver
        ) {

          setDriver(
            data.driver
          );

          setDriverPhone(
            data.driver?.phone_number ||
            ""
          );
        }

        if (
          data.vehicle
        ) {

          setVehicle(
            data.vehicle
          );
        }

        setPickupAddress(
          data.pickup_address ||
          ""
        );

        setDestinationAddress(
          data.dropoff_address ||
          ""
        );

        setFare(
          data.fare || ""
        );

        console.log(
            "Ride Data",
            data
          );
          
          console.log(
            "Pickup",
            data.pickup_location
          );
          
          console.log(
            "Dropoff",
            data.dropoff_location
          );



      } catch (error) {

        console.log(
          "Ride Fetch Error",
          error
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {

    fetchRideDetails();

  }, []);

  const openChat =
    () => {

      router.push({
        pathname:
          "/Chat/chatScreen",

        params: {
          trip_id:
            rideId,

          role:
            "rider",
        },
      });
    };

  const callDriver =
    () => {

      if (!driverPhone)
        return;

      Linking.openURL(
        `tel:${driverPhone}`
      );
    };

  const openTripDetails =
    () => {

      setShowTripDetails(
        true
      );
    };

  const closeTripDetails =
    () => {

      setShowTripDetails(
        false
      );
    };


  /* =====================================================
      SOCKET + LIVE TRACKING + ETA + SHARE RIDE
  ===================================================== */

  const {
    sendMessage,
    socketRef,
  } = useRideSocket({
    rideId,

    onDriverLocationUpdate:
(data) => {

    console.log(
        "Driver Location",
        data
      );

  setDriverLocation({
    latitude: data.latitude,
    longitude: data.longitude,
  });

  updateDriverLocation({
    latitude: data.latitude,
    longitude: data.longitude,
    heading: data.heading || 0,
  });
},

    onRideStatusUpdate:
      (data) => {

        console.log(
          "Ride Status:",
          data
        );

        if (
          data.status ===
          "completed"
        ) {

          Alert.alert(
            "Trip Completed"
          );

          router.replace(
            "/fareSummary"
          );
        }

        if (
          data.status ===
          "cancelled"
        ) {

          Alert.alert(
            "Ride Cancelled"
          );

          router.back();
        }
      },

    onConnected:
      () => {

        console.log(
          "Ride socket connected"
        );
      },

    onDisconnected:
      () => {

        console.log(
          "Ride socket disconnected"
        );
      },
  });

  /* =====================================================
      GET CURRENT RIDER LOCATION
  ===================================================== */

  const getCurrentLocation =
    async () => {

      try {

        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (
          status !==
          "granted"
        ) {
          return;
        }

        const location =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        setRiderCoordinate({
          latitude:
            location.coords.latitude,

          longitude:
            location.coords.longitude,
        });

      } catch (error) {

        console.log(
          error
        );
      }
    };

  useEffect(() => {

    getCurrentLocation();

  }, []);

  /* =====================================================
      SEND RIDER LOCATION TO BACKEND
  ===================================================== */

  useEffect(() => {

    let subscription;

    const startTracking =
      async () => {

        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (
          status !==
          "granted"
        ) {
          return;
        }

        subscription =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,

              timeInterval:
                5000,

              distanceInterval:
                5,
            },

            (
              location
            ) => {

              const payload =
                {
                  latitude:
                    location.coords
                      .latitude,

                  longitude:
                    location.coords
                      .longitude,
                };

              setRiderCoordinate(
                payload
              );

              sendMessage({
                type:
                  "rider_location_update",

                ride_id:
                  rideId,

                latitude:
                  payload.latitude,

                longitude:
                  payload.longitude,
              });
            }
          );
      };

    if (rideId) {

      startTracking();

    }

    return () => {

      subscription?.remove();

    };

  }, [rideId]);

  /* =====================================================
      LOAD SMART WAYPOINTS
  ===================================================== */

  const loadRoute =
    async () => {

      try {

        const response =
          await api.get(
            `/rides/trips/${rideId}/smart_waypoints/`
          );

        if (
          response.data
            ?.optimized_route
        ) {

          setRouteCoordinates(
            response.data
              .optimized_route
          );
        }

      } catch (error) {

        console.log(
          "Route Error",
          error
        );
      }
    };

  useEffect(() => {

    if (rideId) {

      loadRoute();

    }

  }, [rideId]);

  /* =====================================================
      FIT MAP TO ROUTE
  ===================================================== */

  const fitRoute =
    (
      coordinates
    ) => {

      if (
        !mapRef.current ||
        !coordinates?.length
      ) {
        return;
      }

      mapRef.current.fitToCoordinates(
        coordinates,
        {
          edgePadding:
            {
              top: 120,
              right: 80,
              bottom: 350,
              left: 80,
            },

          animated:
            true,
        }
      );
    };

  useEffect(() => {

    if (
      routeCoordinates
        ?.length > 0
    ) {

      fitRoute(
        routeCoordinates
      );
    }

  }, [
    routeCoordinates,
  ]);

  /* =====================================================
      SHARE RIDE
  ===================================================== */

  const handleShareRide =
    async () => {

      try {

        const data =
          await shareRide(
            rideId,
            token
          );

        setTrackingUrl(
          data.tracking_url
        );

      } catch (error) {

        Alert.alert(
          "Unable to share ride"
        );
      }
    };

  /* =====================================================
      CANCEL RIDE
  ===================================================== */

  const cancelRide =
    async () => {

      Alert.alert(
        "Cancel Ride",
        "Are you sure you want to cancel this ride?",
        [
          {
            text:
              "No",
          },

          {
            text:
              "Yes",

            onPress:
              async () => {

                try {

                  await api.post(
                    `/rides/trips/${rideId}/cancel/`
                  );

                  router.back();

                } catch (
                  error
                ) {

                  Alert.alert(
                    "Unable to cancel ride"
                  );
                }
              },
          },
        ]
      );
    };

  /* =====================================================
      CALCULATE ETA
  ===================================================== */

  const onRouteReady =
    (
      result
    ) => {

      setEta(
        Math.round(
          result.duration
        )
      );

      setDistance(
        Number(
          result.distance
        ).toFixed(1)
      );
    };

  /* =====================================================
      DRIVER ARRIVAL ALERT
  ===================================================== */

  useEffect(() => {

    if (
      distance > 0 &&
      distance < 0.3
    ) {

      Alert.alert(
        "Driver Arriving",
        "Your driver is nearby."
      );
    }

  }, [distance]);

  /* =====================================================
      PART 3
      MAIN UI
  ===================================================== */

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#FF6B00"
        />

        <Text
          style={{
            marginTop: 15,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Loading Ride...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >

      {/* =====================
          MAP SECTION
      ====================== */}

      <View
        style={styles.mapContainer}
      >

        <RideMap
          mapRef={mapRef}
          customMapTheme={customMapTheme}
          routeCoordinates={routeCoordinates}
          riderCoordinate={riderCoordinate}
          riderImage={userProfileImage}
        
          driverCoordinate={driverCoordinate}
          driverLocation={driverLocation}
        
          driverHeading={heading}
        
          pickupCoordinate={pickupCoordinate}
          destinationCoordinate={destinationCoordinate}
        
          onRouteReady={onRouteReady}
        />

        {/* =====================
            ETA FLOATING CARD
        ====================== */}

        <View
          style={
            styles.etaFloatingCard
          }
        >
          <ETAWidget
            duration={eta}
            distance={distance}
          />
        </View>

      </View>

      {/* =====================
          BOTTOM CONTENT
      ====================== */}

      <View
        style={
          styles.bottomContent
        }
      >

        {/* DRIVER INFO */}

        <DriverInfoCard
          driverName={
            driver?.full_name ||
            "Driver"
          }
        
          driverPhoto={
            driver?.profile_photo
          }
        
          rating={
            driver?.average_rating ||
            "5.0"
          }
        
          vehicleModel={
            `${vehicle?.make || ""} ${vehicle?.model || ""}`
          }
        
          vehicleNumber={
            vehicle?.license_plate ||
            "N/A"
          }
        
          onChat={openChat}
        
          onCall={callDriver}
        />

        {/* OTP */}

        <VerificationCodeCard
          code={
            verificationCode
          }
        />

        {/* QUICK ACTIONS */}

        <View
          style={
            styles.actionRow
          }
        >

          <TouchableOpacity
            style={
              styles.tripButton
            }
            onPress={
              openTripDetails
            }
          >
            <Ionicons
              name="receipt"
              size={20}
              color="#fff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Trip Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.shareButton
            }
            onPress={
              handleShareRide
            }
          >
            <Ionicons
              name="share-social"
              size={20}
              color="#fff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Share Ride
            </Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* =====================
          TRIP DETAILS SHEET
      ====================== */}

      {showTripDetails && (
        <TripDetailsModal
          bottomSheetRef={
            bottomSheetRef
          }

          snapPoints={
            snapPoints
          }

          pickupAddress={
            pickupAddress
          }

          destinationAddress={
            destinationAddress
          }

          fare={
            fare
          }

          trackingUrl={
            trackingUrl
          }

          onCancelRide={
            cancelRide
          }

          onClose={
            closeTripDetails
          }
        />
      )}

    </SafeAreaView>
  );
        }


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  mapContainer: {
    flex: 1,
  },

  bottomContent: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 25,

    shadowColor: "#000",

    shadowOpacity: 0.12,

    shadowOffset: {
      width: 0,
      height: -4,
    },

    shadowRadius: 12,

    elevation: 10,
  },

  etaFloatingCard: {
    position: "absolute",

    top: Platform.OS === "ios"
      ? 60
      : 40,

    left: 16,

    right: 16,

    zIndex: 999,
  },

  actionRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginTop: 16,
  },

  tripButton: {
    flex: 1,

    height: 52,

    backgroundColor: "#FF6B00",

    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",

    marginRight: 8,
  },

  shareButton: {
    flex: 1,

    height: 52,

    backgroundColor: "#00A86B",

    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",

    marginLeft: 8,
  },

  actionText: {
    color: "#fff",

    marginLeft: 8,

    fontWeight: "700",

    fontSize: 15,
  },

  floatingCard: {
    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 16,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowRadius: 8,

    elevation: 5,
  },

  cardTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: "#111",
  },

  cardSubTitle: {
    fontSize: 13,

    color: "#666",

    marginTop: 4,
  },

  driverSection: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 10,
  },

  driverImage: {
    width: 60,
    height: 60,

    borderRadius: 30,
  },

  driverInfo: {
    flex: 1,

    marginLeft: 12,
  },

  driverName: {
    fontSize: 16,

    fontWeight: "700",
  },

  driverRating: {
    marginTop: 4,

    color: "#777",
  },

  vehicleNumber: {
    marginTop: 2,

    fontWeight: "600",
  },

  vehicleModel: {
    color: "#555",
  },

  otpContainer: {
    marginTop: 16,

    flexDirection: "row",

    justifyContent: "space-between",
  },

  otpBox: {
    width: 55,
    height: 55,

    borderRadius: 12,

    backgroundColor: "#fff",

    borderWidth: 1,

    borderColor: "#E5E5E5",

    justifyContent: "center",
    alignItems: "center",
  },

  otpText: {
    fontSize: 22,

    fontWeight: "700",
  },

  tripDetailsContainer: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,

    paddingHorizontal: 20,
    paddingTop: 20,

    flex: 1,
  },

  sectionTitle: {
    fontSize: 18,

    fontWeight: "700",

    marginBottom: 15,
  },

  detailRow: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 16,
  },

  detailIcon: {
    width: 34,

    alignItems: "center",
  },

  detailContent: {
    flex: 1,

    marginLeft: 10,
  },

  detailLabel: {
    color: "#777",

    fontSize: 12,
  },

  detailValue: {
    marginTop: 2,

    fontWeight: "600",

    fontSize: 14,
  },

  fareAmount: {
    fontSize: 28,

    fontWeight: "800",

    color: "#FF6B00",
  },

  cancelButton: {
    marginTop: 20,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#FF3B30",

    paddingVertical: 15,

    alignItems: "center",
  },

  cancelText: {
    color: "#FF3B30",

    fontWeight: "700",
  },

  shareRideButton: {
    marginTop: 12,

    borderRadius: 16,

    backgroundColor: "#FF6B00",

    paddingVertical: 15,

    alignItems: "center",
  },

  shareRideText: {
    color: "#fff",

    fontWeight: "700",
  },

  mapOverlayCard: {
    position: "absolute",

    left: 16,
    right: 16,

    bottom: 30,

    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 15,

    shadowColor: "#000",

    shadowOpacity: 0.12,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowRadius: 10,

    elevation: 6,
  },

  loadingContainer: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 15,

    fontSize: 16,

    fontWeight: "600",

    color: "#555",
  },

  routeInfoCard: {
    backgroundColor: "#fff",

    borderRadius: 18,

    padding: 15,

    marginTop: 12,
  },

  routeLabel: {
    color: "#999",

    fontSize: 12,
  },

  routeAddress: {
    fontSize: 14,

    fontWeight: "600",

    marginTop: 2,
  },

  divider: {
    height: 1,

    backgroundColor: "#EEE",

    marginVertical: 12,
  },

});

