import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Platform,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import {
  Colors,
  Fonts,
  Sizes,
  CommonStyles,
  screenHeight,
} from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashedLine from "react-native-dashed-line";
import { useNavigation } from "expo-router";

const carsList = ["Mercedes-Benz", "Toyota matrix", "Audi A4"];

const seats = [...range(1, 8)];

function range(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

const OfferRideScreen = () => {

  const navigation = useNavigation();

  const [showCarSheet, setshowCarSheet] = useState(false);
  const [selectedCar, setselectedCar] = useState("");
  const [showNoOfSeatSheet, setshowNoOfSeatSheet] = useState(false);
  const [selectedSeat, setselectedSeat] = useState();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Offer ride"} navigation={navigation} />
        <ScrollView
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {locationInfo()}
          {priceInfo()}
          {carInfo()}
          {seatInfo()}
          {facilityInfo()}
        </ScrollView>
      </View>
      {continueButton()}
      {cardSheet()}
      {noOfSeatSheet()}
    </View>
  );

  function noOfSeatSheet() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNoOfSeatSheet}
        onRequestClose={() => { setshowNoOfSeatSheet(false) }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowNoOfSeatSheet(false) }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
            >
              <View style={{ ...styles.sheetStyle }}>
                <Text style={styles.sheetHeader}>No of seat</Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: Sizes.fixPadding * 2.0 }}
                >
                  <TouchableWithoutFeedback>
                    <View>
                      {seats.map((item, index) => (
                        <View key={`${index}`}>
                          <Text
                            onPress={() => {
                              setselectedSeat(item);
                              setshowNoOfSeatSheet(false);
                            }}
                            style={{
                              ...(selectedSeat == item
                                ? { ...Fonts.secondaryColor16SemiBold }
                                : { ...Fonts.blackColor16SemiBold }),
                              textAlign: "center",
                            }}
                          >
                            {item} Seat
                          </Text>
                          {index == seats.length - 1 ? null : (
                            <View
                              style={{
                                height: 1.0,
                                backgroundColor: Colors.lightGrayColor,
                                marginVertical: Sizes.fixPadding * 2.0,
                              }}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function cardSheet() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCarSheet}
        onRequestClose={() => { setshowCarSheet(false) }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setshowCarSheet(false) }}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
            >
              <View style={{ ...styles.sheetStyle }}>
                <Text style={styles.sheetHeader}>Select your car</Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: Sizes.fixPadding * 2.0 }}
                >
                  <TouchableWithoutFeedback>
                    <View>
                      {carsList.map((item, index) => (
                        <View key={`${index}`}>
                          <Text
                            onPress={() => {
                              setselectedCar(item);
                              setshowCarSheet(false);
                            }}
                            style={{
                              ...Fonts.blackColor15SemiBold,
                              textAlign: "center",
                            }}
                          >
                            {item}
                          </Text>
                          {index == carsList.length - 1 ? null : (
                            <View
                              style={{
                                backgroundColor: Colors.lightGrayColor,
                                height: 1.0,
                                marginVertical: Sizes.fixPadding * 2.0,
                              }}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function continueButton() {
    return (
      <View style={{ backgroundColor: Colors.bodyBackColor }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { navigation.push("confirmPooling/confirmPoolingScreen") }}
          style={{
            ...CommonStyles.button,
            marginVertical: Sizes.fixPadding * 2.0,
          }}
        >
          <Text style={{ ...Fonts.whiteColor18Bold }}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function facilityInfo() {
    return (
      <View
        style={{
          marginHorizontal: Sizes.fixPadding * 2.0,
          marginBottom: Sizes.fixPadding * 2.0,
        }}
      >
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Facility (i.e Ac, Music etc)
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Enter  facility"
            style={{
              ...Fonts.blackColor15Medium,
              height: 70.0,
              padding: 0,
            }}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }

  function seatInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Available seat
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setshowNoOfSeatSheet(true);
          }}
          style={{ ...styles.valueBox, ...CommonStyles.rowAlignCenter }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              ...(selectedSeat
                ? { ...Fonts.blackColor15Medium }
                : { ...Fonts.grayColor15Medium }),
            }}
          >
            {selectedSeat ? `${selectedSeat} Seat` : "Select available seat"}
          </Text>
          <Ionicons name="chevron-down" color={Colors.grayColor} size={20.5} />
        </TouchableOpacity>
      </View>
    );
  }

  function carInfo() {
    return (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Your car
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setshowCarSheet(true);
          }}
          style={{ ...styles.valueBox, ...CommonStyles.rowAlignCenter }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              ...(selectedCar
                ? { ...Fonts.blackColor15Medium }
                : { ...Fonts.grayColor15Medium }),
            }}
          >
            {selectedCar ? selectedCar : "Select your car"}
          </Text>
          <Ionicons name="chevron-down" color={Colors.grayColor} size={20.5} />
        </TouchableOpacity>
      </View>
    );
  }

  function priceInfo() {
    return (
      <View style={{ margin: Sizes.fixPadding * 2.0 }}>
        <Text
          style={{
            ...Fonts.blackColor15SemiBold,
            marginBottom: Sizes.fixPadding,
          }}
        >
          Price
        </Text>
        <View style={styles.valueBox}>
          <TextInput
            placeholder="Write price per seat"
            style={{
              ...Fonts.blackColor15Medium,
              height: 20.0,
              padding: 0,
            }}
            placeholderTextColor={Colors.grayColor}
            selectionColor={Colors.primaryColor}
            cursorColor={Colors.primaryColor}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  }

  function locationInfo() {
    return (
      <View style={styles.locationInfoWrapper}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ marginTop: Sizes.fixPadding + 5.0 }}>
            <View
              style={{
                ...styles.locationIconWrapper,
                borderColor: Colors.greenColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.greenColor}
                size={18}
              />
            </View>
            <DashedLine
              axis="vertical"
              dashLength={3}
              dashColor={Colors.grayColor}
              dashThickness={1}
              style={{
                height: 40.0,
                marginLeft: Sizes.fixPadding + 2.0,
              }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: Sizes.fixPadding + 5.0 }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor15SemiBold }}>
              Pick up location
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: Sizes.fixPadding - 8.0,
                ...Fonts.grayColor14Medium,
              }}
            >
              B 420 Broome station,New york, NY 100013, USA
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row" }}>
          <View>
            <DashedLine
              axis="vertical"
              dashLength={3}
              dashColor={Colors.grayColor}
              dashThickness={1}
              style={{
                height: 16.0,
                marginLeft: Sizes.fixPadding + 2.0,
              }}
            />
            <View
              style={{
                ...styles.locationIconWrapper,
                borderColor: Colors.redColor,
              }}
            >
              <MaterialIcons
                name="location-pin"
                color={Colors.redColor}
                size={18}
              />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: Sizes.fixPadding + 5.0 }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor15SemiBold }}>
              Destination location
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: Sizes.fixPadding - 8.0,
                ...Fonts.grayColor14Medium,
              }}
            >
              B 420 Broome station,New york, NY 100013, USA
            </Text>
          </View>
        </View>
      </View>
    );
  }
};

export default OfferRideScreen;

const styles = StyleSheet.create({
  locationIconWrapper: {
    width: 24.0,
    height: 24.0,
    borderRadius: 12.0,
    borderWidth: 1.0,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfoWrapper: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding,
    ...CommonStyles.shadow,
  },
  valueBox: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding + 5.0,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
  },
  sheetStyle: {
    backgroundColor: Colors.whiteColor,
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    paddingTop: Sizes.fixPadding * 2.0,
    maxHeight: screenHeight - 150,
  },
  sheetHeader: {
    marginHorizontal: Sizes.fixPadding * 2.0,
    textAlign: "center",
    ...Fonts.primaryColor16SemiBold,
    marginBottom: Sizes.fixPadding * 2.0,
  },
});
