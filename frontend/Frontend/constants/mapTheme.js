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


// MINE 
// export const MAP_THEME = [
//   { elementType: 'geometry', stylers: [{ color: '#ebebeb' }] },
//   { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
//   { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
//   { elementType: 'labels.text.stroke', stylers: [{ color: '#ebebeb' }] },

//   { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
//   { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },

//   // Landmarks: visible gray labels, no generic pin icons - keeps it clean
//   // without hiding what the landmark actually is.
//   { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
//   { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
//   { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d2e8d4' }] },
//   { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f6e' }] },

//   // Roads: white fill, soft gray hairline stroke. Uber doesn't color-code
//   // highways distinctly in this style - hierarchy comes from width, not hue.
//   { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
//   { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
//   { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
//   { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#d6d6d6' }] },
//   { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
//   { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c2c2c2' }] },
//   { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
//   { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },

//   { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#dcdcdc' }] },
//   { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },

//   { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a9cdd9' }] },
//   { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5a7d89' }] },
// ];



// DARK 
// export const MAP_THEME = [
//   // 1. Infrastructure (Global / Base settings)
//   {
//     "featureType": "administrative",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#161a22" }]
//   },
//   {
//     "featureType": "administrative",
//     "elementType": "geometry.stroke",
//     "stylers": [{ "color": "#161a22" }]
//   },
  
//   // 2. Arterial Roads
//   {
//     "featureType": "road.arterial",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#222937" }]
//   },
//   {
//     "featureType": "road.arterial",
//     "elementType": "geometry.stroke",
//     "stylers": [{ "color": "#222937" }]
//   },
//   {
//     "featureType": "road.arterial",
//     "elementType": "labels.text.fill",
//     "stylers": [{ "color": "#62728b" }]
//   },

//   // 3. Highways
//   {
//     "featureType": "road.highway",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#2d3548" }]
//   },
//   {
//     "featureType": "road.highway",
//     "elementType": "geometry.stroke",
//     "stylers": [{ "color": "#2d3548" }]
//   },
//   {
//     "featureType": "road.highway",
//     "elementType": "labels.text.fill",
//     "stylers": [{ "color": "#8b9bb4" }]
//   },

//   // 4. Local Roads
//   {
//     "featureType": "road.local",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#1c212d" }]
//   },
//   {
//     "featureType": "road.local",
//     "elementType": "geometry.stroke",
//     "stylers": [{ "color": "#1c212d" }]
//   },
//   {
//     "featureType": "road.local",
//     "elementType": "labels.text.fill",
//     "stylers": [{ "color": "#4a5568" }]
//   },

//   // 5. Transit Stations
//   {
//     "featureType": "transit.station",
//     "elementType": "labels.text.fill",
//     "stylers": [{ "color": "#ffffff" }]
//   },

//   // 6. Natural (Global fallback)
//   {
//     "featureType": "landscape",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#161a22" }]
//   },

//   // 7. Natural Land
//   {
//     "featureType": "landscape.natural",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#1a1f29" }]
//   },

//   // 8. Natural Water
//   {
//     "featureType": "water",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#0d1117" }]
//   },

//   // 9. Points of Interest (Hidden as specified in your setup)
//   {
//     "featureType": "poi",
//     "elementType": "all",
//     "stylers": [{ "visibility": "off" }]
//   },
//   {
//     "featureType": "poi",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#161a22" }]
//   },

//   // 10. Political Borders
//   {
//     "featureType": "administrative.country",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#161a22" }]
//   },
//   {
//     "featureType": "administrative.land_parcel",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#161a22" }]
//   }
// ];
 
// MAPSTYLE2
// export const MAP_THEME = [
//   // 1. Natural Land
//   {
//     "featureType": "landscape.natural",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#f1f3f5" }]
//   },

//   // 2. Natural Vegetation (Parks, forests, green spaces)
//   {
//     "featureType": "landscape.natural.landcover",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#ccefd1" }]
//   },
//   {
//     "featureType": "poi.park",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#ccefd1" }]
//   },

//   // 3. Natural Water
//   {
//     "featureType": "water",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#d4e9f7" }]
//   },

//   // 4. Global Roads (Fills and Strokes)
//   {
//     "featureType": "road",
//     "elementType": "geometry.fill",
//     "stylers": [{ "color": "#ffffff" }]
//   },
//   {
//     "featureType": "road",
//     "elementType": "geometry.stroke",
//     "stylers": [{ "color": "#e0e3e6" }]
//   },

//   // 5. Points of Interest (Ensure labels are fully visible)
//   {
//     "featureType": "poi",
//     "elementType": "labels",
//     "stylers": [{ "visibility": "on" }]
//   }
// ]

// Mapstyle
export const MAP_THEME = [
  {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#d6e2e6"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#cfd4d5"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#7492a8"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "lightness": 25
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#dde2e3"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#cfd4d5"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#dde2e3"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#7492a8"
      }
    ]
  },
  {
    "featureType": "landscape.natural.terrain",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#dde2e3"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [
      {
        "saturation": -100
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#588ca4"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#a9de83"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#bae6a1"
      }
    ]
  },
  {
    "featureType": "poi.sports_complex",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#c6e8b3"
      }
    ]
  },
  {
    "featureType": "poi.sports_complex",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#bae6a1"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "saturation": -45
      },
      {
        "lightness": 10
      },
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#41626b"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#c1d1d6"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#a6b5bb"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#9fb6bd"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [
      {
        "saturation": -70
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#b4cbd4"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#588ca4"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#008cb5"
      }
    ]
  },
  {
    "featureType": "transit.station.airport",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "saturation": -100
      },
      {
        "lightness": -5
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#a6cbe3"
      }
    ]
  }
]
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
