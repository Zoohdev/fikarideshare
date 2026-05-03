import React from "react";
import { View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
const GOOGLE_MAPS_API_KEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA';
// ✅ your map function

const generateRouteHTML = (sequence) => {
  if (!sequence || sequence.length < 2) {
    return "<h1>No route available</h1>";
  }

  const waypoints = sequence.map(s => ({
    lat: s.lat,
    lng: s.lng
  }));

  return `
  <html>
  <body>
    <div id="map" style="height:100vh"></div>

    <script>
      window.initMap = function() {
        const map = new google.maps.Map(document.getElementById("map"), {
          // zoom: 21,
          center: { lat: ${waypoints[0].lat}, lng: ${waypoints[0].lng} }
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true
        });

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
            const points = ${JSON.stringify(waypoints)};
            
            const bounds = new google.maps.LatLngBounds();
      
points.forEach((point, index) => {
  
  new google.maps.Marker({
    position: point,
    map: map,
    
  });
  bounds.extend(point); 
  google.maps.event.addListenerOnce(map, 'idle', function () {
    map.setZoom(map.getZoom()); // 🔥 increase zoom
  });
});
          } else {
            document.body.innerHTML = "<h2>Map Error: " + status + "</h2>";
          }
        });
      };
    </script>

    <script
      src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"
      async
      defer
    >
    function getDistanceInKm(p1, p2) {
      const R = 6371; // Earth radius in km
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) *
        Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    </script>
  </body>
  </html>
  `;
};

const RideTracking = () => {
  const params = useLocalSearchParams();
  let riderETAs = {};

try {
  if (params.riderETAs) {
    riderETAs = JSON.parse(params.riderETAs);
  }
} catch (e) {
  console.log("Parse error:", e);
}
  // ✅ parse safely
  const tripId = params.tripId;
  const eta = Number(params.eta);

  const group = params.group ? JSON.parse(params.group) : [];
  const sequence = params.sequence ? JSON.parse(params.sequence) : [];



return (
  <View style={{ flex: 1 }}>

    {/* ✅ MAP (TOP) */}
    <View style={{ flex: 1 }}>
      <WebView
        source={{ html: generateRouteHTML(sequence) }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        onError={(e) => console.log("WebView Error:", e.nativeEvent)}
        onHttpError={(e) => console.log("HTTP Error:", e.nativeEvent)}
      />
    </View>

    {/* ✅ BOTTOM CARD UI */}
    <View style={{
      margin:6,
      marginBottom:10,

      padding: 16,
      backgroundColor: "#fff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderRadius:20,
      elevation: 10
    }}>
      
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Trip Overview
      </Text>

      <Text style={{ marginTop: 5, color: "gray" }}>
        Trip ID: {tripId}
      </Text>

      <Text style={{
        marginTop: 5,
        fontSize: 16,
        fontWeight: "600",
        color: "#2e7d32"
      }}>
        ETA: {Math.round(eta)} mins
      </Text>

      {/* Riders */}
      <Text style={{ marginTop: 15, fontWeight: "bold", fontSize: 16 }}>
        Riders
      </Text>

      {/* {group.map((r) => (
        <View key={r.id} style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 6
        }}>
          <Text>{r.name}</Text>
          <Text style={{ color: "gray" }}>{r.seats} seats</Text>
          <Text style={{ color: "gray" }}>
  ETA: {Math.round(params.riderETAs?.[r.id] || 0)} mins
</Text>
        </View>
      ))} */}
      {group.map((r) => {
  const etaValue =
    riderETAs[r.id] ??
    riderETAs[r.riderId] ??
    0;

  return (
    <View key={r.id} style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6
    }}>
      <Text>{r.name}</Text>

      <Text style={{ color: "gray" }}>
        {r.seats} seats
      </Text>

      <Text style={{ color: "#2e7d32", fontWeight: "600" }}>
        ETA: {Math.round(etaValue)} mins
      </Text>
    </View>
  );
})}

      {/* Stops */}
      {/* <Text style={{ marginTop: 15, fontWeight: "bold", fontSize: 16 }}>
        📍 Route Stops
      </Text>

      {sequence.map((s, i) => (
        <View key={i} style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 6
        }}>
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
              i === 0 ? "green" :
              i === sequence.length - 1 ? "red" : "blue",
            marginRight: 10
          }} />
          <Text>{s.name}</Text>
        </View>
      ))} */}
    </View>

  </View>
);
        }
export default RideTracking;