import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Linking, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Image ,
  Share
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import api from '../../services/api';
import { Key } from '../../constants/key';
import { MAP_THEME, LIVE_TRACKING_DELTA } from '../../constants/mapTheme';
import AnimatedDriverMarker from './components/AnimatedDriverMarker';

const GOOGLE_MAPS_APIKEY = Key.apiKey;
const WS_BASE = 'ws://192.168.0.112:8000/ws/tracking/';

const customMapTheme = MAP_THEME;

export default function RiderInTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId, pickupLat, pickupLng, dropoffLat, dropoffLng } = params;

  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const sosSocketRef = useRef(null);
  const sosLocationSubscription = useRef(null);
  const hasFitInitially = useRef(false);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState(null);
  const mapReadyRef = useRef(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [etaMinutes, setEtaMinutes] = useState(null);

  useEffect(() => {
    initializeScreen();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (sosLocationSubscription.current) sosLocationSubscription.current.remove();
      if (sosSocketRef.current) sosSocketRef.current.close();
      if (recordingInstance) recordingInstance.stopAndUnloadAsync().catch(() => {});
    };
  }, [rideId]);


  // Auto-zoom effect to keep route coordinates visible inside the map frame
   // Re-runs instantly when rideData or driver position shifts

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


  
  const initializeScreen = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      await fetchRideDetails();
      connectWebSocket(id);
    } catch (err) {
      console.error("Initialization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRideDetails = async () => {
    try {
      const res = await api.get(`/rides/trips/${rideId}/`);
      setRideData(res.data);
    } catch (e) {
      console.error("Error fetching trip info details:", e);
    }
  };

  const connectWebSocket = async (uid) => {
    if (!uid || !rideId) return;

    try {
      wsRef.current = new WebSocket(`${WS_BASE}?user_id=${uid}`);

      wsRef.current.onopen = () => {
        console.log("✅ Secured Rider InTrip Channel Context Bound.");
        setConnectionStatus("connected");
        wsRef.current.send(JSON.stringify({ type: 'join_ride', ride_id: rideId }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedMessage = JSON.parse(event.data);
          if (!parsedMessage) return;

          const data = parsedMessage.data || {};
          const msgType = parsedMessage.type;

          if (msgType === 'driver_location' || parsedMessage.latitude) {
            const lat = parsedMessage.latitude ?? data.latitude;
            const lng = parsedMessage.longitude ?? data.longitude;
          
            if (lat && lng) {
          
              const newLocation = {
                latitude: Number(lat),
                longitude: Number(lng),
                heading: Number(parsedMessage.heading ?? data.heading) || 0,
              };
          
              setDriverLocation(newLocation);
          
              // Follow driver smoothly
              if (
                mapRef.current &&
                hasFitInitially.current
              ) {
                mapRef.current.animateCamera(
                  {
                    center: newLocation,
                  },
                  {
                    duration: 1000,
                  }
                );
              }
            }
          }

          if (msgType === 'ride_status' || data.status) {
            const status = parsedMessage.status || data.status;
            if (status === 'completed') {
              Alert.alert("Ride Complete", "You have arrived at your destination!");
              wsRef.current?.close();
              router.replace({
                pathname: '/feedback/feedbackScreen',
                params: { rideId, fare: data.final_fare || rideData?.estimated_fare }
              });
            }
            if (status === 'cancelled') {
              Alert.alert("Cancelled", "This trip was cancelled by the driver.");
              router.back();
            }
          }
        } catch (err) {
          console.error("Inbound channel stream error parsing:", err);
        }
      };

      wsRef.current.onclose = () => {
        console.log("❌ InTrip Channel Connection Interrupted.");
        setConnectionStatus("disconnected");
      };

      wsRef.current.onerror = (error) => {
        console.log("⚠️ Connection execution exception:", error);
        setConnectionStatus("error");
      };

    } catch (err) {
      console.error("WebSocket setup failed:", err);
    }
  };

  const triggerSOS = async () => {
    setIsEmergencyActive(true);
    Alert.alert("Emergency Alert Active", "Secured telemetry armed. Contacting local response lines.");
    
    Linking.openURL('tel:10111').catch(() => 
      Alert.alert("Dialer Error", "Could not automatically initialize native system call window.")
    );

    try {
      const response = await api.post(`/api/rides/pool/${rideId}/sos/`);
      const sosId = response.data?.sos_id || rideId;

      sosSocketRef.current = new WebSocket(`ws://192.168.0.112:8000/ws/safety/sos/${sosId}/`);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        sosLocationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 3,
          },
          (location) => {
            if (sosSocketRef.current && sosSocketRef.current.readyState === WebSocket.OPEN) {
              sosSocketRef.current.send(JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }));
            }
          }
        );
      }

      const audioPerm = await Audio.requestPermissionsAsync();
      if (audioPerm.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY
        );
        setRecordingInstance(recording);
      }

    } catch (error) {
      console.error("Critical issue initializing secondary safety stream channels: ", error);
    }
  };

  if (loading || !rideData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8811" />
      </View>
    );
  }

  const vehicleData = rideData?.vehicle || {};
  const driverData = rideData?.driver || {};
  
  // Primary default fallbacks
  const targetPickup = { latitude: Number(pickupLat || rideData.pickup_location?.latitude || 0), longitude: Number(pickupLng || rideData.pickup_location?.longitude || 0) };
  const targetDropoff = { latitude: Number(dropoffLat || rideData.dropoff_location?.latitude || 0), longitude: Number(dropoffLng || rideData.dropoff_location?.longitude || 0) };
  const originCoord = driverLocation || targetPickup;

  // Build list of active riders/participants dynamically for maps markers
  let ridersList = [];
  if (rideData.participants && Array.isArray(rideData.participants) && rideData.participants.length > 0) {
    rideData.participants.forEach((p) => {
      const fullParticipantName = p.user ? `${p.user.first_name || ''} ${p.user.last_name || ''}`.trim() : (p.rider_name || "Co-Rider");
      ridersList.push({
        id: p.id || `p-${p.user?.id || Math.random()}`,
        name: fullParticipantName || "Passenger",
        pickup: p.pickup_location ? { latitude: Number(p.pickup_location.latitude), longitude: Number(p.pickup_location.longitude) } : null,
        dropoff: p.dropoff_location ? { latitude: Number(p.dropoff_location.latitude), longitude: Number(p.dropoff_location.longitude) } : null,
      });
    });
  } else {
    const mainName = rideData.rider ? `${rideData.rider.first_name || ''} ${rideData.rider.last_name || ''}`.trim() : "Rider";
    ridersList.push({
      id: 'primary-rider',
      name: mainName,
      pickup: targetPickup.latitude !== 0 ? targetPickup : null,
      dropoff: targetDropoff.latitude !== 0 ? targetDropoff : null,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusIndicatorTag, { backgroundColor: connectionStatus === "connected" ? "#16A34A" : "#EF4444" }]}>
        <Text style={styles.statusIndicatorText}>
          {connectionStatus === "connected" ? "Live Tracking" : "Connecting..."}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView 
          ref={mapRef} 
          onMapReady={() => {
            console.log("MAP READY");
          }}
          style={styles.webview}
          customMapStyle={customMapTheme}
          initialRegion={{
            latitude: targetDropoff.latitude || -26.2041,
            longitude: targetDropoff.longitude || 28.0473,
            latitudeDelta: LIVE_TRACKING_DELTA,
            longitudeDelta: LIVE_TRACKING_DELTA,
          }}
        >
          {/* Driver live vehicle marker - Increased Size */}
          {driverLocation && (
            <AnimatedDriverMarker
              coordinate={driverLocation}
              heading={driverLocation.heading || 0}
            />
          )}

          {/* Dynamic Multiple Pickups and Dropoffs Mapping */}
          {ridersList.map((riderItem) => (
            <React.Fragment key={`group-markers-${riderItem.id}`}>
              {/* Pickup Pins */}
              {riderItem.pickup && riderItem.pickup.latitude !== 0 && (
                <Marker coordinate={riderItem.pickup} anchor={{ x: 0.5, y: 0.9 }}>
                  <View style={styles.markerContainer}>
                    <View style={styles.markerTagFrame}>
                      <Text style={styles.markerTagText}>{riderItem.name} (Pickup)</Text>
                    </View>
                    <View style={[styles.markerPinCircle, { backgroundColor: '#22C55E' }]}>
                      <Ionicons name="person" size={13} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerPinNeedle} />
                  </View>
                </Marker>
              )}

              {/* Destination/Dropoff Pins */}
              {riderItem.dropoff && riderItem.dropoff.latitude !== 0 && (
                <Marker coordinate={riderItem.dropoff} anchor={{ x: 0.5, y: 0.9 }}>
                  <View style={styles.markerContainer}>
                    <View style={styles.markerTagFrame}>
                      <Text style={styles.markerTagText}>{riderItem.name} (Dropoff)</Text>
                    </View>
                    <View style={[styles.markerPinCircle, { backgroundColor: '#EF4444' }]}>
                      <Ionicons name="flag" size={13} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerPinNeedle} />
                  </View>
                </Marker>
              )}
            </React.Fragment>
          ))}

          {/* Route Overlay Generation */}
          {originCoord.latitude !== 0 && targetDropoff.latitude !== 0 && (
            <MapViewDirections
              origin={originCoord}
              destination={targetDropoff}
              apikey={GOOGLE_MAPS_APIKEY}
              mode="DRIVING"
              strokeWidth={6}
              strokeColor="#FF8811"
              resetOnChange={false}
              onReady={(result) => {
                setEtaMinutes(Math.ceil(result.duration));

                if (!mapRef.current) return;
              
                if (!hasFitInitially.current) {
              
                  hasFitInitially.current = true;
              
                  mapRef.current.fitToCoordinates(
                    result.coordinates,
                    {
                      edgePadding: {
                        top: 40,
                        right: 40,
                        bottom: 280,
                        left: 40,
                      },
                      animated: true,
                    }
                  );
                }
              }}
            />
          )}
        </MapView>

        <TouchableOpacity style={styles.floatingSosButton} onPress={triggerSOS}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
          <Text style={styles.floatingSosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {rideData?.status ? `TRIP STATUS: ${rideData.status.toUpperCase().replace('_', ' ')}` : "HEADING TO DESTINATION"}
            </Text>
            {etaMinutes !== null && (
              <Text style={styles.etaText}>
                {etaMinutes} min to destination
              </Text>
            )}
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.vehicleInfoBlock}>
              <Text style={styles.vehicleNumberBig}>
                {vehicleData.license_plate || "Awaiting Info..."}
              </Text>
              <Text style={styles.vehicleModelSmall}>
                {vehicleData.color} {vehicleData.model || vehicleData.make || "Vehicle Option"}
              </Text>
            </View>

            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Trip Fare</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>R {parseFloat(rideData?.estimated_fare || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.driverInfoContainer}>
              <Text style={styles.driverLabel}>Assigned Operator</Text>
              <Text style={styles.driverName}>{driverData.first_name || "Your Assigned Driver"}</Text>
            </View>
            <View style={styles.driverContactBlock}>
              <Text style={styles.driverContactLabel}>Mobile Line</Text>
              <Text style={styles.driverPhoneText}>{driverData.phone_number || driverData.phone || "Hidden Number"}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Route Guidelines</Text>
          <View style={styles.detailCard}>
            <View style={styles.addressBlockRow}>
              <Text style={styles.addressNodeIndicator}>🟢</Text>
              <View style={styles.addressTextFrame}>
                <Text style={styles.addressTitleLabel}>Pickup Point</Text>
                <Text style={styles.addressLineText}>{rideData?.pickup_address || "Pickup location coordinate details"}</Text>
              </View>
            </View>
            
            <View style={styles.addressConnectorBar} />
            
            <View style={styles.addressBlockRow}>
              <Text style={styles.addressNodeIndicator}>📍</Text>
              <View style={styles.addressTextFrame}>
                <Text style={styles.addressTitleLabel}>Dropoff Point</Text>
                <Text style={styles.addressLineText}>{rideData?.dropoff_address || "Dropoff address destination details"}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mapContainer: { flex: 0.55, position: 'relative' },
  bottomSheet: { flex: 0.45, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  statusIndicatorTag: { position: "absolute", top: 50, alignSelf: "center", zIndex: 9999, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  statusIndicatorText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerTagFrame: { 
    backgroundColor: '#0F172A', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#334155', 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 3, 
    elevation: 5, 
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  markerTagText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '700', 
    textAlign: 'center',
    flexWrap: 'wrap'
  },
  markerPinCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  markerPinNeedle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF', marginTop: -1 },
  
  floatingSosButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  floatingSosText: { color: '#fff', fontWeight: '800', marginLeft: 6, fontSize: 14 },
  
  statusContainer: { backgroundColor: "#EEF2FF", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  statusText: { color: "#4338CA", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  etaText: { color: "#4338CA", fontWeight: "700", fontSize: 12, marginTop: 4 },
  verificationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingHorizontal: 4 },
  vehicleInfoBlock: { flex: 1 },
  vehicleNumberBig: { fontSize: 20, fontWeight: "800", color: "#1E293B", letterSpacing: 0.5 },
  vehicleModelSmall: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  codeSection: { alignItems: "flex-end" },
  codeLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  codeContainer: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  codeText: { fontSize: 16, fontWeight: "800", color: "#C2410C", letterSpacing: 0.5 },
  
  driverCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  driverInfoContainer: { flex: 1 },
  driverLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  driverName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  driverContactBlock: { alignItems: 'flex-end' },
  driverContactLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  driverPhoneText: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 10, paddingHorizontal: 2 },
  detailCard: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 16 },
  addressBlockRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressNodeIndicator: { fontSize: 14, marginTop: 2, marginRight: 8 },
  addressTextFrame: { flex: 1 },
  addressTitleLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  addressLineText: { fontSize: 13, color: "#334155", fontWeight: "500", lineHeight: 18 },
  addressConnectorBar: { width: 2, height: 16, backgroundColor: "#E2E8F0", marginLeft: 6, marginVertical: 4 }
});