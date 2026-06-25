import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, LogBox, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SecureStore from 'expo-secure-store';
import { useLocationSocket } from "../services/socketService";
import { ProfileProvider } from './context/ProfileContext';
import { Key } from '../constants/key';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useLocationSocket();
  const [loaded] = useFonts({
    Montserrat_Medium: require("../assets/fonts/Montserrat-Medium.ttf"),
    Montserrat_SemiBold: require("../assets/fonts/Montserrat-SemiBold.ttf"),
    Montserrat_Bold: require("../assets/fonts/Montserrat-Bold.ttf"),
  });

  useEffect(() => {
         // connect once
    // startSendingLocation();

    
    if (loaded) {
      SplashScreen.hideAsync();
      SecureStore.getItemAsync('userToken').then((token) => {
        if (token) registerForPushNotificationsAsync();
      });
    }
    const subscription = AppState.addEventListener("change", (_) => {
      StatusBar.setBarStyle("light-content");
    });
    return () => {
      subscription.remove();
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
    <StripeProvider publishableKey={Key.stripePublishableKey} urlScheme="rideshare">
    <ProfileProvider>
      <GestureHandlerRootView>
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/onboardingScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/loginScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/registerScreen" />
          <Stack.Screen name="auth/DriverRegisterScreen" />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(driverTabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="pickLocation/pickLocationScreen" />
          <Stack.Screen name="availableRides/availableRidesScreen" />
          <Stack.Screen name="rideDetail/rideDetailScreen" />
          <Stack.Screen name="rideMapView/rideMapViewScreen" />
          <Stack.Screen name="reviews/reviewsScreen" />
          <Stack.Screen name="confirmPooling/confirmPoolingScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="notifications/notificationsScreen" />
          <Stack.Screen name="startRide/startRideScreen" />
          <Stack.Screen name="endRide/endRideScreen" />
          <Stack.Screen name="rideComplete/rideCompleteScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="transactions/transactionsScreen" />
          <Stack.Screen name="addAndSendMoney/addAndSendMoneyScreen" />
          <Stack.Screen name="paymentMethods/paymentMethodsScreen" />
          <Stack.Screen name="creditCard/creditCardScreen" />
          <Stack.Screen name="successfullyAddAndSend/successfullyAddAndSendScreen" options={{ gestureEnabled: false }} />
          <Stack.Screen name="bankInfo/bankInfoScreen" />
          <Stack.Screen name="editProfile/editProfileScreen" />
          <Stack.Screen name="rideHistory/rideHistoryScreen" />
          <Stack.Screen name="historyRideDetail/historyRideDetailScreen" />
          <Stack.Screen name="userVehicles/userVehiclesScreen" />
          <Stack.Screen name="addVehicle/addVehicleScreen" />
          <Stack.Screen name="termsAndConditions/termsAndConditionsScreen" />
          <Stack.Screen name="privacyPolicy/privacyPolicyScreen" />
          <Stack.Screen name="customerSupport/customerSupportScreen" />
          <Stack.Screen name="faq/faqScreen" />
          <Stack.Screen name="main/mainscreen" />
          <Stack.Screen name="rideDetail/SharingRideDetails" />
          <Stack.Screen name="maps/map" />
        
        </Stack>
      </GestureHandlerRootView>
    </ProfileProvider>
    </StripeProvider>
    </SafeAreaProvider>
  );
}
