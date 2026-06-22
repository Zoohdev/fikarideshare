import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Colors, Sizes, Fonts, CommonStyles } from "../../constants/styles";
import { useNavigation } from 'expo-router';
const { width } = Dimensions.get('window');

// Custom Color Palette Theme
const COLORS = {
  primary: '#2F80ED',     
  secondary: '#1A1A1A',   
  background: '#F9FAFC',  
  cardBg: '#FFFFFF',      
  textMain: '#2D3142',    
  textMuted: '#9095A9',   
  border: '#E4E7EB',      
  success: '#27AE60',     
  warning: '#F2994A', // Orange theme accent 
  danger: '#EB5757',      
};

export default function KYCIdentityScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState(null);
  const navigation = useNavigation();
  const [selectedDocType, setSelectedDocType] = useState('national_id');
  const [selectedCountry, setSelectedCountry] = useState('IN');

  const documentOptions = [
    { label: 'National ID Card', value: 'national_id', icon: 'card-outline' },
    { label: 'Passport', value: 'passport', icon: 'book-outline' },
    { label: 'Driving License', value: 'driving_license', icon: 'car-outline' },
    { label: 'Residence Permit', value: 'residence_permit', icon: 'document-text-outline' },
  ];

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

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kyc/identity/'); 
      setKycData(response.data);
    } catch (error) {
      console.log('Error reading identity status:', error.response?.data || error.message);
      // If it's a 404, it means no profile exists yet, which is fine (shows submission form)
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to retrieve your current verification status.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleSubmitKyc = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document_type', selectedDocType);
      formData.append('document_country', selectedCountry);
      console.log("data",formData)
      const response = await api.post('/kyc/identity/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201 || response.status === 200) {
        Alert.alert('Success', 'Your identification details have been uploaded.');
        fetchKycStatus();
      }
    } catch (error) {
      console.log('Submission failed:', error.response?.data || error.message);
      const serverMessage = error.response?.data?.error || 'Please try again later.';
      Alert.alert('Submission Error', serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { text: 'Verified', color: COLORS.success, icon: 'checkmark-circle', bg: '#27AE6015' };
      case 'in_progress':
      case 'awaiting_review':
      case 'pending':
        return { text: 'Under Review', color: COLORS.warning, icon: 'time', bg: '#FFF3E0' }; // Solid soft orange pending image container
      case 'rejected':
        return { text: 'Rejected', color: COLORS.danger, icon: 'close-circle', bg: '#EB575715' };
      default:
        return { text: 'Pending Action', color: COLORS.warning, icon: 'alert-circle', bg: '#FFF3E0' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.warning} />
        <Text style={styles.loadingText}>Fetching verification profile...</Text>
      </View>
    );
  }

  const isProfileActive = !!(kycData && kycData.id); 
  const statusConfig = getStatusConfig(kycData?.status);

  // Accurate matching logic to lookup label text instead of backend database slugs
  const displayDocType = kycData?.document_type 
    ? documentOptions.find(o => o.value === kycData.document_type)?.label || kycData.document_type.replace('_', ' ').toUpperCase()
    : 'Not Selected';

  const displayCountry = kycData?.document_country 
    ? countryOptions.find(o => o.value === kycData.document_country)?.label || kycData.document_country
    : 'Not Specified';

  const displayRejectionReason = kycData?.rejection_reasons?.join(', ') || 'Document details unclear.';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <Text style={styles.headerSubtitle}>KYC security compliance checkpoint</Text>
      </View>

      {isProfileActive ? (
        /* STATUS SCREEN LAYOUT - Clean, outline-free, centered */
        <View style={styles.centerStatusWrapper}>
          <View style={styles.statusCard}>
            
            {/* Soft background icon container with orange pending asset fallback */}
            <View style={[styles.iconWrapper, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon} size={52} color={statusConfig.color} />
            </View>
            
            <Text style={styles.statusHeading}>Your status is {statusConfig.text}</Text>
            
            <Text style={styles.statusDescription}>
              {kycData.status === 'approved' && 'Your identification records are completely cleared. You are clear to access full services.'}
              {kycData.status === 'rejected' && `Submission failed. Reason: ${displayRejectionReason}`}
              {kycData.status !== 'approved' && kycData.status !== 'rejected' && 'Our background service engine is validating your submission information. This usually takes a few minutes.'}
            </Text>

            {/* Seamless layout block replacing boxed wireframes */}
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Document Class</Text>
                <Text style={styles.detailValue}>{displayDocType}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Region Country</Text>
                <Text style={styles.detailValue}>{displayCountry}</Text>
              </View>
            </View>

            {kycData.status === 'rejected' && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => setKycData(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Re-submit Document</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Core bottom layout Go Back handler */}
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
        /* FORM INPUT SELECTION LAYOUT */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.bannerInfoGreen}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.success} />
              <Text style={styles.bannerTextGreen}>
                To maintain standard driver and rider trust networks, please declare your registration origin parameters.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>1. Choose Document Type</Text>
            <View style={styles.gridContainer}>
              {documentOptions.map((doc) => {
                const isSelected = selectedDocType === doc.value;
                return (
                  <TouchableOpacity
                    key={doc.value}
                    style={[styles.gridCard, isSelected && styles.gridCardSelectedOrange]}
                    onPress={() => setSelectedDocType(doc.value)}
                  >
                    <Ionicons 
                      name={doc.icon} 
                      size={26} 
                      color={isSelected ? COLORS.warning : COLORS.textMuted} 
                    />
                    <Text style={[styles.gridCardText, isSelected && styles.gridCardTextSelectedOrange]}>
                      {doc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>2. Issuing Country Territory</Text>
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

            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitKyc}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.submitButtonText}>Submit Verification Profile</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bottomBackButton, { marginTop: 24 }]} 
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color="#4B5563" />
              <Text style={styles.bottomBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 60,
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
  formContainer: {
    width: '100%',
  },
  bannerInfoGreen: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  gridCardSelectedOrange: {
    borderColor: COLORS.warning,
    backgroundColor: '#FFF9F2',
  },
  gridCardText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  gridCardTextSelectedOrange: {
    color: COLORS.warning,
    fontWeight: '600',
  },
  listContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 35,
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
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusCard: {
    // backgroundColor: COLORS.cardBg,
    width: width * 0.88, // Proportional scaling container size
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    // Dynamic soft background shadows instead of hard wireframe borders
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 10 },
    // shadowOpacity: 0.06,
    // shadowRadius: 20,
    // elevation: 5,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusHeading: {
    fontSize: 24,
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
    backgroundColor: '#f4f5f7', // Embedded subtle data plate background
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
    backgroundColor: COLORS.danger,
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
    marginTop: 28,
  },
  bottomBackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
});