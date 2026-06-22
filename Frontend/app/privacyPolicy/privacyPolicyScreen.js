import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import MyStatusBar from "../../components/myStatusBar";
import Header from "../../components/header";
import { useNavigation } from "expo-router";

const privacyPolicies = [
  "Lorem ipsum dolor sit amet consectetdsuspendisse orci cras amet. Viverra massa amet etd diam a nisiac aliquet felis. Duis sagittis neque hen dreritmaecenas suspendisse scelerisque. Eu exst bibendum ornare ",
  "Lorem ipsum dolor sit amet consecv tetsuspendisse orci cras amet. Viverra massa xamet et diam a nisiac aliquet felis. Duis sagittis ne que hendreritmaecenas suspendisse scelerisque. Exaucest bibendum ornare lacinia in. Turpis rutrum conguxe sollicitudin viverra. Suscipit sagittis cursus arcuxgfh kest mattis. Blandit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut bibendum eget ultrices in nunc. Pretium amet adipiscing mattis",
  "Lorem ipsum dolor sit amet consec textsuspendisse orci cras amet. Vivxerra massa amet et diam a nisiac aliquet felis. Duis sagittis neque hendreritmaecenas suspendisse scelerisque. Eu est bibxendums ornare lacinia in. Turpis rutrum congue sollic citudin viverra. Suscipit sagittis cursus arcugfh kest mattis. Blaxndit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut  bibendum eget ultrices in nunc. Pretium amet adipis cinsadg mattis Lorem ipsum dolor sit amet consectets uspendisse orci cras amet. Viverra massa amet etx diam a nisiac aliquet felis. Duis sagittis neque hendrerit maecenas suspendisse scelerisque. Eu est biaxbendum ornare lacinia in. Turpis rutrum conxgue sollicitudin viverra. Suscipit sagittis cursus arcuxgfh kest mattis. Blandit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut bibendum eget ultrices in nunc. Pretium amet adipiscing mattis",
  "Lorem ipsum dolor sit amet consectetdsuspendisse orci cras amet. Viverra massa amet etd diam a nisiac aliquet felis. Duis sagittis neque hen dreritmaecenas suspendisse scelerisque. Eu exst bibendum ornare",
  "Lorem ipsum dolor sit amet consecv tetsuspendisse orci cras amet. Viverra massa xamet et diam a nisiac aliquet felis. Duis sagittis ne que hendreritmaecenas suspendisse scelerisque. Exaucest bibendum ornare lacinia in. Turpis rutrum conguxe sollicitudin viverra. Suscipit sagittis cursus arcuxgfh kest mattis. Blandit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut bibendum eget ultrices in nunc. Pretium amet adipiscing mattis",
  "Lorem ipsum dolor sit amet consec textsuspendisse orci cras amet. Vivxerra massa amet et diam a nisiac aliquet felis. Duis sagittis neque hendreritmaecenas suspendisse scelerisque. Eu est bibxendums ornare lacinia in. Turpis rutrum congue sollic citudin viverra. Suscipit sagittis cursus arcugfh kest mattis. Blaxndit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut  bibendum eget ultrices in nunc. Pretium amet adipis cinsadg mattis Lorem ipsum dolor sit amet consectets uspendisse orci cras amet. Viverra massa amet etx diam a nisiac aliquet felis. Duis sagittis neque hendrerit maecenas suspendisse scelerisque. Eu est biaxbendum ornare lacinia in. Turpis rutrum conxgue sollicitudin viverra. Suscipit sagittis cursus arcuxgfh kest mattis. Blandit quam vitae id nunc ornare nec morbi. Sapien massa sed lectus a erat in cras dui ut. Id ut bibendum eget ultrices in nunc. Pretium amet adipiscing mattis",
];

const PrivacyPolicyScreen = () => {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bodyBackColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        <Header title={"Privacy policy"} navigation={navigation} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Sizes.fixPadding * 1.5 }}
        >
          {appIcon()}
          {privacyPolicyInfo()}
        </ScrollView>
      </View>
    </View>
  );

  function privacyPolicyInfo() {
    return (
      <View>
        {privacyPolicies.map((item, index) => (
          <Text key={`${index}`} style={styles.privacyPolicyTextStyle}>
            {item}
          </Text>
        ))}
      </View>
    );
  }

  function appIcon() {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          margin: Sizes.fixPadding * 2.0,
        }}
      >
        <Image
          source={require("../../assets/images/app_color_icon.png")}
          style={styles.appIcon}
        />
        <Text style={{ ...Fonts.secondaryColor24SemiBold }}>Go Poolar</Text>
      </View>
    );
  }
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  appIcon: {
    height: 80.0,
    width: "100%",
    resizeMode: "contain",
    marginVertical: -Sizes.fixPadding,
  },
  privacyPolicyTextStyle: {
    ...Fonts.grayColor14Medium,
    marginVertical: Sizes.fixPadding - 5.0,
    marginHorizontal: Sizes.fixPadding * 2.0,
  },
});
