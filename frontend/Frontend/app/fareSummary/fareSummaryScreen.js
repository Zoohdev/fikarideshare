import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../../services/api';

export default function FareSummaryScreen() {
    const { fare, rideId, role } = useLocalSearchParams();
    const router = useRouter();
    const { handleNextAction } = useStripe();
    const isDriver = role === 'driver';
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);

    const handlePayment = async () => {
        if (!rideId) {
            Alert.alert("Error", "We couldn't tell which ride this fare is for.");
            return;
        }

        setPaying(true);
        try {
            const response = await api.post('/payments/charge/', { amount: fare, ride_id: rideId });

            if (response.status === 202) {
                const { error } = await handleNextAction(response.data.client_secret);
                if (error) {
                    Alert.alert("Authentication failed", error.message || "Please try a different card from your wallet.");
                    return;
                }
                // 3D-Secure cleared - the backend's payment webhook captures
                // the now-authorized charge server-side.
            }

            setPaid(true);
        } catch (error) {
            console.error("Error charging ride fare:", error);
            Alert.alert("Payment failed", error.response?.data?.error || "Could not charge your saved card. Add a payment method and try again.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                <Animated.View style={[styles.successIcon, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark-circle" size={100} color="#10b981" />
                </Animated.View>

                <Animated.Text style={[styles.headerText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    Ride Completed!
                </Animated.Text>

                <Animated.Text style={[styles.subText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {isDriver
                        ? "Nice work. Here's what this trip earned."
                        : "Thank you for riding with us. Here is your final summary."}
                </Animated.Text>

                <Animated.View style={[styles.fareCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.fareLabel}>{isDriver ? "Trip Fare" : "Total Amount Due"}</Text>
                    <Text style={styles.fareAmount}>R {parseFloat(fare || 0).toFixed(2)}</Text>
                    <View style={styles.divider} />
                    <View style={styles.fareRow}>
                        <Text style={styles.fareRowText}>Payment Method</Text>
                        <Text style={styles.fareRowValue}>{paid ? "Card - Paid" : "Saved card"}</Text>
                    </View>
                </Animated.View>

            </View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                {isDriver || paid ? (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => router.replace(isDriver ? '/(driverTabs)/home/homeScreen' : '/(tabs)/home/homeScreen')}
                    >
                        <Text style={styles.payButtonText}>{paid ? "Done" : "Back to home"}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={paying}>
                        {paying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.payButtonText}>Proceed to Payment</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    successIcon: { marginBottom: 20, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    headerText: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
    subText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
    fareCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
    fareLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    fareAmount: { fontSize: 54, fontWeight: '900', color: '#FF8811', marginBottom: 20 },
    divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginBottom: 20 },
    fareRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fareRowText: { fontSize: 15, color: '#475569', fontWeight: '500' },
    fareRowValue: { fontSize: 15, color: '#0f172a', fontWeight: '800' },
    footer: { padding: 24, paddingBottom: 40 },
    payButton: { backgroundColor: '#0f172a', flexDirection: 'row', paddingVertical: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }
});