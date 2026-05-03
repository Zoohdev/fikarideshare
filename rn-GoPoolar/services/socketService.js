import * as Location from "expo-location";
import { useEffect } from "react";
import { io } from "socket.io-client"; // reuse global socket

const socket = io("http://192.168.1.4:3000", {
  transports: ["websocket"], // optional but better
});

export default socket;
export const useLocationSocket = (userType, userId) => {
  useEffect(() => {
    let subscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude } = location.coords;

          console.log("📍 Live:", latitude, longitude);
          socket.emit("driver-location", {
            // driverId: userId,
            driverId: 1,
            lat: latitude,
            lng: longitude,
          });
          socket.emit("send-location", {
            riderId: userId,
            lat: latitude,
            lng: longitude,
          });
          
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);
};
export const registerRiderSocket = async () => {
  let riderId = await AsyncStorage.getItem("riderId");

  if (!riderId) {
    riderId = Date.now().toString();
    await AsyncStorage.setItem("riderId", riderId);
  }

  socket.emit("register-rider", { riderId });

  console.log("✅ Rider registered globally:", riderId);
};

