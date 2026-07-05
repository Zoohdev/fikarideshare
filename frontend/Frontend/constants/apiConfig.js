// Single source for the Django backend's host:port. Previously this was
// hardcoded independently per-screen with at least 3 different stale IPs
// (192.168.0.112, .104, .101) for the same server, so screens silently
// failed to connect depending on which one they happened to copy.
//
// Set EXPO_PUBLIC_API_HOST in your .env to your machine's LAN IP (the one
// `python manage.py runserver 0.0.0.0:8000` is reachable on from your
// phone/emulator) - see .env.example.
export const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'fika-rideshare-api-90ac04a02a1f.herokuapp.com';
// export const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.0.113:8000';

export const API_BASE_URL = `https://${API_HOST}/api`;

export const WS_BASE_URL = `ws://${API_HOST}`;
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