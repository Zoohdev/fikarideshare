import { useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";
import { Audio } from "expo-av";
import api from "../services/api";
import { WS_SOS_BASE_URL } from "../constants/apiConfig";

const EMERGENCY_NUMBER = "tel:10111";

/**
 * Single source of truth for the SOS flow - previously reimplemented three
 * times (components/SOSbutton.js, riderInTripScreen.js, rideTrackingScreen.js)
 * with two of the three copies broken (a doubled /api/api/ URL prefix, and
 * one falling back to a hardcoded placeholder ride ID when rideData hadn't
 * loaded yet). trigger()/resolve() are the only two things a screen needs.
 */
export function useSOSEmergency() {
  const [isActive, setIsActive] = useState(false);
  const [sosId, setSosId] = useState(null);

  const socketRef = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      locationSubscriptionRef.current?.remove();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const trigger = async (rideId) => {
    if (isActive) {
      Alert.alert("Emergency Active", "Help is already being requested.");
      return;
    }
    if (!rideId) {
      Alert.alert("Can't start SOS", "Ride details haven't loaded yet - please wait a moment and try again.");
      return;
    }

    // Native call routing fires immediately, independent of whether the
    // rest of this succeeds - never gate the phone call on the network.
    Linking.openURL(EMERGENCY_NUMBER).catch(() =>
      Alert.alert("Dialer Error", "Could not automatically open the native phone dialer.")
    );

    setIsActive(true);

    try {
      const response = await api.post(`/rides/pool/${rideId}/sos/`);
      const newSosId = response.data.sos_id;
      setSosId(newSosId);

      socketRef.current = new WebSocket(`${WS_SOS_BASE_URL}${newSosId}/`);

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === "granted") {
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
          (location) => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }));
            }
          }
        );
      }

      const audioPermission = await Audio.requestPermissionsAsync();
      if (audioPermission.status === "granted") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
        recordingRef.current = recording;
      }
    } catch (error) {
      console.error("SOS initialization failed:", error);
      Alert.alert("Network Error", "SOS logged locally. Connecting to dispatch when network returns.");
    }
  };

  const resolve = async () => {
    if (!isActive || !sosId) return;

    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    socketRef.current?.close();
    socketRef.current = null;

    try {
      const recording = recordingRef.current;
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;

        if (uri) {
          const formData = new FormData();
          const extension = uri.split(".").pop();
          formData.append("audio", {
            uri,
            name: `sos_${sosId}.${extension}`,
            type: `audio/${extension}`,
          });
          await api.post(`/rides/pool/sos/${sosId}/audio/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      await api.post(`/rides/pool/sos/${sosId}/resolve/`);
    } catch (error) {
      console.error("SOS resolve failed:", error);
      Alert.alert("Error", "Could not fully close out the incident - it may need manual follow-up.");
    } finally {
      setIsActive(false);
      setSosId(null);
    }
  };

  return { isActive, sosId, trigger, resolve };
}
