// Single source for the Django backend's host:port. Previously this was
// hardcoded independently per-screen with at least 3 different stale IPs
// (192.168.0.112, .104, .101) for the same server, so screens silently
// failed to connect depending on which one they happened to copy.
//
// Set EXPO_PUBLIC_API_HOST in your .env to your machine's LAN IP (the one
// `python manage.py runserver 0.0.0.0:8000` is reachable on from your
// phone/emulator) - see .env.example. For the deployed Heroku backend set it
// to the herokuapp domain (no port) and set EXPO_PUBLIC_API_SECURE=true.
export const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.0.105:8000';

// Heroku serves over TLS (https/wss) and the backend force-redirects http->https,
// so ws:// won't connect there. Local `runserver` is plain http/ws. Toggle with
// EXPO_PUBLIC_API_SECURE=true when pointing at an https backend.
const SECURE = process.env.EXPO_PUBLIC_API_SECURE === 'true';
const HTTP_SCHEME = SECURE ? 'https' : 'http';
const WS_SCHEME = SECURE ? 'wss' : 'ws';

export const API_BASE_URL = `${HTTP_SCHEME}://${API_HOST}/api`;
export const WS_BASE_URL = `${WS_SCHEME}://${API_HOST}`;
export const WS_TRACKING_URL = `${WS_BASE_URL}/ws/tracking/`;
export const WS_SOS_BASE_URL = `${WS_BASE_URL}/ws/safety/sos/`;
