import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image ,
  Share,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import api from '../../services/api';
import { Key } from '../../constants/key';
import { GOOGLE_MAP_ID, getNavCamera, ROUTE_LINE_COLOR, ROUTE_GLOW_COLOR, ROUTE_HIGHLIGHT_COLOR } from '../../constants/mapTheme';
import { WS_TRACKING_URL } from '../../constants/apiConfig';
import AnimatedDriverMarker from './components/AnimatedDriverMarker';
import SOSButton from '../../components/SOSbutton';

const GOOGLE_MAPS_APIKEY = Key.apiKey;
const WS_BASE = WS_TRACKING_URL;

export default function RiderInTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId, pickupLat, pickupLng, dropoffLat, dropoffLng } = params;

  const mapRef = useRef(null);
  const wsRef = useRef(null);
  const hasFitInitially = useRef(false);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [routeCoords, setRouteCoords] = useState([]);
  const mapReadyRef = useRef(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [sharingToContact, setSharingToContact] = useState(false);

  useEffect(() => {
    initializeScreen();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [rideId]);


  // Auto-zoom effect to keep route coordinates visible inside the map frame
   // Re-runs instantly when rideData or driver position shifts

  // Fetches/refreshes the live-tracking link and opens the custom popup -
  // replaces the old behavior of going straight to the native share sheet,
  // since the user wants a dedicated "share to a contact via SMS" action
  // instead.
  const openShareModal = async () => {
    try {
      const response = await api.post(`/rides/trips/${rideId}/share/`);
      setShareUrl(response.data.share_url);
      setShareModalVisible(true);
    } catch (err) {
      Alert.alert("Error", "Could not create a tracking link right now.");
    }
  };

  const shareToContact = async () => {
    if (!shareUrl) return;
    setSharingToContact(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission needed", "Allow contacts access to pick who to share your trip with.");
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const number = contact.phoneNumbers?.[0]?.number;
      if (!number) {
        Alert.alert("No phone number", `${contact.name || "That contact"} doesn't have a phone number saved.`);
        return;
      }

      const smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable) {
        Alert.alert("SMS unavailable", "This device can't send SMS messages.");
        return;
      }

      await SMS.sendSMSAsync([number], `Track my trip live: ${shareUrl}`);
      setShareModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Could not share the trip to that contact.");
    } finally {
      setSharingToContact(false);
    }
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

            // Shared rides: the ride-wide status only flips to 'completed'
            // once EVERY rider is dropped off, so a solo-style check on
            // `status === 'completed'` alone never fires for this specific
            // rider when they're dropped off individually while others
            // are still in the car. Mirrors rideTrackingScreen.js's
            // handling of this same event.
            if (data.event === 'individual_dropped_off' && String(data.user_id) === String(uid)) {
              wsRef.current?.close();
              // Fare screen first (it's the only place that actually calls
              // /payments/charge/) - feedbackScreen has no payment step at
              // all, so routing straight there silently skipped charging
              // the rider. Mirrors rideTrackingScreen.js's destination for
              // this same event.
              router.replace({
                pathname: '/fareSummary/fareSummaryScreen',
                params: { rideId, fare: data.final_fare || rideData?.estimated_fare, role: 'rider' }
              });
              return;
            }

            if (status === 'completed') {
              wsRef.current?.close();
              router.replace({
                pathname: '/fareSummary/fareSummaryScreen',
                params: { rideId, fare: data.final_fare || rideData?.estimated_fare, role: 'rider' }
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
          mapId={GOOGLE_MAP_ID}
          initialCamera={getNavCamera({
            latitude: targetDropoff.latitude || -26.2041,
            longitude: targetDropoff.longitude || 28.0473,
          })}
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
              strokeWidth={13}
              strokeColor={`${ROUTE_GLOW_COLOR}38`}
              resetOnChange={false}
              onReady={(result) => {
                setEtaMinutes(Math.ceil(result.duration));
                setRouteCoords(result.coordinates);

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
          {routeCoords.length > 0 && (
            <>
              <Polyline coordinates={routeCoords} strokeColor={ROUTE_LINE_COLOR} strokeWidth={6} />
              <Polyline coordinates={routeCoords} strokeColor={ROUTE_HIGHLIGHT_COLOR} strokeWidth={2} />
            </>
          )}
        </MapView>

        <SOSButton rideId={rideId} />

        <TouchableOpacity style={styles.shareTripButton} onPress={openShareModal}>
          <Ionicons name="share-social" size={20} color="#0F172A" />
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

          {rideData?.my_dropoff_code && (
            <View style={styles.dropoffCodeBanner}>
              <Text style={styles.dropoffCodeLabel}>GIVE THIS CODE TO YOUR DRIVER AT DROP-OFF</Text>
              <Text style={styles.dropoffCodeValue}>{rideData.my_dropoff_code}</Text>
            </View>
          )}

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

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalCard}>
            <Text style={styles.shareModalTitle}>Share Live Trip</Text>
            <Text style={styles.shareModalSubtitle}>Anyone with this link can see your trip&apos;s location in real time.</Text>

            <View style={styles.shareLinkBox}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{shareUrl}</Text>
            </View>

            <TouchableOpacity
              style={styles.shareToContactButton}
              onPress={shareToContact}
              disabled={sharingToContact}
            >
              {sharingToContact ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="people" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.shareToContactText}>Share to Contact</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareModalCloseButton} onPress={() => setShareModalVisible(false)}>
              <Text style={styles.shareModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  shareTripButton: {
    position: "absolute", top: 60, right: 20, zIndex: 20,
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  shareModalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  shareModalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  shareModalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  shareModalSubtitle: { fontSize: 13, color: "#64748B", marginBottom: 18 },
  shareLinkBox: { backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
  shareLinkText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  shareToContactButton: { flexDirection: "row", backgroundColor: "#0F172A", borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  shareToContactText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  shareModalCloseButton: { alignItems: "center", paddingVertical: 10 },
  shareModalCloseText: { color: "#64748B", fontWeight: "600", fontSize: 14 },
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
  dropoffCodeBanner: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", borderRadius: 16, paddingVertical: 14, alignItems: "center", marginBottom: 20 },
  dropoffCodeLabel: { fontSize: 11, color: "#9A3412", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  dropoffCodeValue: { fontSize: 28, fontWeight: "900", color: "#C2410C", letterSpacing: 8 },
  
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