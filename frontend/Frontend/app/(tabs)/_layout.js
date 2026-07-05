import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MyStatusBar from "../../components/myStatusBar";
import { Colors, CommonStyles, Fonts, Sizes, screenWidth } from "../../constants/styles";

import socket from "../../services/socketService";

export default function TabLayout() {

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
        subscription.remove(); // ✅ FIX
      };
    }, [])
  );
  useEffect(() => {

    const setupSocket =
      async () => {
  
        try {
  
          const riderId =
            await AsyncStorage.getItem(
              "riderId"
            );
  
          console.log(
            "📡 REGISTERING RIDER:",
            riderId
          );
  
          if (!socket.connected) {
  
            socket.connect();
  
          }
  
          socket.emit(
            "register-rider",
            {
              riderId:
                parseInt(riderId)
            }
          );
  
        } catch (err) {
  
          console.log(
            "❌ socket setup error:",
            err
          );
  
        }
  
      };
  
    socket.on(
      "connect",
      () => {
  
        console.log(
          "✅ rider socket connected:",
          socket.id
        );
  
      }
    );
  
    setupSocket();
  
    return () => {
  
      socket.off("connect");
  
    };
  
  }, []);
  function _spring() {
    setBackClickCount(1);
    setTimeout(() => {
      setBackClickCount(0);
    }, 1000);
  }

  const [backClickCount, setBackClickCount] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <MyStatusBar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primaryColor,
          tabBarInactiveTintColor: Colors.grayColor,
          tabBarHideOnKeyboard: true,
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBarStyle,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              android_ripple={{
                color: Colors.whiteColor,
              }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="home/homeScreen"
          options={{
            tabBarIcon: ({ focused, color }) =>
              tabSort({
                focused,
                color,
                icon: "home-outline",
                tab: "Home",
                isRotate: false,
              }),
          }}
        />
        <Tabs.Screen
          name="rides/ridesScreen"
          options={{
            tabBarIcon: ({ focused, color }) =>
              tabSort({
                focused,
                color,
                icon: "navigate-outline",
                tab: "My rides",
                isRotate: true,
              }),
          }}
        />
        <Tabs.Screen
          name="wallet/walletScreen"
          options={{
            tabBarIcon: ({ focused, color }) =>
              tabSort({
                focused,
                color,
                icon: "wallet-outline",
                tab: "Wallet",
                isRotate: false,
              }),
          }}
        />
        <Tabs.Screen
          name="profile/profileScreen"
          options={{
            tabBarIcon: ({ focused, color }) =>
              tabSort({
                focused,
                color,
                icon: "person-outline",
                tab: "Profile",
                isRotate: false,
              }),
          }}
        />
      </Tabs>
      {exitInfo()}
    </View>
  );

  function tabSort({ focused, color, icon, tab, isRotate }) {
    return (
      <View style={{ alignItems: "center", width: screenWidth / 4.4, }}>
        <View style={{ width: 26.0, height: 26.0 }}>
          <Ionicons
            name={icon}
            size={22}
            color={color}
            style={{
              marginBottom: Sizes.fixPadding - 7.0,
              transform: [{ rotate: isRotate ? "-45deg" : "0deg" }],
            }}
          />
        </View>
        <Text
          numberOfLines={1}
          style={
            focused
              ? { ...Fonts.primaryColor14SemiBold }
              : { ...Fonts.grayColor14SemiBold }
          }
        >
          {tab}
        </Text>
        {focused ? <View style={styles.selectedTabIndicator}></View> : null}
      </View>
    );
  }

  function exitInfo() {
    return (
      backClickCount == 1
        ?
        <View style={styles.exitInfoWrapStyle}>
          <Text style={{ ...Fonts.whiteColor14Medium }}>
            Press Back Once Again To Exit!
          </Text>
        </View>
        :
        null)
  }
}

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
  },
  tabBarStyle: {
    backgroundColor: Colors.whiteColor,
    borderTopColor: Colors.bodyBackColor,
    borderTopWidth: 1.0,
    height: 70.0,
    ...CommonStyles.shadow,
    paddingTop: Sizes.fixPadding + 5.0
  },
  selectedTabIndicator: {
    width: 46.0,
    height: 6.0,
    backgroundColor: Colors.secondaryColor,
    position: "absolute",
    top: -14.0,
  },
});
