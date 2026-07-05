import BottomSheet, {
  BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { useNavigation, useRoute } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as Animatable from "react-native-animatable";
import DashedLine from "react-native-dashed-line";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { Key } from "../../constants/key";
import { MAP_THEME, TRIP_OVERVIEW_DELTA } from "../../constants/mapTheme";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes
} from "../../constants/styles";

const EndRideScreen = () => {

  const navigation = useNavigation();

  const [showMap, setShowMap] = useState(false);
  const routeData = useRoute();

const {
  trip_id,
  riders,
  sequence,
  route: tripRoute,
  eta,
  driver,
} = routeData.params || {};
const bottomSheetRef = useRef(null);

const snapPoints = useMemo(
  () => ["40%", "85%"],
  []
);
const passengersList =
  riders?.map((rider, index) => ({
    id:
      rider.riderId?.toString() ||
      index.toString(),

    profile: require(
      "../../assets/images/user/user3.png"
    ),

    name:
      rider.name || `Rider ${index + 1}`,
  })) || [];

  const routesList = [];

  // Ride Start
  routesList.push({
    id: "start",
  
    title: "Ride Start",
  
    address:
      riders?.[0]?.pickupAddress || "Pickup",
  
    coordinate: {
      latitude: Number(
        driver?.location?.latitude || 22.573856
      ),
  
      longitude: Number(
        driver?.location?.longitude || 88.243163
      ),
    },
  
    isPickDropPoint: false,
  
    status: "completed",
  });
  
  // Riders
  sequence?.forEach((step, index) => {
    // find rider details
    const riderData = riders?.find(
      (r) => r.riderId === step.riderId
    );
    routesList.push({

      id: `${step.type}-${index}`,
    
      title:
        `${index + 1}. ` +
        (
          step.type === "pickup"
            ? `Pick up ${step.name || "Rider"}`
            : `Drop ${step.name || "Rider"}`
        ),
    
      address:
        step.type === "pickup"
          ? riderData?.pickupAddress || "Pickup"
          : riderData?.destinationAddress || "Drop",
    
      coordinate: {
        latitude: Number(step.lat || 22.573856),
    
        longitude: Number(step.lng || 88.243163),
      },
    
      isPickDropPoint: true,
    
      isPickPoint: step.type === "pickup",
    
      type: step.type,
    });
  
  });
  
  // Ride End
  routesList.push({
    id: "end",
  
    title: "Ride End",
  
    address:
      riders?.[0]?.destinationAddress || "Drop",
  
    coordinate: {
      latitude: Number(
        riders?.[0]?.destination?.lat ||
        22.713856
      ),
  
      longitude: Number(
        riders?.[0]?.destination?.lng ||
        88.363163
      ),
    },
  
    isPickDropPoint: false,
  
    status: "not-completed",
  });


  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 1000);
    return () => { clearTimeout(timer) }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Roadmap"} navigation={navigation} />
        {directionInfo()}
        {rideInfoSheet()}
        {endRideButton()}
      </View>
    </View>
  );

  function endRideButton() {
    return (
      <View style={{ backgroundColor: Colors.whiteColor }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            navigation.push("rideComplete/rideCompleteScreen");
          }}
          style={{
            ...CommonStyles.button,
            marginVertical: Sizes.fixPadding * 2.0,
          }}
        >
          <Text style={{ ...Fonts.whiteColor18Bold }}>End ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

function rideInfoSheet() {

  return (

    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{
        backgroundColor:
          Colors.whiteColor,

        borderTopLeftRadius:
          Sizes.fixPadding * 4.0,

        borderTopRightRadius:
          Sizes.fixPadding * 4.0,
      }}
    >

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            Sizes.fixPadding * 10.0,
        }}
      >

        <Animatable.View
          animation="slideInUp"
          iterationCount={1}
          duration={1500}
        >

          <Text
            style={{
              ...Fonts.blackColor16SemiBold,
              textAlign: "center",
              margin:
                Sizes.fixPadding * 2.0,
            }}
          >
            Ride roadmap
          </Text>

          {passengersInfo()}

          {routesInfo()}

        </Animatable.View>

      </BottomSheetScrollView>

    </BottomSheet>
  );
}
  function routesInfo() {
    return (
      <View style={{ marginTop: Sizes.fixPadding * 2.0 }}>
        {routesList.map((item, index) => (
          <View
            key={`${item.id}`}
            style={{
              flexDirection: "row",
              marginHorizontal: Sizes.fixPadding * 2.0,
            }}
          >
            <View>
              {item.isPickDropPoint ? (
                <View
                  style={{
                    ...styles.sheetLocationIconWrapper,
                    borderColor:
                      item.status == "completed"
                        ? Colors.grayColor
                        : item.isPickPoint
                          ? Colors.greenColor
                          : Colors.redColor,
                  }}
                >
                  <MaterialIcons
                    name="location-pin"
                    color={
                      item.status == "completed"
                        ? Colors.grayColor
                        : item.isPickPoint
                          ? Colors.greenColor
                          : Colors.redColor
                    }
                    size={10}
                  />
                </View>
              ) : (
                <Image
                  source={require("../../assets/images/icons/car.png")}
                  style={{
                    ...styles.sheetCarImage,
                    tintColor:
                      item.status == "completed"
                        ? Colors.grayColor
                        : Colors.primaryColor,
                  }}
                />
              )}

              {index === routesList.length - 1 ? null : verticalDashLine()}
            </View>
            <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
              <Text numberOfLines={1} style={{ ...Fonts.grayColor14Medium }}>
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  ...Fonts.blackColor14Medium,
                  marginTop: Sizes.fixPadding - 8.0,
                }}
              >
                {item.address}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  function verticalDashLine() {
    return (
      <DashedLine
        axis="vertical"
        dashLength={3}
        dashColor={Colors.lightGrayColor}
        dashThickness={1}
        style={{
          height: 45.0,
          marginLeft: Sizes.fixPadding - 2.0,
        }}
      />
    );
  }

  function passengersInfo() {
    const renderItem = ({ item }) => (
      <View
        style={{
          alignItems: "center",
          width: 70.0,
          marginHorizontal: Sizes.fixPadding * 1.4,
        }}
      >
        <Image
          source={item.profile}
          style={{ width: 50.0, height: 50.0, borderRadius: 25.0 }}
        />
        <Text
          style={{
            ...Fonts.grayColor12Medium,
            textAlign: "center",
            marginTop: Sizes.fixPadding - 5.0,
          }}
        >
          {item.name}
        </Text>
      </View>
    );
    return (
      <FlatList
        data={passengersList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    );
  }

  function verticalDashLine() {
    return (
      <DashedLine
        axis="vertical"
        dashLength={3}
        dashColor={Colors.lightGrayColor}
        dashThickness={1}
        style={{
          height: 45.0,
          marginLeft: Sizes.fixPadding - 2.0,
        }}
      />
    );
  }

  function directionInfo() {
    return (
      <View style={{ flex: 1 }}>
        {showMap && <MapView
          provider={PROVIDER_GOOGLE}
          region={{
            latitude:
    routesList?.[0]?.coordinate?.latitude ||
    22.563643,

  longitude:
    routesList?.[0]?.coordinate?.longitude ||
    88.34588,
    latitudeDelta: TRIP_OVERVIEW_DELTA,
    longitudeDelta: TRIP_OVERVIEW_DELTA,
          }}
          style={{ flex: 1 }}
          customMapStyle={MAP_THEME}
          loadingEnabled
          loadingIndicatorColor={Colors.primaryColor}
        >
          {routesList.map((item, index) => {
            return (
              showMap && <Marker key={`${item.id}`} coordinate={item.coordinate}>
                {item.isPickDropPoint ? (
                  <View
                    style={{
                      ...styles.markerCircle,
                      borderColor:
                        item.status == "completed"
                          ? Colors.grayColor
                          : item.isPickPoint
                            ? Colors.greenColor
                            : Colors.redColor,
                    }}
                  >
                    <MaterialIcons
                      name="location-pin"
                      color={
                        item.status == "completed"
                          ? Colors.grayColor
                          : item.isPickPoint
                            ? Colors.greenColor
                            : Colors.redColor
                      }
                      size={14.0}
                    />
                  </View>
                ) : (
                  <Image
                    source={require("../../assets/images/icons/car.png")}
                    style={{ width: 20.0, height: 20.0, resizeMode: "contain" }}
                  />
                )}
              </Marker>
            );
          })}
          {routesList.map((item, index) => {
            return index !== routesList.length - 1 ? (
              <MapViewDirections
                key={`${item.id}`}
                origin={item.coordinate}
                destination={routesList[index + 1].coordinate}
                apikey={Key.apiKey}
                strokeColor={Colors.primaryColor}
                strokeWidth={3}
              />
            ) : null;
          })}
        </MapView>}
      </View>
    );
  }
};

export default EndRideScreen;

const styles = StyleSheet.create({
  bottomSheetWrapStyle: {
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: -Sizes.fixPadding,
    overflow: 'hidden'
  },
  locationIconWrapper: {
    width: 16.0,
    height: 16.0,
    borderRadius: 8.0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.0,
  },
  sheetLocationIconWrapper: {
    width: 16.0,
    height: 16.0,
    borderRadius: 8.0,
    borderWidth: 1.0,
    alignItems: "center",
    justifyContent: "center",
  },
  markerCircle: {
    width: 20.0,
    height: 20.0,
    borderRadius: 10.0,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.whiteColor,
  },
  sheetCarImage: {
    width: 16.0,
    height: 16.0,
    resizeMode: "contain",
  },
});
