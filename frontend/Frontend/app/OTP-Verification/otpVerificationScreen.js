// VerificationScreen.js
import axios from "axios";
import { useNavigation, useRoute } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";

const { width, height } = Dimensions.get('window');
const BACKEND_BASE = "http://10.0.2.2:3000/api";

const VerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const emailParam = route.params?.email || "";
  const phoneParam = route.params?.phone || "";

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    phoneVerified: false,
    faceVerified: false,
    allVerified: false,
    hasStoredFace: false
  });
  const [loading, setLoading] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState('adjusting');
  const [captureStep, setCaptureStep] = useState(0);
  const [instruction, setInstruction] = useState('Position your face in the frame');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const instructionAnim = useRef(new Animated.Value(0)).current;

  const instructions = [
    "Position your face in the frame",
    "Move closer to the camera",
    "Center your face in the oval",
    "Keep your face straight",
    "Good! Hold still...",
    "Capturing your face..."
  ];

  // Animation effects
  useEffect(() => {
    if (showCamera && captureStep === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showCamera, captureStep]);

  useEffect(() => {
    Animated.timing(instructionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [instruction]);

  // Check verification status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE}/register/verification-status/${emailParam}`);
        setVerificationStatus(res.data);
      } catch (err) {
        console.log("Error checking status:", err);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(interval);
  }, [emailParam]);

  // Email Verification Function
  const verifyEmail = async () => {
    if (!emailCode.trim()) {
      Alert.alert("Error", "Please enter the email verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE}/verify-email`, {
        email: emailParam,
        code: emailCode,
      });
      Alert.alert("Success ✅", "Email verified successfully!");
      setEmailCode("");
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Email verification failed. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Phone Verification Function
  const verifyPhone = async () => {
    if (!phoneCode.trim()) {
      Alert.alert("Error", "Please enter the phone verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE}/verify-phone`, {
        phone: phoneParam,
        code: phoneCode,
      });
      Alert.alert("Success ✅", "Phone number verified successfully!");
      setPhoneCode("");
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Phone verification failed. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Complete Registration Function
  const completeRegistration = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_BASE}/complete-registration`,
        {
          email: emailParam,
          phone: phoneParam,
        }
      );

      Alert.alert("Success ✅", "Registration completed successfully!", [
        { 
          text: "Go to Login", 
          onPress: () => navigation.replace("auth/loginScreen")
        }
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Registration completion failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openCamera = () => {
    setShowCamera(true);
    setCaptureStep(0);
    setFaceDetected(false);
    setFacePosition('adjusting');
    setInstruction(instructions[0]);
  };

  // Simulate face detection for demo
  const simulateFaceDetection = () => {
    let step = 0;
    const simulationSteps = [
      "Position your face in the frame",
      "Move closer to the camera",
      "Center your face in the oval",
      "Keep your face straight",
      "Good! Hold still...",
      "Capturing your face..."
    ];

    const interval = setInterval(() => {
      if (step < simulationSteps.length - 1) {
        setInstruction(simulationSteps[step]);
        step++;
        
        if (step === 3) {
          setFaceDetected(true);
        }
        if (step === 4) {
          setFacePosition('perfect');
        }
      } else {
        clearInterval(interval);
        simulateFaceCapture();
      }
    }, 1500);
  };

  const simulateFaceCapture = async () => {
    setFaceLoading(true);
    setShowCamera(false);
    
    try {
      // Generate realistic face embedding
      const baseEmbedding = Array(128).fill(0).map(() => (Math.random() - 0.5) * 2);
      const normalizedEmbedding = normalizeVector(baseEmbedding);
      
      const res = await axios.post(`${BACKEND_BASE}/store-face`, {
        email: emailParam,
        faceEmbedding: normalizedEmbedding,
      });
      
      Alert.alert("Success ✅", "Face registered successfully!");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Face registration failed");
    } finally {
      setFaceLoading(false);
      setCaptureStep(0);
    }
  };

  const verifyFace = async () => {
    setFaceLoading(true);
    try {
      const baseEmbedding = Array(128).fill(0).map(() => (Math.random() - 0.5) * 2);
      const normalizedEmbedding = normalizeVector(baseEmbedding);
      const verificationEmbedding = normalizedEmbedding.map(val => 
        val + (Math.random() * 0.1 - 0.05)
      );
      
      const res = await axios.post(`${BACKEND_BASE}/verify-face`, {
        email: emailParam,
        faceEmbedding: verificationEmbedding,
      });
      
      if (res.data.verified) {
        Alert.alert(
          "Success ✅", 
          `Face verified successfully!\nSimilarity: ${(res.data.similarity * 100).toFixed(1)}%`
        );
      } else {
        Alert.alert(
          "Verification Failed", 
          `Low similarity: ${(res.data.similarity * 100).toFixed(1)}%\nPlease try again.`
        );
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Face verification failed");
    } finally {
      setFaceLoading(false);
    }
  };

  const normalizeVector = (vector) => {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  };

  const CameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      onRequestClose={() => setShowCamera(false)}
    >
      <View style={styles.cameraContainer}>
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Face Registration</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Simulation View */}
        <View style={styles.cameraPreview}>
          <View style={styles.simulationView}>
            <Text style={styles.simulationText}>Face Registration Simulation</Text>
            
            {/* Oval Guide */}
            <Animated.View 
              style={[
                styles.ovalGuide,
                { 
                  transform: [{ scale: pulseAnim }],
                  borderColor: facePosition === 'perfect' ? '#4CAF50' : '#FFFFFF'
                }
              ]} 
            />
            
            {/* Positioning Dots */}
            <View style={styles.positionDots}>
              <View style={[styles.dot, styles.dotTop]} />
              <View style={[styles.dot, styles.dotBottom]} />
              <View style={[styles.dot, styles.dotLeft]} />
              <View style={[styles.dot, styles.dotRight]} />
            </View>

            {/* Face Status Indicator */}
            <View style={styles.faceStatus}>
              <View style={[
                styles.statusIndicator,
                faceDetected ? styles.statusGood : styles.statusBad
              ]}>
                <Text style={styles.statusText}>
                  {faceDetected ? '✓ Face Detected' : 'No Face Detected'}
                </Text>
              </View>
            </View>

            <ActivityIndicator size="large" color={Colors.primaryColor} style={styles.simulationActivity} />
            <Text style={styles.simulationInstruction}>Follow the instructions below to simulate face registration</Text>
          </View>
        </View>

        {/* Instructions Section */}
        <View style={styles.instructionsContainer}>
          <Animated.Text 
            style={[
              styles.instructionText,
              { opacity: instructionAnim }
            ]}
          >
            {instruction}
          </Animated.Text>
          
          <View style={styles.progressSteps}>
            {[0, 1, 2].map((step) => (
              <View 
                key={step}
                style={[
                  styles.step,
                  captureStep === step && styles.stepActive,
                  captureStep > step && styles.stepCompleted
                ]}
              />
            ))}
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips for best results:</Text>
            <Text style={styles.tip}>• Ensure good lighting</Text>
            <Text style={styles.tip}>• Remove sunglasses or hats</Text>
            <Text style={styles.tip}>• Look directly at the camera</Text>
            <Text style={styles.tip}>• Keep a neutral expression</Text>
          </View>

          <TouchableOpacity 
            style={styles.captureButton}
            onPress={simulateFaceDetection}
          >
            <Text style={styles.captureButtonText}>
              Start Face Detection Simulation
            </Text>
          </TouchableOpacity>

          {captureStep === 2 && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.processingText}>Processing your face...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const VerificationBadge = ({ verified, text }) => (
    <View style={styles.badgeContainer}>
      <View style={[
        styles.badge, 
        verified ? styles.badgeVerified : styles.badgePending
      ]}>
        <Text style={styles.badgeText}>
          {verified ? "✅" : "⏳"} {text}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Verify Your Account</Text>
      <Text style={styles.subtitle}>Complete all verifications to activate your account</Text>

      {/* Verification Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Verification Status</Text>
        <VerificationBadge verified={verificationStatus.emailVerified} text="Email Verified" />
        <VerificationBadge verified={verificationStatus.phoneVerified} text="Phone Verified" />
        <VerificationBadge verified={verificationStatus.faceVerified} text="Face Verified" />
        
        {verificationStatus.allVerified && (
          <View style={styles.allVerifiedContainer}>
            <Text style={styles.allVerifiedText}>🎉 All Verifications Complete!</Text>
          </View>
        )}
      </View>

      {/* Email Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Email Verification</Text>
        <Text style={styles.label}>Code sent to: {emailParam}</Text>
        <TextInput
          keyboardType="numeric"
          style={[
            styles.input,
            verificationStatus.emailVerified && styles.inputDisabled
          ]}
          value={emailCode}
          onChangeText={setEmailCode}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor={Colors.grayColor}
          editable={!verificationStatus.emailVerified}
          maxLength={6}
        />
        <TouchableOpacity 
          style={[
            styles.btn, 
            (verificationStatus.emailVerified || loading) && styles.btnDisabled
          ]} 
          onPress={verifyEmail}
          disabled={verificationStatus.emailVerified || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.whiteColor} />
          ) : (
            <Text style={styles.btnText}>
              {verificationStatus.emailVerified ? "Email Verified ✅" : "Verify Email"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Phone Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Phone Verification</Text>
        <Text style={styles.label}>Code sent to: {phoneParam}</Text>
        <TextInput
          keyboardType="numeric"
          style={[
            styles.input,
            verificationStatus.phoneVerified && styles.inputDisabled
          ]}
          value={phoneCode}
          onChangeText={setPhoneCode}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor={Colors.grayColor}
          editable={!verificationStatus.phoneVerified}
          maxLength={6}
        />
        <TouchableOpacity 
          style={[
            styles.btn, 
            (verificationStatus.phoneVerified || loading) && styles.btnDisabled
          ]} 
          onPress={verifyPhone}
          disabled={verificationStatus.phoneVerified || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.whiteColor} />
          ) : (
            <Text style={styles.btnText}>
              {verificationStatus.phoneVerified ? "Phone Verified ✅" : "Verify Phone"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Face Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Face Verification</Text>
        
        {!verificationStatus.hasStoredFace && !verificationStatus.faceVerified && (
          <View>
            <Text style={styles.label}>Register your face for secure authentication</Text>
            <TouchableOpacity 
              style={styles.btn}
              onPress={openCamera}
              disabled={faceLoading}
            >
              {faceLoading ? (
                <ActivityIndicator color={Colors.whiteColor} />
              ) : (
                <Text style={styles.btnText}>Register Face (Simulation)</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {verificationStatus.hasStoredFace && !verificationStatus.faceVerified && (
          <View>
            <Text style={styles.label}>Face registered! Verify to complete:</Text>
            <TouchableOpacity 
              style={styles.btn}
              onPress={verifyFace}
              disabled={faceLoading}
            >
              {faceLoading ? (
                <ActivityIndicator color={Colors.whiteColor} />
              ) : (
                <Text style={styles.btnText}>Verify Face</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {verificationStatus.faceVerified && (
          <View>
            <Text style={styles.successText}>✅ Face Verified Successfully</Text>
          </View>
        )}
      </View>

      {/* Complete Registration */}
      <TouchableOpacity 
        style={[
          styles.completeBtn, 
          (!verificationStatus.allVerified || loading) && styles.btnDisabled
        ]} 
        onPress={completeRegistration}
        disabled={!verificationStatus.allVerified || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.whiteColor} />
        ) : (
          <Text style={styles.btnText}>
            {verificationStatus.allVerified ? "Complete Registration 🎉" : "Complete All Verifications First"}
          </Text>
        )}
      </TouchableOpacity>

      <CameraModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Sizes.fixPadding * 2,
    backgroundColor: Colors.bodyBackColor,
  },
  title: {
    ...Fonts.blackColor20SemiBold,
    marginBottom: Sizes.fixPadding,
    textAlign: "center",
  },
  subtitle: {
    ...Fonts.grayColor14Medium,
    textAlign: "center",
    marginBottom: Sizes.fixPadding * 2,
  },
  statusContainer: {
    backgroundColor: Colors.whiteColor,
    padding: Sizes.fixPadding * 1.5,
    borderRadius: 12,
    marginBottom: Sizes.fixPadding * 2,
    ...CommonStyles.shadow,
  },
  statusTitle: {
    ...Fonts.blackColor16Bold,
    marginBottom: Sizes.fixPadding,
  },
  badgeContainer: {
    marginBottom: Sizes.fixPadding,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeVerified: {
    backgroundColor: Colors.successLight,
  },
  badgePending: {
    backgroundColor: Colors.grayLight,
  },
  badgeText: {
    ...Fonts.blackColor14Medium,
  },
  allVerifiedContainer: {
    backgroundColor: Colors.successLight,
    padding: Sizes.fixPadding,
    borderRadius: 8,
    marginTop: Sizes.fixPadding,
  },
  allVerifiedText: {
    ...Fonts.successColor16Bold,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.whiteColor,
    padding: Sizes.fixPadding * 1.5,
    borderRadius: 12,
    marginBottom: Sizes.fixPadding * 2,
    ...CommonStyles.shadow,
  },
  sectionTitle: {
    ...Fonts.blackColor16Bold,
    marginBottom: Sizes.fixPadding,
  },
  label: {
    ...Fonts.grayColor15Medium,
    marginBottom: Sizes.fixPadding,
  },
  successText: {
    ...Fonts.successColor16Bold,
    textAlign: 'center',
    padding: Sizes.fixPadding,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: Sizes.fixPadding,
    backgroundColor: Colors.whiteColor,
    ...Fonts.blackColor16Medium,
  },
  inputDisabled: {
    backgroundColor: Colors.grayLight,
    borderColor: Colors.grayLight,
  },
  btn: {
    ...CommonStyles.button,
    marginTop: Sizes.fixPadding,
    height: 50,
    justifyContent: 'center',
  },
  completeBtn: {
    ...CommonStyles.button,
    backgroundColor: Colors.successColor,
    marginTop: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2,
    height: 50,
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: Colors.grayColor,
    opacity: 0.6,
  },
  btnText: {
    ...Fonts.whiteColor18Bold,
    textAlign: "center",
  },
  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.blackColor,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Sizes.fixPadding * 2,
    paddingTop: Sizes.fixPadding * 3,
    backgroundColor: Colors.blackColor,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    ...Fonts.whiteColor20Bold,
    fontSize: 24,
  },
  cameraTitle: {
    ...Fonts.whiteColor18Bold,
  },
  headerSpacer: {
    width: 30,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: Colors.blackColor,
  },
  simulationView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    padding: 20,
  },
  simulationText: {
    ...Fonts.whiteColor18Bold,
    marginBottom: 30,
    textAlign: 'center',
  },
  simulationInstruction: {
    ...Fonts.whiteColor14Medium,
    marginTop: 20,
    textAlign: 'center',
  },
  simulationActivity: {
    marginTop: 20,
  },
  ovalGuide: {
    width: 250,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  positionDots: {
    position: 'absolute',
    width: 250,
    height: 300,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dotTop: {
    top: 10,
    left: '50%',
    marginLeft: -4,
  },
  dotBottom: {
    bottom: 10,
    left: '50%',
    marginLeft: -4,
  },
  dotLeft: {
    left: 10,
    top: '50%',
    marginTop: -4,
  },
  dotRight: {
    right: 10,
    top: '50%',
    marginTop: -4,
  },
  faceStatus: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusGood: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  statusBad: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  statusText: {
    ...Fonts.whiteColor14Medium,
  },
  instructionsContainer: {
    padding: Sizes.fixPadding * 2,
    backgroundColor: Colors.blackColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  instructionText: {
    ...Fonts.whiteColor16Bold,
    textAlign: 'center',
    marginBottom: Sizes.fixPadding,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Sizes.fixPadding * 2,
  },
  step: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.grayColor,
    marginHorizontal: 5,
  },
  stepActive: {
    backgroundColor: Colors.primaryColor,
    transform: [{ scale: 1.2 }],
  },
  stepCompleted: {
    backgroundColor: Colors.successColor,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Sizes.fixPadding,
    borderRadius: 8,
    marginBottom: Sizes.fixPadding,
  },
  tipsTitle: {
    ...Fonts.whiteColor14Bold,
    marginBottom: 5,
  },
  tip: {
    ...Fonts.whiteColor12Medium,
    marginBottom: 2,
  },
  captureButton: {
    backgroundColor: Colors.primaryColor,
    padding: Sizes.fixPadding * 1.5,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    ...Fonts.whiteColor16Bold,
  },
  processingContainer: {
    alignItems: 'center',
    padding: Sizes.fixPadding * 2,
  },
  processingText: {
    ...Fonts.whiteColor16Medium,
    marginTop: Sizes.fixPadding,
  },
});

export default VerificationScreen;