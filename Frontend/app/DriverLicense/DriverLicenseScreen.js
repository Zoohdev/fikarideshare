import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { Colors, Sizes, Fonts, CommonStyles } from "../../constants/styles";
import { useNavigation } from 'expo-router';
const { width } = Dimensions.get('window');

// Shared Custom Color Palette Theme
const COLORS = {
  primary: '#2F80ED',
  secondary: '#1A1A1A',
  background: '#F9FAFC',
  cardBg: '#FFFFFF',
  textMain: '#2D3142',
  textMuted: '#9095A9',
  border: '#E4E7EB',
  success: '#27AE60',
  warning: '#F2994A', 
  danger: '#EB5757',
};

// Available driving classes for multi-select
const LICENSE_CLASSES = ['LMV', 'MCWG', 'MCWOG', 'HMV', 'TR'];

export default function DriverLicenseScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [licenseData, setLicenseData] = useState(null);
  const navigation = useNavigation();
  // Form State
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuingState, setIssuingState] = useState('');
  const [issueDate, setIssueDate] = useState(''); // Format: YYYY-MM-DD
  const [expiryDate, setExpiryDate] = useState(''); // Format: YYYY-MM-DD
  const [selectedClasses, setSelectedClasses] = useState(['LMV']);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);

  // Dynamic Country Selection State
  const [selectedCountry, setSelectedCountry] = useState('IN');

  const countryOptions = [
    { label: '🇮🇳 India (IN)', value: 'IN' },
    { label: '🇿🇦 South Africa (ZA)', value: 'ZA' },
    { label: '🇳🇬 Nigeria (NG)', value: 'NG' },
    { label: '🇰🇪 Kenya (KE)', value: 'KE' },
    { label: '🇪🇬 Egypt (EG)', value: 'EG' },
    { label: '🇺🇸 United States (US)', value: 'US' },
    { label: '🇬🇧 United Kingdom (GB)', value: 'GB' },
    { label: '🇦🇺 Australia (AU)', value: 'AU' },
  ];

  // 1. Fetch Existing Record
  const fetchLicenseStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kyc/license/');
      if (response.data && response.data.id) {
        setLicenseData(response.data);
      } else {
        setLicenseData(null);
      }
    } catch (error) {
      console.log('Error reading license status:', error.response?.data || error.message);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to retrieve your license status.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  // 2. Image Picker Handler
  const pickImage = async (side) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow camera roll access to upload your license.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (side === 'front') setFrontImage(result.assets[0]);
      if (side === 'back') setBackImage(result.assets[0]);
    }
  };

  // 3. Toggle License Class Selection
  const toggleClass = (cls) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  // 4. Submit Payload
  const handleSubmitLicense = async () => {
    if (!licenseNumber || !issueDate || !expiryDate || !frontImage) {
      Alert.alert('Missing Fields', 'Please fill out all required fields and upload the front image of your license.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('license_number', licenseNumber);
      
      // Now using the dynamic state variable
      formData.append('issuing_country', selectedCountry); 
      
      formData.append('issuing_state', issuingState);
      formData.append('issue_date', issueDate);
      formData.append('expiry_date', expiryDate);
      
      // The backend expects a JSON stringified array for JSONFields
      formData.append('license_classes', JSON.stringify(selectedClasses));

      // Append Front Image
      let frontUri = frontImage.uri;
      let frontFilename = frontUri.split('/').pop();
      let frontMatch = /\.(\w+)$/.exec(frontFilename);
      let frontType = frontMatch ? `image/${frontMatch[1]}` : `image/jpeg`;
      formData.append('front_image', { uri: frontUri, name: frontFilename, type: frontType });

      // Append Back Image (Optional)
      if (backImage) {
        let backUri = backImage.uri;
        let backFilename = backUri.split('/').pop();
        let backMatch = /\.(\w+)$/.exec(backFilename);
        let backType = backMatch ? `image/${backMatch[1]}` : `image/jpeg`;
        formData.append('back_image', { uri: backUri, name: backFilename, type: backType });
      }

      const response = await api.post('/kyc/license/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201 || response.status === 200) {
        Alert.alert('Success', 'Your driver license details have been securely uploaded.');
        fetchLicenseStatus(); // Refresh to show pending status
      }
    } catch (error) {
      console.log('Submission failed:', error.response?.data || error.message);
      const serverMessage = error.response?.data?.error || 'Failed to submit license details.';
      Alert.alert('Submission Error', serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Status Card UI
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return { text: 'Verified', color: COLORS.success, icon: 'checkmark-circle', bg: '#27AE6015' };
      case 'rejected':
      case 'expired':
        return { text: status === 'expired' ? 'Expired' : 'Rejected', color: COLORS.danger, icon: 'close-circle', bg: '#EB575715' };
      case 'pending':
      default:
        return { text: 'Under Review', color: COLORS.warning, icon: 'time', bg: '#FFF3E0' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching license profile...</Text>
      </View>
    );
  }

  const isProfileActive = !!(licenseData && licenseData.id);
  const statusConfig = getStatusConfig(licenseData?.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver's License</Text>
        <Text style={styles.headerSubtitle}>Professional operating credentials</Text>
      </View>

      {isProfileActive ? (
        /* STATUS SCREEN LAYOUT */
        <View style={styles.centerStatusWrapper}>
          <View style={styles.statusCard}>
            <View style={[styles.iconWrapper, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon} size={52} color={statusConfig.color} />
            </View>
            <Text style={styles.statusHeading}>Your status is {statusConfig.text}</Text>
            <Text style={styles.statusDescription}>
              {licenseData.status === 'verified' && 'Your driving license has been verified. You are authorized to operate.'}
              {licenseData.status === 'rejected' && 'We could not verify your driving license. Please ensure details match clearly.'}
              {licenseData.status === 'pending' && 'Our team is validating your license information against regional databases.'}
            </Text>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License No.</Text>
                <Text style={styles.detailValue}>{licenseData.license_number}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valid Until</Text>
                <Text style={styles.detailValue}>{licenseData.expiry_date}</Text>
              </View>
            </View>

            {(licenseData.status === 'rejected' || licenseData.status === 'expired') && (
              <TouchableOpacity style={styles.retryButton} onPress={() => setLicenseData(null)} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Upload New License</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
        style={{ 
          ...CommonStyles.button, 
          margin: Sizes.fixPadding * 2.0,
          backgroundColor:  Colors.secondaryColor ,
          width:'100%'
        }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Back</Text>
      </TouchableOpacity>
        </View>
      ) : (
        /* FORM SUBMISSION LAYOUT */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.bannerInfoGreen}>
            <Ionicons name="car-outline" size={24} color={COLORS.success} />
            <Text style={styles.bannerTextGreen}>
              Please provide clear photos and accurate dates. Blurred images will delay your verification.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>License Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. DL-1420110012345"
              placeholderTextColor="#A0AEC0"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />
          </View>

          {/* DYNAMIC ISSUING COUNTRY SELECTOR */}
          <Text style={[styles.inputLabel, { marginBottom: 8, marginTop: 4 }]}>Issuing Country *</Text>
          <View style={styles.listContainer}>
            {countryOptions.map((country) => {
              const isSelected = selectedCountry === country.value;
              return (
                <TouchableOpacity
                  key={country.value}
                  style={[styles.rowItem, isSelected && styles.rowItemSelected]}
                  onPress={() => setSelectedCountry(country.value)}
                >
                  <Text style={styles.rowItemText}>{country.label}</Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelectedOrange]}>
                    {isSelected && <View style={styles.radioInnerCircleOrange} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Issuing State</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Karnataka"
              placeholderTextColor="#A0AEC0"
              value={issuingState}
              onChangeText={setIssuingState}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Issue Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#A0AEC0"
                value={issueDate}
                onChangeText={setIssueDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Expiry Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#A0AEC0"
                value={expiryDate}
                onChangeText={setExpiryDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* License Classes multi-select */}
          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Vehicle Classes Allowed</Text>
          <View style={styles.chipContainer}>
            {LICENSE_CLASSES.map((cls) => {
              const isSelected = selectedClasses.includes(cls);
              return (
                <TouchableOpacity
                  key={cls}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleClass(cls)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cls}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Image Uploads */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Document Photos</Text>
          
          <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('front')} activeOpacity={0.8}>
            {frontImage ? (
              <Image source={{ uri: frontImage.uri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload Front of License *</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('back')} activeOpacity={0.8}>
            {backImage ? (
              <Image source={{ uri: backImage.uri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                <Text style={[styles.uploadText, { color: COLORS.textMuted }]}>Upload Back of License</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitLicense}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit License</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBackButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#4B5563" />
            <Text style={styles.bottomBackButtonText}>Go Back</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  centerStatusWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  bannerInfoGreen: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerTextGreen: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 16,
  },
  // Form Styles
  inputContainer: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textMain,
  },
  // Country Selector Styles
  listContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowItemSelected: {
    borderBottomColor: COLORS.border,
  },
  rowItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelectedOrange: {
    borderColor: COLORS.warning,
  },
  radioInnerCircleOrange: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.warning,
  },
  // Chips Styles
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Upload Card Styles
  uploadCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 140,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Button Styles
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Status Card (Reused from KYC)
  statusCard: {
    // backgroundColor: COLORS.cardBg,
    width: width * 0.88,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 10 },
    // shadowOpacity: 0.06,
    // shadowRadius: 20,
    // elevation: 5,
  },
  iconWrapper: {
    width: 120,
    height:120,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 6,
    marginBottom: 32,
  },
  detailsList: {
    width: '100%',
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7EB',
    width: '100%',
  },
  retryButton: {
    marginTop: 28,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  bottomBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
});