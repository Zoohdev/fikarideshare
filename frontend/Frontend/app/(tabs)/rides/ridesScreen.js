import { useIsFocused } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Colors, CommonStyles, Fonts, Sizes } from "../../../constants/styles";
import api from "../../../services/api";

const RidesScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (isFocused) {
      fetchRides(true);
    }
  }, [isFocused, statusFilter]);

  const fetchRides = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }

      const currentPage = reset ? 1 : pagination.page;

      // GET /api/rides/trips/ already scopes to the logged-in user (as
      // rider, driver, or pooled participant) via the JWT - no riderId
      // needed. DRF page-number pagination: {count, next, previous, results}.
      const response = await api.get("/rides/trips/", {
        params: {
          status: statusFilter || undefined,
          page: currentPage,
        },
      });

      const { count, next, results } = response.data;

      if (reset) {
        setRides(results);
      } else {
        setRides((prevRides) => [...prevRides, ...results]);
      }

      setPagination({
        page: currentPage + 1,
        hasMore: Boolean(next),
        total: count,
      });
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRides(true);
  }, [statusFilter]);

  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchRides(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getTripTypeIcon = (vehicleType) => {
    switch (vehicleType?.toLowerCase()) {
      case "xl":
        return "bus";
      case "premium":
        return "car-sports";
      case "comfort":
        return "directions-car";
      default:
        return "car";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <View style={{ flex: 1 }}>
        {header()}
        {loading && rides.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : rides.length === 0 ? (
          noRidesInfo()
        ) : (
          ridesInfo()
        )}
      </View>
    </SafeAreaView>
  );

  function noRidesInfo() {
    return (
      <View style={styles.emptyPage}>
        <Image
          source={require("../../../assets/images/empty_ride.png")}
          style={{ width: 80, height: 80, resizeMode: "contain", opacity: 0.5 }}
        />
        <Text style={{ ...Fonts.grayColor16SemiBold, marginTop: Sizes.fixPadding }}>
          No past rides
        </Text>
        <Text
          style={{
            ...Fonts.grayColor12Medium,
            marginTop: Sizes.fixPadding - 5,
            textAlign: "center",
          }}
        >
          Your ride history will appear here
        </Text>
      </View>
    );
  }

  function ridesInfo() {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          navigation.push("rideDetail/rideDetailScreen", { 
            id: item.id,
            tripData: item 
          });
        }}
        style={styles.rideCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" color={Colors.primaryColor} size={14} />
            <Text
              style={{
                ...Fonts.blackColor13Medium,
                marginLeft: Sizes.fixPadding - 5,
              }}
            >
              {formatDate(item.requested_at)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={{ ...Fonts.grayColor11Medium }}>Total</Text>
            <Text style={{ ...Fonts.primaryColor18Bold, marginTop: 2 }}>
              ${Number(item.final_fare ?? item.estimated_fare ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={styles.pickupDot} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                ...Fonts.blackColor14Medium,
                marginLeft: Sizes.fixPadding,
              }}
            >
              {item.pickup_address}
            </Text>
          </View>

          <View style={styles.dashedLineWrapper}>
            <View style={styles.dashedLine} />
          </View>

          <View style={styles.locationRow}>
            <View style={styles.dropoffDot} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                ...Fonts.grayColor13Medium,
                marginLeft: Sizes.fixPadding,
              }}
            >
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" color={Colors.grayColor} size={14} />
            <Text
              style={{
                ...Fonts.grayColor12Medium,
                marginLeft: Sizes.fixPadding - 5,
              }}
            >
              {formatTime(item.requested_at)}
            </Text>
            <View style={styles.footerDivider} />
            <MaterialIcons
              name={getTripTypeIcon(item.vehicle_type_requested)}
              color={Colors.grayColor}
              size={14}
            />
            <Text
              style={{
                ...Fonts.grayColor12Medium,
                marginLeft: Sizes.fixPadding - 5,
                textTransform: "capitalize",
              }}
            >
              {item.vehicle_type_requested || "Economy"}
            </Text>
            <View style={styles.footerDivider} />
            <View style={styles.statusBadge(item.status)}>
              <Text style={styles.statusText(item.status)}>
                {item.status?.replaceAll("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" color={Colors.grayColor} size={20} />
        </View>
      </TouchableOpacity>
    );

    return (
      <FlatList
        data={rides}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primaryColor]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && rides.length > 0 ? (
            <ActivityIndicator 
              size="small" 
              color={Colors.primaryColor} 
              style={{ marginVertical: Sizes.fixPadding }} 
            />
          ) : null
        }
      />
    );
  }

  function header() {
    return (
      <View style={styles.header}>
        <Text style={{ ...Fonts.whiteColor20SemiBold }}>Your rides</Text>
        <Text
          style={{
            ...Fonts.whiteColor14Medium,
            marginTop: Sizes.fixPadding - 8,
            opacity: 0.8,
          }}
        >
          Past trips ({pagination.total})
        </Text>
      </View>
    );
  }
};

export default RidesScreen;

const styles = StyleSheet.create({
  emptyPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: Sizes.fixPadding * 2.0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingTop: Sizes.fixPadding * 2.0,
    paddingBottom: Sizes.fixPadding * 2.0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  listContainer: {
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingTop: Sizes.fixPadding * 2.0,
    paddingBottom: Sizes.fixPadding * 2.0,
  },
  rideCard: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2.0,
    ...CommonStyles.shadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Sizes.fixPadding,
    paddingBottom: Sizes.fixPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayColor,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  routeContainer: {
    marginBottom: Sizes.fixPadding,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.greenColor,
    borderWidth: 2,
    borderColor: Colors.whiteColor,
    ...CommonStyles.shadow,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.redColor,
    borderWidth: 2,
    borderColor: Colors.whiteColor,
    ...CommonStyles.shadow,
  },
  dashedLineWrapper: {
    marginLeft: 5,
    paddingVertical: 4,
  },
  dashedLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.grayColor,
    opacity: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Sizes.fixPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayColor,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.lightGrayColor,
    marginHorizontal: Sizes.fixPadding - 5,
  },
  statusBadge: (status) => ({
    backgroundColor: status === "completed" ? Colors.greenColor + "15" : Colors.redColor + "15",
    paddingHorizontal: Sizes.fixPadding - 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Sizes.fixPadding - 5,
  }),
  statusText: (status) => ({
    ...Fonts.grayColor10Medium,
    color: status === "completed" ? Colors.greenColor : Colors.redColor,
    fontSize: 10,
  }),
});