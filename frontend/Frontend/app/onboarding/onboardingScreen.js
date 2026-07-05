import { useFocusEffect, useNavigation } from "expo-router";
import React, { createRef, useCallback, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MyStatusBar from "../../components/myStatusBar";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
  screenHeight,
  screenWidth,
} from "../../constants/styles";

const onboardingScreenList = [
  {
    id: "1",
    onboardingImage: require("../../assets/images/onboarding/onboarding1.png"),
    onboardingTitle: "Your ride your route",
    onboardingDescription:
      "If you are dealing with traffic or a busy schedule, our premium service is designed for you. We understand the weight of a stressful commute, which is why we offer a smooth ride. Just tell us where you need to go, and we will navigate the river of city traffic to get you there safely.",
  },
  {
    id: "2",
    onboardingImage: require("../../assets/images/onboarding/onboarding2.png"),
    onboardingTitle: "Fast and reliable",
    onboardingDescription:
      "Riding with us is simple and straightforward. Our app connects you with a driver quickly, so you can get to your destination without any hassle. Whether you're heading home or to a meeting, we provide the smooth journey you deserve.",
  },
  {
    id: "3",
    onboardingImage: require("../../assets/images/onboarding/onboarding3.png"),
    onboardingTitle: "Pay for just the seat",
    onboardingDescription:
     "Getting started with your journey is easy when you choose the right ride. Our committed drivers are ready to take the wheel and handle the stress of the road so you don't have to. Whether you are heading to work or returning home, the path is clear and the ride is prepared for you.",
  },
];

const OnboardingScreen = () => {

  const navigation = useNavigation();

  const backAction = () => {
    backClickCount == 1 ? BackHandler.exitApp() : _spring();
    return true;
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     BackHandler.addEventListener("hardwareBackPress", backAction);
  //     return () => {
  //       BackHandler.removeEventListener("hardwareBackPress", backAction);
  //     };
  //   }, [backAction])
  // );
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
  
      return () => {
        subscription.remove();
      };
    }, [backAction])
  );

  function _spring() {
    setBackClickCount(1);
    setTimeout(() => {
      setBackClickCount(0);
    }, 1000);
  }

  const listRef = createRef();
  const [backClickCount, setBackClickCount] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(0);

  const scrollToIndex = ({ index }) => {
    listRef.current.scrollToIndex({ animated: true, index: index });
    setCurrentScreen(index);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        {onboardingScreenContent()}
        {currentScreen == 2 ? null : skipText()}
        {indicatorWithButton()}
      </View>
      {exitInfo()}
    </View>
  );

  function skipText() {
    return (
      <Text
        onPress={() => { navigation.push("auth/loginScreen") }}
        style={styles.skipTextStyle}
      >
        Skip
      </Text>
    );
  }

  function indicatorWithButton() {
    return (
      <View style={styles.indicatorWithButtonWrapStyle}>
        {indicators()}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            currentScreen == 2
              ? navigation.push("auth/loginScreen")
              : scrollToIndex({ index: currentScreen + 1 });
          }}
          style={{
            ...CommonStyles.button,
            marginVertical: Sizes.fixPadding * 4.0,
          }}
        >
          <Text style={{ ...Fonts.whiteColor18Bold }}>
            {currentScreen == 2 ? "Login" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function indicators() {
    return (
      <View
        style={{
          ...CommonStyles.rowAlignCenter,
          justifyContent: "center",
          marginBottom: Sizes.fixPadding * 3.5,
        }}
      >
        {onboardingScreenList.map((item, index) => {
          return (
            <View
              key={`${item.id}`}
              style={{
                ...(currentScreen == index
                  ? styles.selectedIndicatorStyle
                  : styles.indicatorStyle),
              }}
            />
          );
        })}
      </View>
    );
  }

  function onboardingScreenContent() {
    const renderItem = ({ item }) => {
      return (
        <View style={styles.onboardingContentStyle}>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Image
              source={item.onboardingImage}
              style={{
                width: screenWidth - 50.0,
                height: screenHeight / 3.0,
                resizeMode: "contain",
              }}
            />
          </View>
          <View style={{ height: 320 }}>
            <View
              style={{
                marginTop: Sizes.fixPadding * 4.0,
                marginHorizontal: Sizes.fixPadding * 2.0,
              }}
            >
              <Text
                numberOfLines={1}
                style={{ textAlign: "center", ...Fonts.whiteColor20SemiBold }}
              >
                {item.onboardingTitle}
              </Text>
              <Text
                numberOfLines={3}
                style={styles.onboardingDescriptionTextStyle}
              >
                {item.onboardingDescription}
              </Text>
            </View>
          </View>
        </View>
      );
    };
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}></View>
        <View style={styles.bottomRadiusContainer}></View>
        <FlatList
          ref={listRef}
          data={onboardingScreenList}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          horizontal
          scrollEventThrottle={32}
          pagingEnabled
          onMomentumScrollEnd={onScrollEnd}
          showsHorizontalScrollIndicator={false}
          style={styles.onboardingPage}
        />
      </View>
    );
  }

  function onScrollEnd(e) {
    let contentOffset = e.nativeEvent.contentOffset;
    let viewSize = e.nativeEvent.layoutMeasurement;
    let pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentScreen(pageNum);
  }

  function exitInfo() {
    return backClickCount == 1 ? (
      <View style={styles.exitInfoWrapStyle}>
        <Text style={{ ...Fonts.whiteColor14Medium }}>
          Press Back Once Again To Exit!
        </Text>
      </View>
    ) : null;
  }
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  exitInfoWrapStyle: {
    backgroundColor: Colors.blackColor,
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    borderRadius: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  skipTextStyle: {
    ...Fonts.grayColor16SemiBold,
    position: "absolute",
    top: 20.0,
    right: 20.0,
    zIndex: 100,
  },
  indicatorWithButtonWrapStyle: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomRadiusContainer: {
    height: 320.0,
    backgroundColor: Colors.primaryColor,
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
  },
  onboardingPage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  selectedIndicatorStyle: {
    marginHorizontal: Sizes.fixPadding - 7.0,
    width: 50.0,
    height: 8.0,
    borderRadius: Sizes.fixPadding,
    backgroundColor: Colors.secondaryColor,
  },
  indicatorStyle: {
    marginHorizontal: Sizes.fixPadding - 7.0,
    width: 8.0,
    height: 8.0,
    borderRadius: 4.0,
    backgroundColor: Colors.grayColor,
  },
  onboardingDescriptionTextStyle: {
    marginTop: Sizes.fixPadding,
    textAlign: "center",
    ...Fonts.whiteColor14Medium,
  },
  onboardingContentStyle: {
    flex: 1,
    width: screenWidth,
    height: "100%",
    overflow: "hidden",
    justifyContent: "space-between",
  },
});
