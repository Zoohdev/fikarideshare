import React from "react";

import MapView, {
  Polyline,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import AnimatedDriverMarker from "./AnimatedDriverMarker";
import RiderProfileMarker from "./RiderProfileMarker";
import { Key } from "../../../constants/key";
import { getRegion, ROUTE_LINE_COLOR } from "../../../constants/mapTheme";
const GOOGLE_MAPS_API_KEY = Key.apiKey;

const RideMap = ({
    mapRef,
  customMapTheme,
  routeCoordinates,

  riderCoordinate,
  riderImage,

  driverCoordinate,
  driverLocation,

  driverHeading,

  pickupCoordinate,
  destinationCoordinate,

  onRouteReady,
}) => {
  const focusCoordinate = driverCoordinate || riderCoordinate || pickupCoordinate || destinationCoordinate;

  return (
    <MapView
      ref={mapRef}
      style={{
        flex: 1,
      }}
      provider="google"
      customMapStyle={
        customMapTheme
      }
      initialRegion={
        focusCoordinate ? getRegion(focusCoordinate) : undefined
      }
      showsUserLocation={false}
      showsCompass={false}

      scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
    >
      {routeCoordinates?.length >
        0 && (
        <Polyline
          coordinates={
            routeCoordinates
          }
          strokeWidth={5}
          strokeColor={ROUTE_LINE_COLOR}
        />
      )}

      {riderCoordinate && (
        <RiderProfileMarker
          coordinate={
            riderCoordinate
          }
          imageUrl={
            riderImage
          }
        />
      )}

      {driverCoordinate && (
        <AnimatedDriverMarker
          coordinate={
            driverCoordinate
          }
          heading={
            driverHeading
          }
        />
      )}

{
  driverLocation &&
  pickupCoordinate && (

    <MapViewDirections
      origin={driverLocation}
      destination={pickupCoordinate}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={5}
      strokeColor={ROUTE_LINE_COLOR}
      onReady={onRouteReady}
    />

  )
}

    </MapView>
  );
};

export default RideMap;