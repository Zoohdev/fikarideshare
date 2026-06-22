
import { useEffect, useRef } from "react";

const WS_BASE_URL = "ws://192.168.0.101:8000";

const useRideSocket = ({
  rideId,
  onDriverLocationUpdate,
  onRideStatusUpdate,
  onConnected,
  onDisconnected,
}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!rideId) return;

    const socket = new WebSocket(
      `${WS_BASE_URL}/ws/tracking/`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "✅ Ride websocket connected"
      );

      socket.send(
        JSON.stringify({
          type: "join_ride",
          ride_id: rideId,
        })
      );

      onConnected?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        switch (data.type) {
          case "driver_location":

            onDriverLocationUpdate?.(
              data
            );

            break;

          case "ride_status":

            onRideStatusUpdate?.(
              data
            );

            break;

          default:
            break;
        }
      } catch (error) {
        console.log(error);
      }
    };

    socket.onerror = (error) => {
      console.log(
        "Socket Error:",
        error
      );
    };

    socket.onclose = () => {
      console.log(
        "❌ Ride websocket disconnected"
      );

      onDisconnected?.();
    };

    return () => {
      socket.close();
    };
  }, [rideId]);

  const sendMessage = (
    payload
  ) => {
    if (
      socketRef.current &&
      socketRef.current.readyState === 1
    ) {
      socketRef.current.send(
        JSON.stringify(payload)
      );
    }
  };

  return {
    sendMessage,
    socketRef,
  };
};

export default useRideSocket;
