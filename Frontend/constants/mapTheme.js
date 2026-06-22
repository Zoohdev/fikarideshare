// Single source of truth for map appearance across every screen that shows
// a MapView. Previously this style array (and the zoom level) was copy-pasted
// independently into ~10 screens, drifting out of sync - some screens hid
// road contrast almost entirely (white roads on near-white background) and
// hid all poi.business/poi.park labels, which is why streets and landmarks
// were hard to see. One screen (track/[token].js) had no theme at all.

export const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4b4b4b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f2f2f2' }] },

  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  // Landmarks: visible labels, no generic pin icons (keeps it clean without
  // hiding what the landmark actually is).
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8ece6' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5b6b54' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#c5e8c8' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3f7d45' }] },
  { featureType: 'poi.attraction', elementType: 'labels.text.fill', stylers: [{ color: '#a9692f' }] },
  { featureType: 'poi.business', elementType: 'labels.text.fill', stylers: [{ color: '#5b6b54' }] },

  // Roads: white fill with a visible gray stroke so streets read clearly
  // against the base gray, instead of blending in.
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d7d7d7' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffd9a8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f0ad4e' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#9c5b00' }] },

  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#dcdcdc' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#aee3f5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2f7c97' }] },
];

// Degrees of lat/lng span shown on screen - smaller is more zoomed in.
// Live tracking (driver en route, in-trip, pickup picker) wants a close,
// street-level view. Trip-summary screens show a whole start-to-end route
// and need more room, but were previously zoomed out much further than
// that actually requires (0.25-0.3).
export const LIVE_TRACKING_DELTA = 0.01;
export const TRIP_OVERVIEW_DELTA = 0.05;

export function getRegion(coordinate, delta = LIVE_TRACKING_DELTA) {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default MAP_THEME;
