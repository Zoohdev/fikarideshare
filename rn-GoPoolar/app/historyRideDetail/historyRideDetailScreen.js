import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes } from "../../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import DashedLine from "react-native-dashed-line";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const HistoryRideDetailScreen = () => {

  const navigation = useNavigation();

  const [showRateDialog, setshowRateDialog] = useState(false);
  const [rating, setrating] = useState(4);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Ride detail"} navigation={navigation} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {riderInfo()}
          {riderDetail()}
          {vehicleInfo()}
        </ScrollView>
      </View>
      {rateRideButton()}
      {giveRateDialog()}
    </View>
  );

  function giveRateDialog() {
    return (      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRateDialog}
        onRequestClose={() => { setshowRateDialog(false) }}
      >
        <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : null} style={{flex:1}}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setshowRateDialog(false) }}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <View style={{ justifyContent: "center", flex: 1 }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => { }}
                style={{ ...styles.dialogStyle }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  automaticallyAdjustKeyboardInsets={true}
                >
                  <View
                    style={{
                      marginHorizontal: Sizes.fixPadding * 2.0,
                      marginVertical: Sizes.fixPadding * 2.5,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Image
                        source={require("../../assets/images/rating.png")}
                        style={{ width: 90.0, height: 90.0, resizeMode: "contain" }}
                      />
                      <Text
                        style={{
                          ...Fonts.primaryColor17Bold,
                          marginTop: Sizes.fixPadding,
                        }}
                      >
                        Rate your ride
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginVertical: Sizes.fixPadding * 2.0,
                        }}
                      >
                        {ratingSort({ no: 1 })}
                        {ratingSort({ no: 2 })}
                        {ratingSort({ no: 3 })}
                        {ratingSort({ no: 4 })}
                        {ratingSort({ no: 5 })}
                      </View>
                    </View>
                    <TextInput
                      placeholder="Say something"
                      placeholderTextColor={Colors.grayColor}
                      style={styles.reviewFieldStyle}
                      multiline={true}
                      numberOfLines={5}
                      textAlignVertical="top"
                      cursorColor={Colors.primaryColor}
                      selectionColor={Colors.primaryColor}
                    />
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setshowRateDialog(false);
                      }}
                      style={{
                        ...CommonStyles.button,
                        marginHorizontal: 0,
                        marginTop: Sizes.fixPadding * 2.0,
                      }}
                    >
                      <Text style={{ ...Fonts.whiteColor18Bold }}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  function ratingSort({ no }) {
    return (
      <MaterialIcons
        name="star"
        color={rating >= no ? Colors.secondaryColor : Colors.lightGrayColor}
        size={40}
        onPress={() => setrating(no)}
        style={{ marginHorizontal: Sizes.fixPadding - 8.0 }}
      />
    );
  }

  function rateRideButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setshowRateDialog(true);
        }}
        style={{ ...CommonStyles.button, margin: Sizes.fixPadding * 2.0 }}
      >
        <Text style={{ ...Fonts.whiteColor18Bold }}>Rate your ride</Text>
      </TouchableOpacity>
    );
  }

  function vehicleInfo() {
    return (
      <View style={styles.vehicleInfoWrapper}>
        <Text style={{ ...Fonts.secondaryColor17SemiBold }}>Vehicle info</Text>
        <View style={{ marginVertical: Sizes.fixPadding + 5.0 }}>
          <Text style={{ ...Fonts.grayColor14SemiBold }}>Car model</Text>
          <Text
            style={{
              ...Fonts.blackColor14Medium,
              marginTop: Sizes.fixPadding - 7.0,
            }}
          >
            Toyota Matrix | KJ 5454 | Black colour
          </Text>
        </View>
        <View>
          <Text style={{ ...Fonts.grayColor14SemiBold }}>Facilities</Text>
          <Text
            style={{
              ...Fonts.blackColor14Medium,
              marginTop: Sizes.fixPadding - 7.0,
            }}
          >
            AC , Luggage space, Music system
          </Text>
        </View>
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
          <Text numberOfLines={1} style={{ ...Fonts.secondaryColor17SemiBold }}>
            Rider detail
          </Text>
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
              2715 Ash Dr. San Jose, South Dakota 83475
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
              1901 Thornridge Cir. Shiloh, Hawaii 81063
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
              25 June,09 :00AM
            </Text>
          </View>

          <View style={styles.verticalDivider}></View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor14SemiBold }}>
              Return time
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14SemiBold,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              25 june,09 :00PM
            </Text>
          </View>

          <View style={styles.verticalDivider}></View>

          <View style={{ flex: 0.7, alignItems: "center" }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor14SemiBold }}>
              Ride with
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Fonts.grayColor14SemiBold,
                marginTop: Sizes.fixPadding - 8.0,
              }}
            >
              150 people
            </Text>
          </View>
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
          source={require("../../assets/images/user/user9.png")}
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
            Jacob Jones
          </Text>
          <View
            style={{
              ...CommonStyles.rowAlignCenter,
              marginVertical: Sizes.fixPadding - 6.0,
            }}
          >
            <Text style={{ ...Fonts.grayColor14SemiBold }}>4.8</Text>
            <MaterialIcons
              name="star"
              color={Colors.secondaryColor}
              size={16}
            />
            <View style={styles.ratingAndReviewDivider}></View>
            <Text
              numberOfLines={1}
              style={{ ...Fonts.grayColor14SemiBold, flex: 1 }}
            >
              120 review
            </Text>
          </View>
          <Text numberOfLines={1} style={{ ...Fonts.grayColor14SemiBold }}>
            Join 2016
          </Text>
        </View>
        <Text style={{ ...Fonts.primaryColor18SemiBold }}>$15.00</Text>
      </View>
    );
  }
};

export default HistoryRideDetailScreen;

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
  vehicleInfoWrapper: {
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding + 5.0,
    marginVertical: Sizes.fixPadding * 2.0,
  },
  reviewFieldStyle: {
    ...Fonts.blackColor16Medium,
    ...CommonStyles.shadow,
    borderRadius: Sizes.fixPadding,
    backgroundColor: Colors.whiteColor,
    padding: Sizes.fixPadding,
    paddingTop: Sizes.fixPadding,
    height: 120.0,
  },
  dialogStyle: {
    width: "90%",
    alignSelf: 'center',
    borderRadius: Sizes.fixPadding,
    padding: 0,
    overflow: "hidden",
    backgroundColor: Colors.whiteColor
  },
});
