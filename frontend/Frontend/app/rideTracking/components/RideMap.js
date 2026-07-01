import React, { useEffect, useState } from "react";

import MapView, {
  Polyline,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import AnimatedDriverMarker from "./AnimatedDriverMarker";
import RiderProfileMarker from "./RiderProfileMarker";
import PickupMarker from "./PickupMarker";
import DropoffMarker from "./DropoffMarker";
import { Key } from "../../../constants/key";
import { getNavCamera, GOOGLE_MAP_ID, ROUTE_LINE_COLOR, ROUTE_GLOW_COLOR, ROUTE_HIGHLIGHT_COLOR } from "../../../constants/mapTheme";
const GOOGLE_MAPS_API_KEY = Key.apiKey;

const RideMap = ({
    mapRef,
  routeCoordinates,

  riderCoordinate,
  riderImage,
  riderName,

  driverCoordinate,
  driverLocation,

  driverHeading,

  pickupCoordinate,
  destinationCoordinate,

  onRouteReady,
}) => {
  const focusCoordinate = driverCoordinate || riderCoordinate || pickupCoordinate || destinationCoordinate;

  // Only ask the live Directions API for a driver->pickup route when we
  // don't already have a route to draw - otherwise this and the static
  // routeCoordinates polyline end up stacked on top of each other (same
  // path, drawn twice, plus a wasted Directions API call every render).
  const hasStaticRoute = routeCoordinates?.length > 0;
  const [liveRouteCoords, setLiveRouteCoords] = useState([]);
  const routeToDraw = hasStaticRoute ? routeCoordinates : liveRouteCoords;

  // riderCoordinate starts out equal to the pickup point (rider hasn't been
  // picked up yet), so the two markers would sit exactly on top of each
  // other - once the rider's live location has actually moved away from
  // the pickup point, both the pickup pin and the rider pin are shown
  // together so pickup stays visible even after the rider boards.
  const riderAtPickup = riderCoordinate && pickupCoordinate &&
    Math.abs(riderCoordinate.latitude - pickupCoordinate.latitude) < 0.0005 &&
    Math.abs(riderCoordinate.longitude - pickupCoordinate.longitude) < 0.0005;

  // Keep both the pickup and drop-off pins in frame together (rather than
  // initialRegion's single-point, close-up default) whenever we have
  // either or both of them.
  useEffect(() => {
    const points = [pickupCoordinate, destinationCoordinate].filter(Boolean);
    if (points.length === 0 || !mapRef?.current) return;
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 100, right: 80, bottom: 280, left: 80 },
      animated: true,
    });
  }, [pickupCoordinate?.latitude, pickupCoordinate?.longitude, destinationCoordinate?.latitude, destinationCoordinate?.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={{
        flex: 1,
      }}
      provider="google"
      mapId={GOOGLE_MAP_ID}
      initialCamera={
        focusCoordinate ? getNavCamera(focusCoordinate) : undefined
      }
      showsUserLocation={false}
      showsCompass={false}

      scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
    >
      {routeToDraw?.length > 0 && (
        // Stacked glow-casing + main line + highlight, matching the
        // premium route treatment the rest of the design uses instead of
        // one flat-colored line.
        <>
          <Polyline coordinates={routeToDraw} strokeWidth={13} strokeColor={ROUTE_GLOW_COLOR} lineCap="round" />
          <Polyline coordinates={routeToDraw} strokeWidth={5.5} strokeColor={ROUTE_LINE_COLOR} lineCap="round" />
          <Polyline coordinates={routeToDraw} strokeWidth={1.8} strokeColor={ROUTE_HIGHLIGHT_COLOR} lineCap="round" />
        </>
      )}

      {pickupCoordinate && !riderAtPickup && (
        // Suppressed only while the rider's live pin is still sitting on
        // the pickup point (would otherwise stack two near-identical
        // photo pins) - once they've moved, both pins stay visible.
        <PickupMarker coordinate={pickupCoordinate} photoUrl={riderImage} name={riderName} />
      )}

      {destinationCoordinate && (
        <DropoffMarker coordinate={destinationCoordinate} />
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
  !hasStaticRoute &&
  driverLocation &&
  pickupCoordinate && (

    <MapViewDirections
      origin={driverLocation}
      destination={pickupCoordinate}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={0}
      strokeColor="transparent"
      onReady={(result) => {
        setLiveRouteCoords(result.coordinates);
        onRouteReady?.(result);
      }}
    />

  )
}

    </MapView>
  );
};

export default RideMap;
