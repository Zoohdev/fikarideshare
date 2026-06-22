
import axios from "axios";

const API_BASE_URL =
  "http://192.168.0.101:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getRideDetails =
  async (rideId, token) => {
    const response =
      await api.get(
        `/rides/trips/${rideId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };

export const getSmartWaypoints =
  async (
    rideId,
    token
  ) => {
    const response =
      await api.get(
        `/rides/trips/${rideId}/smart_waypoints/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };

export const verifyTripCode =
  async (
    rideId,
    code,
    token
  ) => {
    const response =
      await api.post(
        `/rides/verify-code/`,
        {
          ride_id: rideId,
          verification_code:
            code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };

export default api;
