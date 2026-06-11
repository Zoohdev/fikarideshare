import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useBiometrics } from '../../hooks/useBiometrics';
import { login } from '../../api/auth';
import { useAppDispatch } from '../../store/hooks';
import { setUser, setAuthenticated } from '../../store/slices/authSlice';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    isAvailable: biometricsAvailable,
    isEnrolled: biometricsEnrolled,
    biometryType,
    authenticateWithBiometrics,
  } = useBiometrics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Get biometric icon based on type
  const getBiometricIcon = () => {
    switch (biometryType) {
      case 'FaceID':
        return 'face-recognition';
      case 'TouchID':
      case 'Biometrics':
        return 'fingerprint';
      default:
        return 'fingerprint';
    }
  };

  // Handle email/password login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      dispatch(setUser(response.user));
      dispatch(setAuthenticated(true));
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const response = await authenticateWithBiometrics();
      if (response) {
        dispatch(setUser(response.user));
        dispatch(setAuthenticated(true));
      } else {
        Alert.alert('Error', 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Auto-prompt biometrics on mount if enrolled
  useEffect(() => {
    if (biometricsAvailable && biometricsEnrolled) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        handleBiometricLogin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [biometricsAvailable, biometricsEnrolled]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Biometric Login */}
        {biometricsAvailable && biometricsEnrolled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
          >
            {biometricLoading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <>
                <Icon name={getBiometricIcon()} size={24} color="#007AFF" />
                <Text style={styles.biometricText}>
                  Use {biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Link */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register' as never)}
        >
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 24,
  },
  biometricText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

