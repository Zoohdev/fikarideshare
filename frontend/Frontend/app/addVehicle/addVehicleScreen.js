import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";
import api from "../../services/api";

const AddVehicleScreen = () => {
  const navigation = useNavigation();

  // Basic Details
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [seats, setSeats] = useState("4");
  const [vehicleType, setVehicleType] = useState("economy");
  
  // Documents & Photos
  const [documentImage, setDocumentImage] = useState(null);
  const [carPhotos, setCarPhotos] = useState({
    photo_front: null,
    photo_back: null,
    photo_side: null,
    photo_interior: null,
  });

  // UI State
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activePhotoKey, setActivePhotoKey] = useState(null); // 'document' or 'photo_front' etc.
  
  // Dynamic Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); 

  const vehicleTypeOptions = [
    { label: "Economy", value: "economy" },
    { label: "Comfort", value: "comfort" },
    { label: "Premium", value: "premium" },
    // { label: "XL (6+ Seats)", value: "xl" },
    // { label: "Electric", value: "electric" },
  ];

  const pickImage = async (useCamera = false) => {
    setShowImagePicker(false);
    let result;

    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    }

    if (!result.canceled) {
      const asset = result.assets[0];
      // Ensure we have a valid file extension for the server to recognize the MIME type
      const uri = asset.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`; // Default to jpeg if no extension found
    
      const file = { uri, name: filename, type };
    
      if (activePhotoKey === "document") {
        setDocumentImage(file);
      } else {
        setCarPhotos((prev) => ({ ...prev, [activePhotoKey]: file }));
      }
    }
    setActivePhotoKey(null);
  };

  const handleAddVehicle = async () => {
    if (!make || !model || !year || !licensePlate) {
      Alert.alert("Missing Details", "Please fill in all required fields.");
      return;
    }
  
    setIsLoading(true);
    setLoadingStep("Registering vehicle details...");
  
    try {
      // Create the FormData object
      const createData = new FormData();
      createData.append("make", make);
      createData.append("model", model);
      createData.append("year", year);
      createData.append("color", color);
      createData.append("license_plate", licensePlate);
      createData.append("vehicle_type", vehicleType);
      createData.append("seats", seats);
  
      // Append registration document if it exists
      if (documentImage) {
        const uri = documentImage.uri;
        const filename = uri.split("/").pop();
        createData.append("registration_document", {
          uri, 
          name: filename, 
          type: "image/jpeg"
        });
      }
  
      // Single request to create the vehicle
      await api.post("/vehicles/garage/", createData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      Alert.alert("Success", "Vehicle registered successfully!");
      navigation.goBack();
    } catch (error) {
      console.log("Registration Error:", error.response?.data || error.message);
      Alert.alert(
        "Registration Failed", 
        error.response?.data?.license_plate?.[0] || "Could not connect to server. Please try again."
      );
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Add vehicle"} navigation={navigation} />
        <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true}>
          
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {makeInfo()}
          {modelInfo()}
          {yearInfo()}
          {registerNoInfo()}
          {vehicleTypeDropdownInfo()}
          {vehicleColorInfo()}
          {seatOfferingInfo()}

          <Text style={styles.sectionTitle}>Required Documents</Text>
          {documentUploadBox()}

          {/* <Text style={styles.sectionTitle}>Vehicle Photos (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Sizes.fixPadding * 2.0 }}>
            {photoSlotBox("photo_front", "Front View")}
            {photoSlotBox("photo_back", "Back View")}
            {photoSlotBox("photo_side", "Side View")}
            {photoSlotBox("photo_interior", "Interior")}
          </ScrollView> */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
      {addButton()}
      {loadingOverlay()}
      {imagePickerModal()}
      {dropdownSelectionSheet()}
    </View>
  );

  // UI Components
  function loadingOverlay() {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={{ ...Fonts.blackColor16Medium, marginTop: Sizes.fixPadding * 2, textAlign: "center" }}>
            {loadingStep}
          </Text>
        </View>
      </View>
    );
  }

  function photoSlotBox(key, label) {
    const photo = carPhotos[key];
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { setActivePhotoKey(key); setShowImagePicker(true); }}
        style={styles.horizontalSlotFrame}
      >
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.horizontalSlotImage} resizeMode="cover" />
        ) : (
          <View style={styles.horizontalSlotPlaceholder}>
            <Ionicons name="car-outline" size={30} color={Colors.grayColor} />
          </View>
        )}
        <Text style={{ ...Fonts.blackColor14Medium, marginTop: 8 }}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function documentUploadBox() {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => { setActivePhotoKey("document"); setShowImagePicker(true); }} style={styles.vehicleImageWrapper}>
        {documentImage ? (
          <Image source={{ uri: documentImage.uri }} style={{ width: "100%", height: 120, borderRadius: Sizes.fixPadding }} resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="document-text-outline" color={Colors.grayColor} size={35} />
            <Text style={{ ...Fonts.grayColor14SemiBold, marginTop: 5 }}>Upload Registration Doc</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // (Include all previous input functions here: makeInfo, modelInfo, registerNoInfo, vehicleTypeDropdownInfo, etc. matching the previous code)
  function makeInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Make</Text>
        <View style={styles.valueBox}><TextInput placeholder="e.g. Toyota" style={styles.textFieldStyle} value={make} onChangeText={setMake} /></View>
      </View>
    );
  }
  function modelInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Model</Text>
        <View style={styles.valueBox}><TextInput placeholder="e.g. Camry" style={styles.textFieldStyle} value={model} onChangeText={setModel} /></View>
      </View>
    );
  }
  function yearInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Year</Text>
        <View style={styles.valueBox}><TextInput placeholder="e.g. 2022" keyboardType="numeric" style={styles.textFieldStyle} value={year} onChangeText={setYear} /></View>
      </View>
    );
  }
  function registerNoInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>License Plate</Text>
        <View style={styles.valueBox}><TextInput placeholder="Enter plate number" autoCapitalize="characters" style={styles.textFieldStyle} value={licensePlate} onChangeText={setLicensePlate} /></View>
      </View>
    );
  }
  function vehicleColorInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Color</Text>
        <View style={styles.valueBox}><TextInput placeholder="e.g. Black" style={styles.textFieldStyle} value={color} onChangeText={setColor} /></View>
      </View>
    );
  }
  function seatOfferingInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Seats</Text>
        <View style={styles.valueBox}><TextInput placeholder="e.g. 4" keyboardType="numeric" style={styles.textFieldStyle} value={seats} onChangeText={setSeats} /></View>
      </View>
    );
  }
  function vehicleTypeDropdownInfo() {
    const selectedItem = vehicleTypeOptions.find((o) => o.value === vehicleType);
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
        <Text style={{ ...Fonts.blackColor15SemiBold, marginBottom: Sizes.fixPadding }}>Vehicle type</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTypeDropdown(true)} style={[styles.valueBox, CommonStyles.rowAlignCenter, { justifyContent: "space-between" }]}>
          <Text style={selectedItem ? { ...Fonts.blackColor15Medium } : { ...Fonts.grayColor15Medium }}>{selectedItem ? selectedItem.label : "Select vehicle type"}</Text>
          <MaterialIcons name="keyboard-arrow-down" color={Colors.grayColor} size={24} />
        </TouchableOpacity>
      </View>
    );
  }

  function addButton() {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handleAddVehicle} disabled={isLoading} style={{ ...CommonStyles.button, marginVertical: Sizes.fixPadding * 2.0 }}>
        <Text style={{ ...Fonts.whiteColor18Bold }}>Complete Registration</Text>
      </TouchableOpacity>
    );
  }

  function imagePickerModal() {
    return (
      <Modal animationType="slide" transparent={true} visible={showImagePicker} onRequestClose={() => setShowImagePicker(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowImagePicker(false)} style={styles.modalOverlay}>
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <View style={styles.sheetStyle}>
              <Text style={{ ...Fonts.blackColor18SemiBold, marginBottom: Sizes.fixPadding }}>Select Source</Text>
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
    );
  }

  function dropdownSelectionSheet() {
    return (
      <Modal animationType="fade" transparent={true} visible={showTypeDropdown} onRequestClose={() => setShowTypeDropdown(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowTypeDropdown(false)} style={styles.modalOverlay}>
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <View style={styles.sheetStyle}>
              <Text style={{ ...Fonts.blackColor18SemiBold, marginBottom: Sizes.fixPadding }}>Select Vehicle Type</Text>
              {vehicleTypeOptions.map((item) => (
                <TouchableOpacity key={item.value} activeOpacity={0.7} onPress={() => { setVehicleType(item.value); setShowTypeDropdown(false); }} style={styles.dropdownOptionRow}>
                  <Text style={vehicleType === item.value ? { ...Fonts.primaryColor16Medium } : { ...Fonts.blackColor16Medium }}>{item.label}</Text>
                  {vehicleType === item.value && <MaterialIcons name="check" color={Colors.primaryColor} size={22} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
};

export default AddVehicleScreen;

const styles = StyleSheet.create({
  sectionTitle: { ...Fonts.blackColor16Bold, marginHorizontal: Sizes.fixPadding * 2, marginTop: Sizes.fixPadding * 2, marginBottom: Sizes.fixPadding },
  valueBox: { backgroundColor: Colors.whiteColor, paddingHorizontal: Sizes.fixPadding, paddingVertical: Sizes.fixPadding + 5.0, ...CommonStyles.shadow, borderRadius: Sizes.fixPadding },
  textFieldStyle: { ...Fonts.blackColor15Medium, height: 20.0, padding: 0 },
  vehicleImageWrapper: { backgroundColor: "#F5F5F5", borderRadius: Sizes.fixPadding, padding: Sizes.fixPadding * 2.0, marginHorizontal: Sizes.fixPadding * 2.0, alignItems: "center", justifyContent: "center", minHeight: 120, borderWidth: 1, borderColor: "#E0E0E0", borderStyle: "dashed" },
  horizontalSlotFrame: { width: 100, marginRight: Sizes.fixPadding * 1.5, alignItems: "center" },
  horizontalSlotPlaceholder: { width: 100, height: 100, backgroundColor: "#F5F5F5", borderRadius: Sizes.fixPadding, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E0E0E0", borderStyle: "dashed" },
  horizontalSlotImage: { width: 100, height: 100, borderRadius: Sizes.fixPadding },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  loadingOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loadingBox: { backgroundColor: Colors.whiteColor, padding: 30, borderRadius: 15, alignItems: "center", width: "80%" },
  sheetStyle: { backgroundColor: Colors.whiteColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  dropdownOptionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
  optionText: { ...Fonts.blackColor16Medium, marginLeft: 15 },
});