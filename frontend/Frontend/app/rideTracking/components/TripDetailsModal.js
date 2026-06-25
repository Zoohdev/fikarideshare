import React, {
    useMemo,
    useRef,
  } from "react";
  
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
  } from "react-native";
  
  import BottomSheet from "@gorhom/bottom-sheet";
  
  import ShareRideButton from "./ShareRideButton";
  
  const TripDetailsModal = ({
    pickupAddress,
  destinationAddress,
  fare,
  trackingUrl,
  onCancelRide,

  bottomSheetRef,
  snapPoints,
  onClose,
  }) => {
  
    return (
        <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>
            Trip Details
          </Text>
  
          <Text style={styles.label}>
            Pickup
          </Text>
  
          <Text style={styles.value}>
            {pickupAddress}
          </Text>
  
          <Text style={styles.label}>
            Destination
          </Text>
  
          <Text style={styles.value}>
            {destinationAddress}
          </Text>
  
          <Text style={styles.label}>
            Fare
          </Text>
  
          <Text style={styles.fare}>
            ₹{fare}
          </Text>
  
          <ShareRideButton
            trackingUrl={
              trackingUrl
            }
          />
  
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancelRide}
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Cancel Ride
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  };
  
  export default TripDetailsModal;
  
  const styles =
    StyleSheet.create({
      content: {
        flex: 1,
        padding: 20,
      },
  
      heading: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 20,
      },
  
      label: {
        color: "#666",
        marginTop: 15,
      },
  
      value: {
        fontWeight: "600",
        marginTop: 5,
      },
  
      fare: {
        fontSize: 24,
        fontWeight: "700",
        marginVertical: 15,
      },
  
      cancelBtn: {
        marginTop: 20,
  
        borderRadius: 14,
  
        borderWidth: 1,
  
        borderColor: "#FF3B30",
  
        paddingVertical: 14,
  
        alignItems: "center",
      },
  
      cancelText: {
        color: "#FF3B30",
        fontWeight: "700",
      },
    });