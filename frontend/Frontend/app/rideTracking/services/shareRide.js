
import {
  Share,
} from "react-native";

import api from "./rideApi";

export const createShareLink =
  async (
    rideId,
    token
  ) => {
    const response =
      await api.post(
        `/rides/trips/${rideId}/share/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };

export const shareRide =
  async (
    rideId,
    token
  ) => {
    try {
      const data =
        await createShareLink(
          rideId,
          token
        );

      await Share.share({
        message: `
Track my ride live:

${data.tracking_url}
`,
      });

      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
