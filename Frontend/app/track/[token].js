
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import {
  useLocalSearchParams,
} from "expo-router";

import axios from "axios";

import RideMap from "../rideTracking/components/RideMap";
import DriverInfoCard from "../rideTracking/components/DriverInfoCard";

import ETAWidget from "../rideTracking/components/ETAWidget";

import useDriverTracking from "../rideTracking/hooks/useDriverTracking";

const API_BASE_URL =
  "http://192.168.0.112:8000";

const WS_BASE_URL =
  "ws://192.168.0.112:8000";

const customMapTheme = [];

export default function PublicTrackingScreen() {

  const { token } =
    useLocalSearchParams();

  const mapRef = useRef(null);

  const {
    heading,
    driverCoordinate,
    updateDriverLocation,
  } = useDriverTracking();

  const [loading, setLoading] =
    useState(true);

  const [rideData, setRideData] =
    useState(null);

  const [duration, setDuration] =
    useState(0);

  const [distance, setDistance] =
    useState(0);

  useEffect(() => {

    loadTracking();

  }, []);

  const loadTracking =
    async () => {

      try {

        const response =
          await axios.get(
            `${API_BASE_URL}/rides/public-track/${token}/`
          );

        setRideData(
          response.data
        );

        if (
          response.data
            .driver_location
        ) {

          updateDriverLocation({
            latitude:
              response.data
                .driver_location
                .latitude,

            longitude:
              response.data
                .driver_location
                .longitude,
          });
        }

        connectSocket(
          response.data
            .ride_id
        );

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }
    };

  const connectSocket =
    (rideId) => {

      const socket =
        new WebSocket(
          `${WS_BASE_URL}/ws/tracking/`
        );

      socket.onopen =
        () => {

          socket.send(
            JSON.stringify({
              type:
                "join_public_tracking",

              ride_id:
                rideId,
            })
          );
        };

      socket.onmessage =
        (event) => {

          const data =
            JSON.parse(
              event.data
            );

          if (
            data.type ===
            "driver_location"
          ) {

            updateDriverLocation({
              latitude:
                data.latitude,

              longitude:
                data.longitude,

              heading:
                data.heading,
            });
          }
        };
    };

  if (
    loading
  ) {

    return (
      <View
        style={
          styles.loader
        }
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  if (
    !rideData
  ) {
    return null;
  }

  return (
    <View
      style={
        styles.container
      }
    >

      <View
        style={
          styles.mapContainer
        }
      >

        <RideMap
          mapRef={
            mapRef
          }
          customMapTheme={
            customMapTheme
          }
          routeCoordinates={
            []
          }
          riderCoordinate={{
            latitude:
              rideData
                .pickup
                .latitude,

            longitude:
              rideData
                .pickup
                .longitude,
          }}
          riderImage={
            "https://ui-avatars.com/api/?name=Rider"
          }
          driverCoordinate={
            driverCoordinate
          }
          driverHeading={
            heading
          }
        />

      </View>

      <View
        style={
          styles.bottom
        }
      >

        <ETAWidget
          duration={
            duration
          }
          distance={
            distance
          }
        />

        <DriverInfoCard
          driverName={
            rideData.driver?.name
          }
          driverPhoto={
            "https://ui-avatars.com/api/?name=Driver"
          }
          rating="4.9"
          vehicleModel={
            rideData.vehicle?.model
          }
          vehicleNumber={
            rideData.vehicle?.number
          }
          onCall={() => {}}
          onChat={() => {}}
        />

        <View
          style={
            styles.tripCard
          }
        >

          <Text
            style={
              styles.label
            }
          >
            Pickup
          </Text>

          <Text
            style={
              styles.value
            }
          >
            Live Ride
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Destination
          </Text>

          <Text
            style={
              styles.value
            }
          >
            Destination
          </Text>

        </View>

      </View>

    </View>
  );
}

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    loader: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    mapContainer: {
      flex: 1,
    },

    bottom: {
      padding: 16,
      gap: 14,
    },

    tripCard: {
      backgroundColor:
        "#fff",

      borderRadius: 20,

      padding: 16,

      shadowColor:
        "#000",

      shadowOpacity:
        0.08,

      shadowRadius:
        10,

      elevation: 4,
    },

    label: {
      color:
        "#777",
    },

    value: {
      marginBottom:
        14,

      marginTop: 4,

      fontWeight:
        "600",
    },
  });
