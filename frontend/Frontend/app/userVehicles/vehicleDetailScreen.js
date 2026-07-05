import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";
import api from "../../services/api";
  
  const VehicleDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const vehicleId = route.params?.vehicleId; 
  
    const [vehicle, setVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
  
    const [newPhotos, setNewPhotos] = useState({
      photo_front: null,
      photo_back: null,
      photo_side: null,
      photo_interior: null,
    });
  
    const [showImageSheet, setShowImageSheet] = useState(false);
    const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  
    useEffect(() => {
      if (vehicleId) fetchVehicleDetails();
    }, [vehicleId]);
  
    const fetchVehicleDetails = async () => {
      try {
        const response = await api.get(`/vehicles/garage/${vehicleId}/`);
        setVehicle(response.data);
      } catch (error) {
        Alert.alert("Error", "Could not load vehicle info.");
      } finally {
        setIsLoading(false);
      }
    };
  
    const pickImage = async (useCamera = false) => {
      setShowImageSheet(false);
      let result;
  
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      }
  
      if (!result.canceled && activePhotoSlot) {
        setNewPhotos((prev) => ({ ...prev, [activePhotoSlot]: result.assets[0] }));
      }
      setActivePhotoSlot(null);
    };
  
    const handleUploadPhotos = async () => {
      const changesPresent = Object.values(newPhotos).some((p) => p !== null);
      if (!changesPresent) return;
  
      setIsUploading(true);
      const formData = new FormData();
  
      Object.keys(newPhotos).forEach((key) => {
        const photoAsset = newPhotos[key];
        if (photoAsset) {
          const uri = photoAsset.uri;
          formData.append(key, { uri, name: uri.split("/").pop(), type: `image/${uri.split(".").pop()}` });
        }
      });
  
      try {
        await api.patch(`/vehicles/garage/${vehicleId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        Alert.alert("Success", "Photos updated successfully.");
        setNewPhotos({ photo_front: null, photo_back: null, photo_side: null, photo_interior: null });
        fetchVehicleDetails(); 
      } catch (error) {
        Alert.alert("Error", "Failed saving photos.");
      } finally {
        setIsUploading(false);
      }
    };
  
    if (isLoading) return <View style={styles.centeredView}><ActivityIndicator size="large" color={Colors.primaryColor} /></View>;
  
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
        <MyStatusBar />
        <View style={{ flex: 1 }}>
          <Header title={vehicle ? `${vehicle.make} Details` : "Details"} navigation={navigation} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {basicDetailsCard()}
            <Text style={styles.sectionHeading}>Manage Vehicle Photos</Text>
            <Text style={{ ...Fonts.grayColor13Medium, marginHorizontal: 20, marginBottom: 15 }}>Tap a photo to update it.</Text>
            <View style={styles.gridSection}>
              {photoSlotBox("photo_front", "Front View")}
              {photoSlotBox("photo_back", "Rear View")}
              {photoSlotBox("photo_side", "Side Profile")}
              {photoSlotBox("photo_interior", "Interior")}
            </View>
          </ScrollView>
        </View>
        {saveChangesButton()}
        
        <Modal animationType="slide" transparent={true} visible={showImageSheet} onRequestClose={() => setShowImageSheet(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setShowImageSheet(false)} style={styles.modalOverlay}>
            <View style={{ justifyContent: "flex-end", flex: 1 }}>
              <View style={styles.bottomSheet}>
                <Text style={{ ...Fonts.blackColor18SemiBold, marginBottom: Sizes.fixPadding }}>Update Photo</Text>
                <TouchableOpacity style={styles.optionRow} onPress={() => pickImage(true)}>
                  <MaterialIcons name="camera-alt" color={Colors.primaryColor} size={24} />
                  <Text style={styles.optionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow} onPress={() => pickImage(false)}>
                  <MaterialIcons name="photo" color={Colors.greenColor} size={24} />
                  <Text style={styles.optionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  
    function basicDetailsCard() {
      if (!vehicle) return null;
      return (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={{ ...Fonts.grayColor15Medium }}>Registration Plate</Text>
            <Text style={{ ...Fonts.blackColor16Bold }}>{vehicle.license_plate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ ...Fonts.grayColor15Medium }}>Type / Color</Text>
            <Text style={{ ...Fonts.blackColor15SemiBold }}>{vehicle.vehicle_type?.toUpperCase()}  •  {vehicle.color}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={{ ...Fonts.grayColor15Medium }}>DEKRA Status</Text>
            <Text style={{ ...Fonts.primaryColor15SemiBold }}>{vehicle.dekra_status?.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      );
    }
  
    function photoSlotBox(key, placeholder) {
      const currentTargetSource = newPhotos[key]?.uri || vehicle?.[key];
      return (
        <TouchableOpacity activeOpacity={0.8} style={styles.slotFrame} onPress={() => { setActivePhotoSlot(key); setShowImageSheet(true); }}>
          {currentTargetSource ? (
            <Image source={{ uri: currentTargetSource }} style={styles.slotImage} resizeMode="cover" />
          ) : (
            <View style={styles.slotPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={Colors.grayColor} />
              <Text style={{ ...Fonts.grayColor13Medium, marginTop: 4 }}>Add</Text>
            </View>
          )}
          <Text style={{ ...Fonts.blackColor14Medium, marginTop: 6, textAlign: "center" }}>{placeholder}</Text>
        </TouchableOpacity>
      );
    }
  
    function saveChangesButton() {
      const hasUnsavedChanges = Object.values(newPhotos).some((p) => p !== null);
      if (!hasUnsavedChanges) return null;
  
      return (
        <TouchableOpacity activeOpacity={0.8} style={styles.submitButton} onPress={handleUploadPhotos} disabled={isUploading}>
          {isUploading ? <ActivityIndicator color={Colors.whiteColor} size="small" /> : <Text style={{ ...Fonts.whiteColor18Bold }}>Upload Changes</Text>}
        </TouchableOpacity>
      );
    }
  };
  
  export default VehicleDetailScreen;
  
  const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bodyBackColor },
    sectionHeading: { ...Fonts.blackColor16SemiBold, marginHorizontal: Sizes.fixPadding * 2.0, marginTop: Sizes.fixPadding },
    infoCard: { backgroundColor: Colors.whiteColor, padding: 20, margin: 20, borderRadius: 15, ...CommonStyles.shadow },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
    gridSection: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
    slotFrame: { width: "47%", marginBottom: 20, alignItems: "center" },
    slotImage: { width: "100%", height: 120, borderRadius: 12 },
    slotPlaceholder: { width: "100%", height: 120, backgroundColor: "#F5F5F5", borderRadius: 12, borderStyle: "dashed", borderWidth: 1, borderColor: "#D0D0D0", justifyContent: "center", alignItems: "center" },
    submitButton: { ...CommonStyles.button, margin: 20 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    bottomSheet: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
    optionText: { ...Fonts.blackColor16Medium, marginLeft: 15 },
  });