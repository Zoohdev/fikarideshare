import { useState, useEffect, useRef, useCallback } from 'react';
import Geolocation, {
  GeolocationResponse,
  GeolocationError,
} from '@react-native-community/geolocation';
import BackgroundGeolocation, {
  Location,
  Config,
} from 'react-native-background-geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  backgroundTracking?: boolean;
  distanceFilter?: number;
  interval?: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  error: string | null;
  loading: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  requestPermissions: () => Promise<boolean>;
}

export const useLocation = (
  options: UseLocationOptions = {}
): UseLocationReturn => {
  const {
    enableHighAccuracy = true,
    backgroundTracking = false,
    distanceFilter = 10, // meters
    interval = 5000, // milliseconds
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);

  // Request location permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Location permission denied');
          return false;
        }

        // For background tracking, need additional permissions
        if (backgroundTracking && Platform.Version >= 29) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );

          if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Background location permission denied');
            return false;
          }
        }
      }

      return true;
    } catch (err) {
      setError('Error requesting permissions');
      return false;
    }
  }, [backgroundTracking]);

  // Handle location update
  const handleLocationUpdate = useCallback(
    (position: GeolocationResponse | Location) => {
      let locationData: LocationData;

      if ('coords' in position) {
        // GeolocationResponse from @react-native-community/geolocation
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
      } else {
        // Location from react-native-background-geolocation
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).getTime(),
        };
      }

      setLocation(locationData);
      setError(null);
    },
    []
  );

  // Handle location error
  const handleLocationError = useCallback((err: GeolocationError | string) => {
    const message = typeof err === 'string' ? err : err.message;
    setError(message);
    console.error('Location error:', message);
  }, []);

  // Start foreground tracking
  const startForegroundTracking = useCallback(() => {
    if (watchIdRef.current !== null) return;

    watchIdRef.current = Geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy,
        distanceFilter,
        interval,
        fastestInterval: interval / 2,
      }
    );
  }, [
    enableHighAccuracy,
    distanceFilter,
    interval,
    handleLocationUpdate,
    handleLocationError,
  ]);

  // Start background tracking
  const startBackgroundTracking = useCallback(async () => {
    const config: Config = {
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter,
      stopTimeout: 5,
      debug: __DEV__,
      logLevel: __DEV__
        ? BackgroundGeolocation.LOG_LEVEL_VERBOSE
        : BackgroundGeolocation.LOG_LEVEL_OFF,
      startOnBoot: false,
      stopOnTerminate: true,
      locationAuthorizationRequest: 'Always',
      backgroundPermissionRationale: {
        title: 'Allow location access in background',
        message:
          'We need your location to track your ride and provide accurate ETAs.',
        positiveAction: 'Allow',
        negativeAction: 'Cancel',
      },
    };

    await BackgroundGeolocation.ready(config);

    BackgroundGeolocation.onLocation(
      (location) => handleLocationUpdate(location),
      (error) => handleLocationError(error.message)
    );

    await BackgroundGeolocation.start();
  }, [distanceFilter, handleLocationUpdate, handleLocationError]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) return;

    setLoading(true);
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      setLoading(false);
      return;
    }

    // Get initial position
    Geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      { enableHighAccuracy, timeout: 15000, maximumAge: 10000 }
    );

    if (backgroundTracking) {
      await startBackgroundTracking();
    } else {
      startForegroundTracking();
    }

    isTrackingRef.current = true;
    setLoading(false);
  }, [
    backgroundTracking,
    enableHighAccuracy,
    requestPermissions,
    startBackgroundTracking,
    startForegroundTracking,
    handleLocationUpdate,
    handleLocationError,
  ]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (backgroundTracking) {
      BackgroundGeolocation.stop();
    }

    isTrackingRef.current = false;
  }, [backgroundTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    error,
    loading,
    startTracking,
    stopTracking,
    requestPermissions,
  };
};

