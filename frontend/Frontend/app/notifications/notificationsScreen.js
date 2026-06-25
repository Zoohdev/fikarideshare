import { StyleSheet, View, Animated, Image, Text, ActivityIndicator } from "react-native";
import React, { useState, useRef, useCallback } from "react";
import {
  Colors,
  CommonStyles,
  Fonts,
  Sizes,
  screenWidth,
} from "../../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SwipeListView } from "react-native-swipe-list-view";
import Header from "../../components/header";
import MyStatusBar from "../../components/myStatusBar";
import { useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";

const rowTranslateAnimatedValues = {};

const TYPE_ICON = {
  ride_accepted: "directions-car",
  ride_completed: "check-circle-outline",
  ride_cancelled: "cancel",
  payment_completed: "payments",
  payout_completed: "account-balance",
};

function timeAgo(isoDate) {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState([]);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    api
      .get("/notifications/")
      .then((response) => {
        const results = response.data?.results || [];
        setListData(results.map((n) => ({ key: n.id, ...n })));
      })
      .catch((error) => console.error("Error fetching notifications:", error))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

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
        {loading ? (
          <View style={styles.noNotificationPage}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : listData.length == 0 ? (
          noNotificationInfo()
        ) : (
          notificationsInfo()
        )}
      </View>
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
          api.post(`/notifications/${key}/read/`).catch(() => {});
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
                  name={TYPE_ICON[data.item.type] || "notifications-none"}
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
                  {data.item.body}
                </Text>
                <Text style={{ ...Fonts.grayColor14SemiBold }}>{timeAgo(data.item.created_at)}</Text>
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

    const renderHiddenItem = () => <View style={styles.rowBack} />;

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
