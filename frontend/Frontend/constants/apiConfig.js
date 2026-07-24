// Single source for the Django backend's host:port. Previously this was
// hardcoded independently per-screen with at least 3 different stale IPs
// (192.168.0.112, .104, .101) for the same server, so screens silently
// failed to connect depending on which one they happened to copy.
//
// Set EXPO_PUBLIC_API_HOST in your .env to your machine's LAN IP (the one
// `python manage.py runserver 0.0.0.0:8000` is reachable on from your
// phone/emulator) - see .env.example.
// export const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'fika-rideshare-api-90ac04a02a1f.herokuapp.com';
export const API_HOST = '10.66.157.194:8000';

// export const API_BASE_URL = `https://${API_HOST}/api`;
export const API_BASE_URL = `http://${API_HOST}/api`;


// Must be wss:// (not ws://) to match API_BASE_URL's https:// - Heroku
// terminates TLS on this host, and Android 9+ (API 28+) blocks all
// cleartext (ws://) traffic by default with no manifest override set here.
// A plain ws:// connection to this host doesn't get refused by the server -
// it never leaves the device, so there's no server-side error to see either.
// This was almost certainly why the driver app was never receiving live
// ride requests over the websocket even before today's changes.
export const WS_BASE_URL = `wss://${API_HOST}`;
export const WS_TRACKING_URL = `${WS_BASE_URL}/ws/tracking/`;
export const WS_SOS_BASE_URL = `${WS_BASE_URL}/ws/safety/sos/`;


// API_HOST         = 'fika-rideshare-api-90ac04a02a1f.herokuapp.com'
// export const API_BASE_URL     = `https://fika-rideshare-api-90ac04a02a1f.herokuapp.com/api`
// export const WS_BASE_URL      = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com`
// export const WS_TRACKING_URL  = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com/ws/tracking/`
// export const WS_SOS_BASE_URL  = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com/ws/safety/sos/`


// const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'fika-rideshare-api-90ac04a02a1f.herokuapp.com';
// const IS_SECURE = process.env.EXPO_PUBLIC_API_SECURE === 'true';

// // const HTTP_PROTOCOL = IS_SECURE ? 'https' : 'http';
// // const WS_PROTOCOL = IS_SECURE ? 'wss' : 'ws';

// export const API_BASE_URL     = `https://fika-rideshare-api-90ac04a02a1f.herokuapp.com/api`
// export const WS_BASE_URL      = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com`;
// export const WS_TRACKING_URL  = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com/ws/tracking/`
// export const WS_SOS_BASE_URL  = `wss://fika-rideshare-api-90ac04a02a1f.herokuapp.com/ws/safety/sos/`