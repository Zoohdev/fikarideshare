import { StyleSheet, View, Animated, Image, Text } from "react-native";
import React, { useState, useRef } from "react";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
  screenWidth,
} from "../../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SwipeListView } from "react-native-swipe-list-view";
// import { Snackbar } from "react-native-paper";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { useNavigation } from "expo-router";

const notificatiosList = [
  {
    key: "1",
    title: "Accept ride request",
    description: "Congratulation jecob johan accept your ride request",
    time: "2min ago",
  },
  {
    key: "2",
    title: "Decline ride request",
    description: "Jenny wisdom decline your ride request. find new ride.",
    time: "2min ago",
  },
  {
    key: "3",
    title: "Add money",
    description: "Congratulation $10.00 successfully added in your wallet.",
    time: "2min ago",
  },
  {
    key: "4",
    title: "Accept request",
    description: "Congratulation jecob johan accept your ride request",
    time: "2min ago",
  },
];

const rowTranslateAnimatedValues = {};

const NotificationsScreen = () => {

  const navigation = useNavigation();

  const [showSnackBar, setShowSnackBar] = useState(false);
  const [listData, setListData] = useState(notificatiosList);

  Array(listData.length + 1)
    .fill("")
    .forEach((_, i) => {
      rowTranslateAnimatedValues[`${i}`] = new Animated.Value(1);
    });

  const animationIsRunning = useRef(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Notification"} navigation={navigation} />
        {listData.length == 0 ? noNotificationInfo() : notificationsInfo()}
      </View>
      {snackBar()}
    </View>
  );

  function noNotificationInfo() {
    return (
      <View style={styles.noNotificationPage}>
        <Image
          source={require("../../assets/images/icons/empty_noty.png")}
          style={{ width: 65, height: 65, resizeMode: "contain" }}
        />
        <Text
          style={{
            ...Fonts.grayColor18SemiBold,
            marginTop: Sizes.fixPadding,
          }}
        >
          No new notification
        </Text>
      </View>
    );
  }

  // function snackBar() {
  //   return (
  //     <Snackbar
  //       style={{ backgroundColor: Colors.blackColor }}
  //       elevation={0}
  //       visible={showSnackBar}
  //       onDismiss={() => setShowSnackBar(false)}
  //     >
  //       <Text style={{ ...Fonts.whiteColor14Medium }}>
  //         Notification Dismissed!
  //       </Text>
  //     </Snackbar>
  //   );
  // }

  function snackBar() {
    if (!showSnackBar) return null;
  
    return (
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          right: 20,
          backgroundColor: Colors.blackColor,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ ...Fonts.whiteColor14Medium }}>
          Notification Dismissed!
        </Text>
      </View>
    );
  }

  function notificationsInfo() {
    const onSwipeValueChange = (swipeData) => {
      const { key, value } = swipeData;
      if (
        value > screenWidth ||
        (value < -screenWidth && !animationIsRunning.current)
      ) {
        animationIsRunning.current = true;
        Animated.timing(rowTranslateAnimatedValues[key], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          const newData = [...listData];
          const prevIndex = listData.findIndex((item) => item.key === key);
          newData.splice(prevIndex, 1);
          setListData(newData);
          setShowSnackBar(true);
          animationIsRunning.current = false;
        });
      }
    };

    const renderItem = (data) => (
      <View>
        <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
          <View
            style={{
              marginHorizontal: Sizes.fixPadding * 2.0,
              paddingVertical: Sizes.fixPadding * 2.0,
            }}
          >
            <View style={{ ...CommonStyles.rowAlignCenter }}>
              <View style={{ ...CommonStyles.shadow, ...styles.iconWrapStyle }}>
                <MaterialIcons
                  name="notifications-none"
                  size={22}
                  color={Colors.secondaryColor}
                />
              </View>
              <View style={{ flex: 1, marginLeft: Sizes.fixPadding + 5.0 }}>
                <Text
                  numberOfLines={1}
                  style={{ ...Fonts.blackColor16SemiBold }}
                >
                  {data.item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    marginVertical: Sizes.fixPadding - 7.0,
                    ...Fonts.blackColor14Medium,
                  }}
                >
                  {data.item.description}
                </Text>
                <Text style={{ ...Fonts.grayColor14SemiBold }}>2min ago</Text>
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            backgroundColor: Colors.lightGrayColor,
            height: 1.0,
          }}
        />
      </View>
    );

    const renderHiddenItem = (data) => <View style={styles.rowBack} />;

    return (
      <SwipeListView
        data={listData}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-screenWidth}
        leftOpenValue={screenWidth}
        onSwipeValueChange={onSwipeValueChange}
        useNativeDriver={false}
        showsVerticalScrollIndicator={false}
      />
    );
  }
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  rowBack: {
    backgroundColor: Colors.primaryColor,
    flex: 1,
  },
  iconWrapStyle: {
    width: 50.0,
    height: 50.0,
    borderRadius: 25.0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.whiteColor,
  },
  noNotificationPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: Sizes.fixPadding * 2.0,
  },
});
