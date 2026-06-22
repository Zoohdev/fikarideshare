import React from "react";

import MapView, {
  Polyline,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import AnimatedDriverMarker from "./AnimatedDriverMarker";
import RiderProfileMarker from "./RiderProfileMarker";
const GOOGLE_MAPS_API_KEY = 'AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA'; 

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
          strokeColor="#FF6B00"
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
      strokeColor="#FF6B00"
      onReady={onRouteReady}
    />

  )
}

    </MapView>
  );
};

export default RideMap;