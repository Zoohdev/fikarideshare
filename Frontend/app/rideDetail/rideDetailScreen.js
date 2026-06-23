import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import DashedLine from "react-native-dashed-line";
import Header from "../../components/header";
import { useLocalSearchParams, useNavigation } from "expo-router";
import api from "../../services/api";

const formatTime = (dateString) => {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


const RideDetailScreen = () => {

  const navigation = useNavigation();

  const { id } = useLocalSearchParams();

  const [showCancelDialog, setshowCancelDialog] = useState(false);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    api.get(`/rides/trips/${id}/`)
      .then((response) => setRide(response.data))
      .catch((error) => console.error("Error fetching ride detail:", error))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelRide = async () => {
    setshowCancelDialog(false);
    if (id) {
      try {
        await api.post(`/rides/trips/${id}/cancel/`, { reason: 'cancelled_by_rider' });
      } catch (error) {
        console.error("Error cancelling ride:", error);
      }
    }
    navigation.goBack();
    navigation.navigate('(tabs)', { screen: "rides/ridesScreen", params: { id: id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        {header()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {riderInfo()}
          {riderDetail()}
          
         
          
        </ScrollView>
      </View>
      {footer()}
      {cancelRideDialog()}
    </View>
  );

  function header() {
    return (
      <View style={{ justifyContent: "center" }}>
        <Header title={"Ride detail"} navigation={navigation} />
        {
          id
            ?
            <MaterialIcons
              name="call"
              color={Colors.whiteColor}
              size={20}
              style={{ position: "absolute", right: 20 }}
            />
            :
            null
        }
      </View>
    );
  }

  function cancelRideDialog() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCancelDialog}
        onRequestClose={() => { setshowCancelDialog(false) }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowCancelDialog(false) }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "center", flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
              style={{ ...styles.dialogStyle }}
            >
              <View>
                <View
                  style={{
                    marginVertical: Sizes.fixPadding * 2.5,
                    marginHorizontal: Sizes.fixPadding * 4.0,
                  }}
                >
                  <Text style={{ ...Fonts.blackColor16SemiBold, textAlign: "center" }}>
                    Are you sure you want to cancel your ride?
                  </Text>
                </View>
                <View style={{ ...CommonStyles.rowAlignCenter }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setshowCancelDialog(false);
                    }}
                    style={styles.dialogButton}
                  >
                    <Text style={{ ...Fonts.whiteColor18SemiBold }}>No</Text>
                  </TouchableOpacity>
                  <View style={{ backgroundColor: Colors.whiteColor, width: 2.0 }} />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCancelRide}
                    style={styles.dialogButton}
                  >
                    <Text style={{ ...Fonts.whiteColor18SemiBold }}>Yes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function footer() {
    return (
      <View style={styles.footer}>
        {
          id
            ?
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setshowCancelDialog(true);
              }}
              style={styles.cancelRideButton}
            >
              <Text numberOfLines={1} style={{ ...Fonts.primaryColor18Bold }}>
                Cancel ride
              </Text>
            </TouchableOpacity>
            :
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                navigation.push("confirmPooling/confirmPoolingScreen");
              }}
              style={{
                flex: 1,
                ...CommonStyles.button,
                marginHorizontal: Sizes.fixPadding,
              }}
            >
              <Text numberOfLines={1} style={{ ...Fonts.whiteColor18Bold }}>
                Request ride
              </Text>
            </TouchableOpacity>
        }

        
      </View>
    );
  }

  
  

  
  function riderDetail() {
    return (
      <View
        style={{
          backgroundColor: Colors.whiteColor,
          paddingVertical: Sizes.fixPadding + 5.0,
        }}
      >
        <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <Text
              numberOfLines={1}
              style={{ flex: 1, ...Fonts.secondaryColor17SemiBold }}
            >
              Rider detail
            </Text>
           
          </View>
        </View>
        <View
          style={{
            marginTop: Sizes.fixPadding + 5.0,
            marginHorizontal: Sizes.fixPadding * 2.0,
          }}
        >
          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <View
              style={{
                ...styles.locationIconWrapper,
                borderColor: Colors.greenColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.greenColor}
                size={15}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                ...Fonts.blackColor14Medium,
                marginHorizontal: Sizes.fixPadding,
              }}
            >
              {ride?.pickup_address || "Pickup address"}
            </Text>
          </View>

          <View style={styles.verticalDashedLine}></View>

          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <View
              style={{
                ...styles.locationIconWrapper,
                borderColor: Colors.redColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.redColor}
                size={15}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                ...Fonts.blackColor14Medium,
                marginHorizontal: Sizes.fixPadding,
              }}
            >
              {ride?.dropoff_address || "Dropoff address"}
            </Text>
          </View>
        </View>

        <DashedLine
          dashLength={3}
          dashThickness={1}
          dashColor={Colors.grayColor}
          style={{ marginVertical: Sizes.fixPadding + 5.0, overflow: "hidden" }}
        />

        <View
          style={{
            ...CommonStyles.rowAlignCenter,
            marginHorizontal: Sizes.fixPadding * 2.0,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor14SemiBold }}>
              Start time
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14SemiBold,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              {formatTime(ride?.started_at || ride?.requested_at)}
            </Text>
          </View>

          <View style={styles.verticalDivider}></View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor14SemiBold }}>
              Arrival time
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14SemiBold,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              {formatTime(ride?.completed_at)}
            </Text>
          </View>

          <View style={styles.verticalDivider}></View>

          
        </View>
      </View>
    );
  }

  function riderInfo() {
    return (
      <View
        style={{
          ...CommonStyles.rowAlignCenter,
          margin: Sizes.fixPadding * 2.0,
        }}
      >
        <Image
          source={require("../../assets/images/vehicle/vehicle1.png")}
          style={{
            width: 80.0,
            height: 80.0,
            borderRadius: Sizes.fixPadding - 5.0,
          }}
        />
        <View
          style={{
            flex: 1,
            marginHorizontal: Sizes.fixPadding,
          }}
        >
          <Text numberOfLines={1} style={{ ...Fonts.blackColor17SemiBold }}>
            {id
              ? (ride?.driver?.full_name || "Driver")
              : "request & wait"}
          </Text>
          <View
            style={{
              ...CommonStyles.rowAlignCenter,
              marginVertical: Sizes.fixPadding - 6.0,
            }}
          >

            <View style={styles.ratingAndReviewDivider}></View>

          </View>
          <Text numberOfLines={1} style={{ ...Fonts.grayColor14SemiBold }}>
            {ride?.status ? ride.status.replaceAll("_", " ") : "3 min"}
          </Text>
        </View>
        <Text style={{ ...Fonts.primaryColor18SemiBold }}>
          R{Number(ride?.final_fare ?? ride?.estimated_fare ?? 0).toFixed(2)}
        </Text>
      </View>
    );
  }
};

export default RideDetailScreen;

const styles = StyleSheet.create({
  ratingAndReviewDivider: {
    width: 1.0,
    backgroundColor: Colors.grayColor,
    height: "80%",
    marginHorizontal: Sizes.fixPadding - 5.0,
  },
  locationIconWrapper: {
    width: 22.0,
    height: 22.0,
    borderRadius: 11.0,
    borderWidth: 1.0,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalDashedLine: {
    height: 15.0,
    width: 1.0,
    borderStyle: "dashed",
    borderColor: Colors.grayColor,
    borderWidth: 0.8,
    marginLeft: Sizes.fixPadding + 1.0,
  },
  verticalDivider: {
    height: "100%",
    backgroundColor: Colors.lightGrayColor,
    width: 1.0,
    marginHorizontal: Sizes.fixPadding,
  },
  passengerInfoWrapper: {
    backgroundColor: Colors.whiteColor,
    marginVertical: Sizes.fixPadding * 2.0,
    paddingTop: Sizes.fixPadding + 5.0,
    paddingBottom: Sizes.fixPadding * 2.0,
  },
  vehicleInfoWrapper: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding + 5.0,
    marginVertical: Sizes.fixPadding * 2.0,
  },
  footer: {
    backgroundColor: Colors.bodyBackColor,
    paddingVertical: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding,
    ...CommonStyles.rowAlignCenter,
  },
  cancelRideButton: {
    flex: 1,
    ...CommonStyles.button,
    backgroundColor: Colors.whiteColor,
    marginHorizontal: Sizes.fixPadding,
    ...CommonStyles.shadow,
  },
  dialogButton: {
    flex: 1,
    backgroundColor: Colors.secondaryColor,
    alignItems: "center",
    justifyContent: "center",
    padding: Sizes.fixPadding + 2.0,
  },
  dialogStyle: {
    width: "80%",
    borderRadius: Sizes.fixPadding,
    padding: 0,
    overflow: "hidden",
    alignSelf: 'center',
    backgroundColor: Colors.whiteColor
  },
});
