import { Text, View, FlatList, Image, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";
import api from "../../services/api";

const ReviewsScreen = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/ratings/history/")
      .then((response) => setReviews(response.data || []))
      .catch((error) => console.error("Error fetching reviews:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Review"} navigation={navigation} />
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ ...Fonts.grayColor16SemiBold }}>No reviews yet</Text>
          </View>
        ) : (
          allReviews()
        )}
      </View>
    </View>
  );

  function allReviews() {
    const renderItem = ({ item, index }) => (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <View style={{ ...CommonStyles.rowAlignCenter }}>
          {item.rater_detail?.profile_photo ? (
            <Image
              source={{ uri: item.rater_detail.profile_photo }}
              style={{ width: 40.0, height: 40.0, borderRadius: 20.0 }}
            />
          ) : (
            <View
              style={{
                width: 40.0,
                height: 40.0,
                borderRadius: 20.0,
                backgroundColor: Colors.lightGrayColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="person" color={Colors.whiteColor} size={22} />
            </View>
          )}
          <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
              {item.rater_detail?.full_name || "Anonymous"}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: Sizes.fixPadding - 8.0,
                ...Fonts.grayColor14Medium,
              }}
            >
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <Text style={{ ...Fonts.grayColor16SemiBold }}>
              {Number(item.score).toFixed(1)}
            </Text>
            <MaterialIcons
              name="star"
              color={Colors.secondaryColor}
              size={16}
            />
          </View>
        </View>
        {item.comment ? (
          <Text
            style={{
              ...Fonts.grayColor14Medium,
              marginTop: Sizes.fixPadding,
            }}
          >
            {item.comment}
          </Text>
        ) : null}
        {index === reviews.length - 1 ? null : (
          <View
            style={{
              height: 1.0,
              backgroundColor: Colors.lightGrayColor,
              marginVertical: Sizes.fixPadding * 2.0,
            }}
          ></View>
        )}
      </View>
    );
    return (
      <FlatList
        data={reviews}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }
};

export default ReviewsScreen;
