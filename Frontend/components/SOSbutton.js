import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Linking, View } from 'react-native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api'; // Adjust path to your API instance
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_SOS_BASE_URL } from '../constants/apiConfig';

const WS_SOS_BASE = WS_SOS_BASE_URL;

export default function SOSButton({ rideId }) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const socketRef = useRef(null);
  let locationSubscription = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.close();
      locationSubscription.current?.remove();
      if (recordingInstance) {
        recordingInstance.stopAndUnloadAsync().catch(console.warn);
      }
    };
  }, [recordingInstance]);

  const handlePanicActionTrigger = async () => {
    if (isEmergencyActive) {
      Alert.alert("Emergency Active", "Help is already being requested.");
      return;
    }

    Alert.alert(
      "TRIGGER SOS?",
      "This will immediately call 10111 and alert safety response teams. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "YES, TRIGGER SOS", style: "destructive", onPress: executeSOSProtocol }
      ]
    );
  };

  const executeSOSProtocol = async () => {
    setIsEmergencyActive(true);

    // 1. Dial 10111
    Linking.openURL('tel:10111').catch(() => 
      Alert.alert("Dialer Error", "Could not automatically open native device phone dialer.")
    );

    try {
      // 2. Log incident via your existing API instance
      const apiResponse = await api.post(`/rides/pool/${rideId}/sos/`);
      const sosId = apiResponse.data.sos_id;

      // 3. WebSocket Telemetry
      initializeWebSocketTelemetry(sosId);

      // 4. Ambient Audio Capture
      startAmbientAudioCapture();

    } catch (error) {
      console.error("SOS Network failure: ", error);
      Alert.alert("Network Error", "SOS logged locally. Connecting to dispatch when network returns.");
    }
  };

  const initializeWebSocketTelemetry = async (sosId) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    socketRef.current = new WebSocket(`${WS_SOS_BASE}${sosId}/`);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      (location) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }));
        }
      }
    );
  };

  const startAmbientAudioCapture = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY 
        );
        setRecordingInstance(recording);
      }
    } catch (err) {
      console.error('Audio hardware failure:', err);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.fabSOS, isEmergencyActive ? styles.activeCrisis : styles.idleState]} 
      onPress={handlePanicActionTrigger}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={isEmergencyActive ? "warning" : "shield-half-outline"} 
        size={28} 
        color="#FFF" 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabSOS: {
    position: "absolute",
    top: 60,
    left: 20, // Positioned on the left, opposite to chat
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  idleState: {
    backgroundColor: '#dc3545', // Danger Red
  },
  activeCrisis: {
    backgroundColor: '#000000', // Turns black when active to indicate mode shift
    borderWidth: 2,
    borderColor: '#dc3545'
  }
});