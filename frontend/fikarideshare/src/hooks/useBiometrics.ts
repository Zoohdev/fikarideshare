import { useState, useCallback, useEffect } from 'react';
import ReactNativeBiometrics, {
  BiometryTypes,
} from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import {
  getBiometricChallenge,
  biometricLogin,
  registerBiometric,
} from '../api/auth';
import { AuthResponse } from '../types/auth';

const rnBiometrics = new ReactNativeBiometrics();

// Keychain service name for storing credential ID
const BIOMETRIC_SERVICE = 'com.rideshare.biometric';

interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryTypes | null;
  isEnrolled: boolean;
  credentialId: string | null;
}

interface UseBiometricsReturn extends BiometricState {
  checkBiometrics: () => Promise<void>;
  enrollBiometrics: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<AuthResponse | null>;
  removeBiometricEnrollment: () => Promise<void>;
}

export const useBiometrics = (): UseBiometricsReturn => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: null,
    isEnrolled: false,
    credentialId: null,
  });

  // Check biometric availability and enrollment status
  const checkBiometrics = useCallback(async () => {
    try {
      // Check if biometrics are available on device
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      // Check if user has enrolled biometrics for this app
      const credentials = await Keychain.getGenericPassword({
        service: BIOMETRIC_SERVICE,
      });

      setState({
        isAvailable: available,
        biometryType: biometryType as BiometryTypes,
        isEnrolled: !!credentials,
        credentialId: credentials ? credentials.password : null,
      });
    } catch (error) {
      console.error('Error checking biometrics:', error);
      setState((prev) => ({ ...prev, isAvailable: false }));
    }
  }, []);

  // Run check on mount
  useEffect(() => {
    checkBiometrics();
  }, [checkBiometrics]);

  // Enroll biometrics (generate keys and register with server)
  const enrollBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      // Generate a new key pair
      const { publicKey } = await rnBiometrics.createKeys();

      // Generate a unique credential ID
      const credentialId = `${Platform.OS}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Register with server
      await registerBiometric({
        credential_id: credentialId,
        public_key: publicKey,
        device_name: `${Platform.OS} Device`,
        device_type: Platform.OS,
      });

      // Store credential ID securely
      await Keychain.setGenericPassword('biometric', credentialId, {
        service: BIOMETRIC_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      setState((prev) => ({
        ...prev,
        isEnrolled: true,
        credentialId,
      }));

      return true;
    } catch (error) {
      console.error('Error enrolling biometrics:', error);
      // Clean up on failure
      await rnBiometrics.deleteKeys();
      return false;
    }
  }, []);

  // Authenticate using biometrics
  const authenticateWithBiometrics =
    useCallback(async (): Promise<AuthResponse | null> => {
      try {
        if (!state.credentialId) {
          throw new Error('No biometric credential enrolled');
        }

        // Get challenge from server
        const { challenge } = await getBiometricChallenge(state.credentialId);

        // Prompt for biometric and sign the challenge
        const { success, signature } = await rnBiometrics.createSignature({
          promptMessage: 'Authenticate to continue',
          payload: challenge,
        });

        if (!success || !signature) {
          throw new Error('Biometric authentication failed');
        }

        // Send signed challenge to server for verification
        const response = await biometricLogin({
          credential_id: state.credentialId,
          signature,
          authenticator_data: '', // These would be populated in a full WebAuthn flow
          client_data_json: JSON.stringify({ challenge }),
        });

        return response;
      } catch (error) {
        console.error('Biometric authentication error:', error);
        return null;
      }
    }, [state.credentialId]);

  // Remove biometric enrollment
  const removeBiometricEnrollment = useCallback(async () => {
    try {
      await rnBiometrics.deleteKeys();
      await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
      setState((prev) => ({
        ...prev,
        isEnrolled: false,
        credentialId: null,
      }));
    } catch (error) {
      console.error('Error removing biometric enrollment:', error);
    }
  }, []);

  return {
    ...state,
    checkBiometrics,
    enrollBiometrics,
    authenticateWithBiometrics,
    removeBiometricEnrollment,
  };
};

