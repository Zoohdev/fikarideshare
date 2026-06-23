// app/screens/RidesScreen.js
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Colors, Sizes, Fonts, CommonStyles } from "../../../constants/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useIsFocused } from "@react-navigation/native";
import api from "../../../services/api";
import { API_HOST } from "../../../constants/apiConfig";

const formatDate = (dateString) => {
  if (!dateString) return "Date not available";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const resolvePhotoUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `http://${API_HOST}${path}`;
};

const RidesScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [rides, setRides] = useState([]); // Initialize as empty array
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

    // GET /api/rides/trips/ already scopes to the logged-in driver via the
    // JWT (rider OR driver OR participant) - no driverId needed.
    const response = await api.get("/rides/trips/", {
      params: {
        status: statusFilter || undefined,
        page: currentPage,
      },
    });

    const { count, next, results } = response.data;
    const tripsArray = Array.isArray(results) ? results : [];

    if (reset) {
      setRides(tripsArray);
    } else {
      setRides((prevRides) => {
        const prevArray = Array.isArray(prevRides) ? prevRides : [];
        return [...prevArray, ...tripsArray];
      });
    }

    setPagination({
      page: currentPage + 1,
      hasMore: Boolean(next),
      total: count,
    });
  } catch (error) {
    console.error('Error loading trips:', error);
    // On error, ensure rides is still an array
    if (reset) {
      setRides([]);
    }
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const getTripTypeIcon = (tripType) => {
    switch(tripType?.toLowerCase()) {
      case "uberx":
        return "car";
      case "uberxl":
        return "bus";
      case "comfort":
        return "car-sports";
      default:
        return "car";
    }
  };

  // Safely check if rides is an array before using .length
  const hasRides = Array.isArray(rides) && rides.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      {header()}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : !hasRides ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No trips found</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <TripCard trip={item} />}
          contentContainerStyle={{ padding: Sizes.fixPadding * 2 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && refreshing === false ? (
              <ActivityIndicator size="small" color={Colors.primaryColor} />
            ) : null
          }
        />
      )}
    </View>
  );

  function header() {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips History</Text>
      </View>
    );
  }
};

const TripCard = ({ trip }) => {
  const navigation = useNavigation();
  
  // Add safety check for trip object
  if (!trip) {
    return null;
  }
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.push("rideDetail/rideDetailScreen", { id: trip.id })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.riderInfo}>
          <Image
            source={
              resolvePhotoUrl(trip.rider?.profile_photo)
                ? { uri: resolvePhotoUrl(trip.rider?.profile_photo) }
                : require("../../../assets/images/user/user3.png")
            }
            style={styles.avatar}
          />
          <Text style={styles.riderName}>{trip.rider?.full_name || 'Unknown Rider'}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          trip.status === 'completed' ? styles.completedBadge : styles.cancelledBadge
        ]}>
          <Text style={styles.statusText}>{trip.status?.replaceAll('_', ' ') || 'unknown'}</Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: Colors.greenColor }]} />
          <Text style={styles.locationText} numberOfLines={1}>{trip.pickup_address || 'Pickup location not available'}</Text>
        </View>

        <View style={styles.dashedLine} />

        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: Colors.redColor }]} />
          <Text style={styles.locationText} numberOfLines={1}>{trip.dropoff_address || 'Dropoff location not available'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={Colors.grayColor} />
          <Text style={styles.dateText}>{formatDate(trip.requested_at)}</Text>
        </View>
        <Text style={styles.amountText}>${Number(trip.final_fare ?? trip.estimated_fare ?? 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: Colors.primaryColor,
    padding: Sizes.fixPadding * 2,
    alignItems: 'center'
  },
  headerTitle: {
    ...Fonts.whiteColor20SemiBold
  },
  card: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding,
    padding: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 2,
    ...CommonStyles.shadow
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.fixPadding
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Sizes.fixPadding
  },
  riderName: {
    ...Fonts.blackColor15SemiBold
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  completedBadge: {
    backgroundColor: '#4CAF50'
  },
  cancelledBadge: {
    backgroundColor: '#F44336'
  },
  statusText: {
    ...Fonts.whiteColor12Medium,
    textTransform: 'capitalize'
  },
  locationContainer: {
    marginVertical: Sizes.fixPadding
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Sizes.fixPadding
  },
  locationText: {
    flex: 1,
    ...Fonts.grayColor14Medium
  },
  dashedLine: {
    height: 20,
    width: 1,
    backgroundColor: Colors.grayColor,
    marginLeft: 3.5,
    marginVertical: 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Sizes.fixPadding,
    paddingTop: Sizes.fixPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayColor
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    ...Fonts.grayColor12Medium,
    marginLeft: 4
  },
  amountText: {
    ...Fonts.greenColor16SemiBold
  },
  emptyText: {
    ...Fonts.grayColor16Medium
  }
});

export default RidesScreen;