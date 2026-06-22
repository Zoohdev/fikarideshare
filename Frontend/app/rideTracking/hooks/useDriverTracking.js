
import {
  useRef,
  useState,
} from "react";

import {
  AnimatedRegion,
} from "react-native-maps";

const useDriverTracking = () => {
  const [heading, setHeading] =
    useState(0);

  const driverCoordinate =
    useRef(
      new AnimatedRegion({
        latitude: 0,
        longitude: 0,

        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    ).current;

  const updateDriverLocation =
    ({
      latitude,
      longitude,
      heading = 0,
    }) => {
      driverCoordinate
        .timing({
          latitude,
          longitude,

          duration: 2000,

          useNativeDriver:
            false,
        })
        .start();

      setHeading(heading);
    };

  return {
    heading,

    driverCoordinate,

    updateDriverLocation,
  };
};

export default useDriverTracking;