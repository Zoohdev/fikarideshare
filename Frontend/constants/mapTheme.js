import { Colors } from './styles';

// Single source of truth for map appearance across every screen that shows
// a MapView. Previously this style array (and the zoom level) was copy-pasted
// independently into ~10 screens, drifting out of sync - some screens hid
// road contrast almost entirely (white roads on near-white background) and
// hid all poi.business/poi.park labels, which is why streets and landmarks
// were hard to see. One screen (track/[token].js) had no theme at all.
//
// Restyled to match Uber's reference look: light neutral-gray base, white
// roads with a soft gray hairline (no per-tier color-coding), muted sage
// parks and grayish-blue water, and landmark/road labels in a consistent
// dark gray rather than colorful text - Uber's palette is almost
// monochrome except for parks/water.

export const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#ebebeb' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ebebeb' }] },

  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },

  // Landmarks: visible gray labels, no generic pin icons - keeps it clean
  // without hiding what the landmark actually is.
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d2e8d4' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f6e' }] },

  // Roads: white fill, soft gray hairline stroke. Uber doesn't color-code
  // highways distinctly in this style - hierarchy comes from width, not hue.
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#d6d6d6' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c2c2c2' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },

  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#dcdcdc' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a9cdd9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5a7d89' }] },
];

// Degrees of lat/lng span shown on screen - smaller is more zoomed in.
// Live tracking (driver en route, in-trip, pickup picker) wants a close,
// street-level view, matching the reference's "Confirm the pick-up spot"
// zoom. Trip-summary screens show a whole start-to-end route and need
// more room - fitToCoordinates() takes over once a route loads anyway,
// matching the reference's "Confirm the ride category" overview zoom.
export const LIVE_TRACKING_DELTA = 0.01;
export const TRIP_OVERVIEW_DELTA = 0.05;

// Route line color - dark/near-black like Uber's, reusing the app's actual
// primary brand color (constants/styles.js) instead of inventing a new one.
export const ROUTE_LINE_COLOR = Colors.primaryColor;

export function getRegion(coordinate, delta = LIVE_TRACKING_DELTA) {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default MAP_THEME;
