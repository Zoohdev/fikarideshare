import { Text, View, FlatList, Image } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";

const reviewsList = [
  {
    id: "1",
    profile: require("../../assets/images/user/user11.png"),
    name: "Wade Warren",
    rating: 4.8,
    reviewDate: "25 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "2",
    profile: require("../../assets/images/user/user12.png"),
    name: "Jenny wilsom",
    rating: 3.5,
    reviewDate: "25 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "3",
    profile: require("../../assets/images/user/user8.png"),
    name: "Leslie Alexander",
    rating: 3.0,
    reviewDate: "24 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "4",
    profile: require("../../assets/images/user/user13.png"),
    name: "Robert Fox",
    rating: 4.0,
    reviewDate: "24 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "5",
    profile: require("../../assets/images/user/user14.png"),
    name: "Cody Fisher",
    rating: 2.5,
    reviewDate: "23 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "6",
    profile: require("../../assets/images/user/user15.png"),
    name: "Ronald Richards",
    rating: 3.5,
    reviewDate: "23 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
  {
    id: "7",
    profile: require("../../assets/images/user/user7.png"),
    name: "Kathryn Murphy",
    rating: 3.0,
    reviewDate: "20 jan 2023",
    review:
      "Lorem ipsum dolor sit amet consectetur. Allaliquam sit mollis adipiscing donec ut sed. Dictum dignissim enim condimentum vitae aliquam sed. ",
  },
];

const ReviewsScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Review"} navigation={navigation} />
        {allReviews()}
      </View>
    </View>
  );

  function allReviews() {
    const renderItem = ({ item, index }) => (
      <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
        <View style={{ ...CommonStyles.rowAlignCenter }}>
          <Image
            source={item.profile}
            style={{ width: 40.0, height: 40.0, borderRadius: 20.0 }}
          />
          <View style={{ flex: 1, marginHorizontal: Sizes.fixPadding }}>
            <Text numberOfLines={1} style={{ ...Fonts.blackColor16SemiBold }}>
              {item.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: Sizes.fixPadding - 8.0,
                ...Fonts.grayColor14Medium,
              }}
            >
              {item.reviewDate}
            </Text>
          </View>
          <View style={{ ...CommonStyles.rowAlignCenter }}>
            <Text style={{ ...Fonts.grayColor16SemiBold }}>
              {item.rating.toFixed(1)}
            </Text>
            <MaterialIcons
              name="star"
              color={Colors.secondaryColor}
              size={16}
            />
          </View>
        </View>
        <Text
          style={{
            ...Fonts.grayColor14Medium,
            marginTop: Sizes.fixPadding,
          }}
        >
          {item.review}
        </Text>
        {index === reviewsList.length - 1 ? null : (
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
        data={reviewsList}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }
};

export default ReviewsScreen;
