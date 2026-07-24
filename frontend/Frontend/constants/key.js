import { Platform } from 'react-native';

// Google Maps keys are split per Google's restriction model:
// - Android/iOS keys below are restricted (in Google Cloud Console) to this
//   app's package name + signing cert / bundle id. They only work for
//   native Maps SDK rendering (react-native-maps) and are safe to ship in
//   the client bundle - that's what the app restriction is for.
// - Places Autocomplete/Details and Directions are plain REST calls with no
//   way to prove app identity, so they can't use an app-restricted key.
//   Those go through the backend (see services/api.js), which holds its
//   own unrestricted, API-scoped key (GOOGLE_MAPS_API_KEY on Heroku).
//
// EXPO_PUBLIC_-prefixed vars are inlined by Expo at build time - see
// https://docs.expo.dev/guides/environment-variables/
export const Key = {
  apiKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS || 'AIzaSyCAWzTg6mHJWPF9WXqkiVvtnT41umRTarM',
    android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID || 'AIzaSyCAWzTg6mHJWPF9WXqkiVvtnT41umRTarM',
  }),
  // Publishable key only - safe to ship in the client bundle. Must match
  // whichever Stripe account STRIPE_SECRET_KEY (backend .env) belongs to.
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

export default Key;
