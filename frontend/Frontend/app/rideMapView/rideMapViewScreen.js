import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors, Fonts, Sizes, screenHeight } from "../../constants/styles";
import MapViewDirections from "react-native-maps-directions";
import { Key } from "../../constants/key";
import { MAP_THEME, GOOGLE_MAP_ID } from "../../constants/mapTheme";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as Animatable from "react-native-animatable";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import DashedLine from "react-native-dashed-line";
import { useNavigation } from "expo-router";
import BottomSheet, {
  BottomSheetScrollView
} from "@gorhom/bottom-sheet";

const RideMapViewScreen = () => {

  const navigation = useNavigation();

  const [showMap, setShowMap] = useState(false);

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
        <Header title={"Map view"} navigation={navigation} />
        {directionInfo()}
        {rideInfoSheet()}
      </View>
    </View>
  );

  function rideInfoSheet() {
    return (
      // <BottomSheet
      //   isOpen={false}
      //   sliderMinHeight={350}
      //   sliderMaxHeight={screenHeight - 150.0}
      //   lineContainerStyle={{ height: 0.0 }}
      //   lineStyle={{ height: 0.0 }}
      //   wrapperStyle={{ paddingHorizontal: 0, }}
      //   outerContentStyle={{ ...styles.bottomSheetWrapStyle }}
      // >
      <BottomSheet
  style={{
    height: 380,
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    overflow: "hidden",
  }}
>
        {(onScrollEndDrag) => (
          <ScrollView
            onScrollEndDrag={onScrollEndDrag}
            contentContainerStyle={{ paddingBottom: Sizes.fixPadding * 2.0, overflow: 'hidden' }}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View
              animation="slideInUp"
              iterationCount={1}
              duration={1500}
              style={{ paddingHorizontal: Sizes.fixPadding * 2.0, }}
            >
              <Text
                style={{
                  ...Fonts.blackColor16SemiBold,
                  textAlign: "center",
                  margin: Sizes.fixPadding * 2.0,
                }}
              >
                Ride start on 25 june 2023
              </Text>

              <View style={{ flexDirection: "row" }}>
                <View>
                  <View style={{ width: 16.0, alignItems: "center" }}>
                    <Image
                      source={require("../../assets/images/icons/car.png")}
                      style={{
                        width: 16.0,
                        height: 16.0,
                        resizeMode: "contain",
                      }}
                    />
                  </View>
                  {verticalDashLine()}
                </View>
                <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
                  <Text
                    numberOfLines={1}
                    style={{ ...Fonts.grayColor14Medium }}
                  >
                    Ride start
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...Fonts.blackColor14Medium,
                      marginTop: Sizes.fixPadding - 8.0,
                    }}
                  >
                    2715 Ash Dr. San Jose, South Dakota 83475
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <View>
                  <View
                    style={{
                      ...styles.locationIconWrapper,
                      borderColor: Colors.redColor,
                    }}
                  >
                    <MaterialIcons
                      name="location-pin"
                      color={Colors.redColor}
                      size={12}
                    />
                  </View>
                  {verticalDashLine()}
                </View>
                <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
                  <Text numberOfLines={1} style={{ ...Fonts.redColor14Medium }}>
                    Pick up point (10:00 am)
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...Fonts.blackColor14Medium,
                      marginTop: Sizes.fixPadding - 8.0,
                    }}
                  >
                    2715 Ash Dr. San Jose, South Dakota 83475
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <View>
                  <View style={{ width: 16.0, alignItems: "center" }}>
                    <Image
                      source={require("../../assets/images/icons/car.png")}
                      style={{
                        width: 16.0,
                        height: 16.0,
                        resizeMode: "contain",
                      }}
                    />
                  </View>
                  {verticalDashLine()}
                </View>
                <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
                  <Text
                    numberOfLines={1}
                    style={{ ...Fonts.grayColor14Medium }}
                  >
                    Drive
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...Fonts.blackColor14Medium,
                      marginTop: Sizes.fixPadding - 8.0,
                    }}
                  >
                    2715 Ash Dr. San Jose, South Dakota 83475
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <View>
                  <View
                    style={{
                      ...styles.locationIconWrapper,
                      borderColor: Colors.primaryColor,
                    }}
                  >
                    <MaterialIcons
                      name="location-pin"
                      color={Colors.primaryColor}
                      size={12}
                    />
                  </View>
                  {verticalDashLine()}
                </View>
                <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
                  <Text
                    numberOfLines={1}
                    style={{ ...Fonts.primaryColor14Medium }}
                  >
                    Destination point (11:00 am)
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...Fonts.blackColor14Medium,
                      marginTop: Sizes.fixPadding - 8.0,
                    }}
                  >
                    2715 Ash Dr. San Jose, South Dakota 83475
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <View style={{ width: 16.0, alignItems: "center" }}>
                  <Image
                    source={require("../../assets/images/icons/car.png")}
                    style={{ width: 16.0, height: 16.0, resizeMode: "contain" }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Sizes.fixPadding }}>
                  <Text
                    numberOfLines={1}
                    style={{ ...Fonts.grayColor14Medium }}
                  >
                    Ride end
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...Fonts.blackColor14Medium,
                      marginTop: Sizes.fixPadding - 8.0,
                    }}
                  >
                    2715 Ash Dr. San Jose, South Dakota 83475
                  </Text>
                </View>
              </View>
            </Animatable.View>
          </ScrollView>
        )}
      </BottomSheet>
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
    const startPoint = {
      latitude: 22.573856,
      longitude: 88.243163,
    };

    const pickupPoint = {
      latitude: 22.553686,
      longitude: 88.314735,
    };

    const currentPoint = {
      latitude: 22.583686,
      longitude: 88.401745,
    };

    const destinationPoint = {
      latitude: 22.64978,
      longitude: 88.41377,
    };

    const endPoint = {
      latitude: 22.70668,
      longitude: 88.41377,
    };

    return (
      <View style={{ height: '100%' }}>
        {showMap && <MapView
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: 22.493643,
            longitude: 88.35588,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }}
          style={{ height: "100%" }}
          mapId={GOOGLE_MAP_ID}
          customMapStyle={MAP_THEME}
          loadingEnabled
          loadingIndicatorColor={Colors.primaryColor}
        >
          <MapViewDirections
            origin={startPoint}
            destination={pickupPoint}
            apikey={Key.apiKey}
            strokeColor={Colors.primaryColor}
            strokeWidth={3}
          />
          <MapViewDirections
            origin={pickupPoint}
            destination={currentPoint}
            apikey={Key.apiKey}
            strokeColor={Colors.primaryColor}
            strokeWidth={3}
          />
          <MapViewDirections
            origin={currentPoint}
            destination={destinationPoint}
            apikey={Key.apiKey}
            strokeColor={Colors.primaryColor}
            strokeWidth={3}
          />
          <MapViewDirections
            origin={destinationPoint}
            destination={endPoint}
            apikey={Key.apiKey}
            strokeColor={Colors.primaryColor}
            strokeWidth={3}
          />
          <Marker coordinate={startPoint}>
            <Image
              source={require("../../assets/images/icons/car.png")}
              style={{ width: 35.0, height: 35.0, resizeMode: "contain" }}
            />
          </Marker>
          <Marker coordinate={pickupPoint}>
            <View
              style={{
                ...styles.markerCircle,
                borderColor: Colors.redColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.redColor}
                size={20.0}
              />
            </View>
          </Marker>
          <Marker coordinate={currentPoint}>
            <View
              style={{
                backgroundColor: Colors.secondaryColor,
                padding: Sizes.fixPadding - 5.0,
                borderRadius: 5.0,
              }}
            >
              <Text style={{ ...Fonts.whiteColor13SemiBold }}>42 km</Text>
            </View>
          </Marker>
          <Marker coordinate={destinationPoint}>
            <View
              style={{
                ...styles.markerCircle,
                borderColor: Colors.primaryColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.primaryColor}
                size={20.0}
              />
            </View>
          </Marker>
          <Marker coordinate={endPoint}>
            <Image
              source={require("../../assets/images/icons/car.png")}
              style={{ width: 35.0, height: 35.0, resizeMode: "contain" }}
            />
          </Marker>
        </MapView>}
      </View>
    );
  }
};

export default RideMapViewScreen;

const styles = StyleSheet.create({
  bottomSheetWrapStyle: {
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    backgroundColor: Colors.whiteColor,
    overflow: 'hidden',   
  },
  locationIconWrapper: {
    width: 16.0,
    height: 16.0,
    borderRadius: 8.0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.0,
  },
  markerCircle: {
    width: 32.0,
    height: 32.0,
    borderRadius: 16.0,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.whiteColor,
  },
});
