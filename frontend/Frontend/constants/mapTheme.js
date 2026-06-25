import { Colors } from './styles';

// Single source of truth for map appearance across every screen that shows
// a MapView. Previously this style array (and the zoom level) was copy-pasted
// independently into ~10 screens, drifting out of sync.
//
// Restyled per the "FIKA Premium" claude.ai/design prototype (vibrant map
// mood, confirmed final): saturated blue water, confident green parks, warm
// cream roads with gold hairline strokes, warm cream/tan base geometry, and
// landmark labels in the deep teal brand color - replaces the prior
// deliberately-monochrome Uber-style theme.

export const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#0A2E24' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F0E8' }] },

  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#0A2E24' }, { visibility: 'simplified' }] },

  // Landmarks: branded teal labels, no generic pin icons - keeps it clean
  // without hiding what the landmark actually is.
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#EEE5D6' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#0A2E24' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#9BC99A' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#1B6B4A' }] },

  // Roads: warm cream fill, gold hairline stroke - hierarchy comes from
  // both width and a touch of warm color, not flat gray.
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FBF8F3' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E7D49B' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6B6358' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#E3C56A' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#FBF8F3' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#D4AF37' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#0A2E24' }] },

  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#E7D49B' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#6B6358' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#5DA9C7' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0A4A5C' }] },
];

// Degrees of lat/lng span shown on screen - smaller is more zoomed in.
// Live tracking (driver en route, in-trip, pickup picker) wants a close,
// street-level view, matching the reference's "Confirm the pick-up spot"
// zoom. Trip-summary screens show a whole start-to-end route and need
// more room - fitToCoordinates() takes over once a route loads anyway,
// matching the reference's "Confirm the ride category" overview zoom.
export const LIVE_TRACKING_DELTA = 0.004;
export const TRIP_OVERVIEW_DELTA = 0.02;

// Route line is rendered as 3 stacked Polylines (glow casing + main line +
// highlight) for the premium "glowing route" look, instead of one flat
// color. ROUTE_LINE_COLOR kept for any caller that still wants a single
// representative color (e.g. a small inline route preview).
export const ROUTE_LINE_COLOR = Colors.secondaryColor;
export const ROUTE_GLOW_COLOR = Colors.primaryColor;
export const ROUTE_HIGHLIGHT_COLOR = '#F4D58B';

export function getRegion(coordinate, delta = LIVE_TRACKING_DELTA) {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default MAP_THEME;
