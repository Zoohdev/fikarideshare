let map = null;
let marker = null;
let rideId = null;
let socket = null;
let routePolyline = null;

async function loadTracking() {

try {

    const response = await fetch(
        `/api/rides/public-track/${TOKEN}/`
    );

    const ride = await response.json();

    console.log("TRACK DATA:", ride);
    console.log("ROUTE LENGTH:", ride.route?.length);

    rideId = ride.ride_id;

    document.getElementById("ride-status").innerText =
        ride.status || "-";

    document.getElementById("driver-name").innerText =
        ride.driver?.name || "Driver Pending";

    document.getElementById("vehicle-model").innerText =
        ride.vehicle?.model || "-";

    document.getElementById("vehicle-number").innerText =
        ride.vehicle?.number || "-";

    document.getElementById("pickup-address").innerText =
        ride.pickup_address || "-";

    document.getElementById("dropoff-address").innerText =
        ride.dropoff_address || "-";

    document.getElementById("eta").innerText =
        ride.estimated_duration
            ? `${Math.ceil(ride.estimated_duration / 60)} min`
            : "-";

    if (!ride.driver_location) {
        return;
    }

    const lat = Number(
        ride.driver_location.latitude
    );

    const lng = Number(
        ride.driver_location.longitude
    );

    if (
        marker &&
        !isNaN(lat) &&
        !isNaN(lng)
    ) {

        const newPos = {
            lat,
            lng
        };

        marker.setPosition(newPos);

        map.panTo(newPos);
    }

    if (!map) {

        map = new google.maps.Map(
            document.getElementById("map"),
            {
                zoom: 15,
                center: {
                    lat: ride.pickup.latitude,
                    lng: ride.pickup.longitude
                }
            }
        );

        marker =
            new google.maps.Marker({
                position: {
                    lat,
                    lng
                },
                map: map,
                title: "Driver"
            });

        new google.maps.Marker({
            position: {
                lat: ride.pickup.latitude,
                lng: ride.pickup.longitude
            },
            label: "P",
            map: map
        });

        new google.maps.Marker({
            position: {
                lat: ride.destination.latitude,
                lng: ride.destination.longitude
            },
            label: "D",
            map: map
        });

        const directionsService =
        new google.maps.DirectionsService();
      
      const directionsRenderer =
        new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#2196F3",
            strokeWeight: 6,
          },
        });
      
      directionsRenderer.setMap(map);
      
      directionsService.route(
        {
          origin: {
            lat,
            lng
          },
      
          destination: {
            lat: ride.destination.latitude,
            lng: ride.destination.longitude
          },
      
          travelMode:
            google.maps.TravelMode.DRIVING,
        },
      
        (result, status) => {
      
          console.log(
            "DIRECTIONS STATUS:",
            status
          );
      
          if (status === "OK") {
      
            directionsRenderer.setDirections(
              result
            );
      
          } else {
      
            console.error(
              "Directions Error:",
              status
            );
          }
        }
      );

        connectSocket();
    }

} catch (error) {

    console.error(
        "Tracking Error:",
        error
    );
}

}

function connectSocket() {

if (socket) {
    return;
}

const protocol =
    window.location.protocol === "https:"
        ? "wss:"
        : "ws:";

const wsUrl =
    `${protocol}//${window.location.host}/ws/tracking/?public_tracking=true`;

console.log(
    "CONNECTING TO:",
    wsUrl
);

console.log(
    "HOST:",
    window.location.host
    );
    
    console.log(
    "WS URL:",
    wsUrl
    );

socket = new WebSocket(
    wsUrl
);

socket.onopen = () => {

    console.log(
        "WebSocket Connected"
    );

    socket.send(
        JSON.stringify({
            type:
                "join_public_tracking",
            ride_id:
                rideId
        })
    );
};

socket.onmessage = (
    event
) => {

    const data =
        JSON.parse(
            event.data
        );

    console.log(
        "WS DATA:",
        data
    );

    if (
        data.type ===
        "driver_location"
    ) {

        const newPos = {
            lat: Number(
                data.latitude
            ),
            lng: Number(
                data.longitude
            )
        };

        if (
            marker
        ) {

            marker.setPosition(
                newPos
            );

            map.panTo(
                newPos
            );
        }
    }

    if (
        data.type ===
        "trip_status"
    ) {

        document.getElementById(
            "ride-status"
        ).innerText =
            data.status;
    }
};

socket.onclose = () => {

    console.log(
        "WebSocket Closed"
    );

    socket = null;

    setTimeout(
        connectSocket,
        3000
    );
};

socket.onerror = (
    err
) => {

    console.error(
        "WebSocket Error",
        err
    );
};


}

loadTracking();

setInterval(
loadTracking,
10000
);
