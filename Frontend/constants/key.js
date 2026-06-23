// Single source for the Google Maps API key used by react-native-maps and
// react-native-maps-directions (routing/ETA). Previously this same key was
// hardcoded directly in ~8 screen files independently; centralizing here
// means rotating the key (it leaked into the backend repo and is being
// rotated) only requires updating one place: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
// in your .env.
//
// EXPO_PUBLIC_-prefixed vars are inlined by Expo at build time - see
// https://docs.expo.dev/guides/environment-variables/
export const Key = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR GOOGLE MAP API KEY HERE',
  // Publishable key only - safe to ship in the client bundle. Must match
  // whichever Stripe account STRIPE_SECRET_KEY (backend .env) belongs to.
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

export default Key;
