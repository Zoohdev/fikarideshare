import { Dimensions, Platform } from "react-native";

export const Colors = {
  primaryColor: "#003231ff",
  secondaryColor: "#FF8C00",
  lightSecondaryColor: "#FFEED2",
  blackColor: "#0f1111ff",
  whiteColor: "#FFFFFF",
  grayColor: "#4f5353ff",
  lightGrayColor: "#bdbcbcff",
  bodyBackColor: "#F4F4F4",
  greenColor: "#003231ff",
  redColor: "#D24036",
};

export const Fonts = {
  whiteColor12Medium: {
    color: Colors.whiteColor,
    fontSize: 12.0,
    fontFamily: "Montserrat_Medium",
  },

  whiteColor14Medium: {
    color: Colors.whiteColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_Medium",
  },

  whiteColor15Medium: {
    color: Colors.whiteColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_Medium",
  },

  whiteColor13SemiBold: {
    color: Colors.whiteColor,
    fontSize: 13.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor14SemiBold: {
    color: Colors.whiteColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor15SemiBold: {
    color: Colors.whiteColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor16SemiBold: {
    color: Colors.whiteColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor18SemiBold: {
    color: Colors.whiteColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor20SemiBold: {
    color: Colors.whiteColor,
    fontSize: 20.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor28SemiBold: {
    color: Colors.whiteColor,
    fontSize: 28.0,
    fontFamily: "Montserrat_SemiBold",
  },

  whiteColor18Bold: {
    color: Colors.whiteColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_Bold",
  },

  blackColor12Medium: {
    color: Colors.blackColor,
    fontSize: 12.0,
    fontFamily: "Montserrat_Medium",
  },

  blackColor14Medium: {
    color: Colors.blackColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_Medium",
  },

  blackColor15Medium: {
    color: Colors.blackColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_Medium",
  },

  blackColor16Medium: {
    color: Colors.blackColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_Medium",
  },

  blackColor14SemiBold: {
    color: Colors.blackColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_SemiBold",
  },

  blackColor15SemiBold: {
    color: Colors.blackColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_SemiBold",
  },

  blackColor16SemiBold: {
    color: Colors.blackColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  blackColor17SemiBold: {
    color: Colors.blackColor,
    fontSize: 17.0,
    fontFamily: "Montserrat_SemiBold",
  },

  blackColor18SemiBold: {
    color: Colors.blackColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_SemiBold",
  },

  blackColor20SemiBold: {
    color: Colors.blackColor,
    fontSize: 20.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor14Medium: {
    color: Colors.primaryColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_Medium",
  },

  primaryColor30Medium: {
    color: Colors.primaryColor,
    fontSize: 30.0,
    fontFamily: "Montserrat_Medium",
  },

  primaryColor14SemiBold: {
    color: Colors.primaryColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor15SemiBold: {
    color: Colors.primaryColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor16SemiBold: {
    color: Colors.primaryColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor18SemiBold: {
    color: Colors.primaryColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor20SemiBold: {
    color: Colors.primaryColor,
    fontSize: 20.0,
    fontFamily: "Montserrat_SemiBold",
  },

  primaryColor17Bold: {
    color: Colors.primaryColor,
    fontSize: 17.0,
    fontFamily: "Montserrat_Bold",
  },

  primaryColor18Bold: {
    color: Colors.primaryColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_Bold",
  },

  secondaryColor16SemiBold: {
    color: Colors.secondaryColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  secondaryColor17SemiBold: {
    color: Colors.secondaryColor,
    fontSize: 17.0,
    fontFamily: "Montserrat_SemiBold",
  },

  secondaryColor24SemiBold: {
    color: Colors.secondaryColor,
    fontSize: 24.0,
    fontFamily: "Montserrat_SemiBold",
  },

  grayColor12Medium: {
    color: Colors.grayColor,
    fontSize: 12.0,
    fontFamily: "Montserrat_Medium",
  },

  grayColor14Medium: {
    color: Colors.grayColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_Medium",
  },

  grayColor15Medium: {
    color: Colors.grayColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_Medium",
  },

  grayColor16Medium: {
    color: Colors.grayColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_Medium",
  },

  grayColor18Medium: {
    color: Colors.grayColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_Medium",
  },

  grayColor13SemiBold: {
    color: Colors.grayColor,
    fontSize: 13.0,
    fontFamily: "Montserrat_SemiBold",
  },

  grayColor14SemiBold: {
    color: Colors.grayColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_SemiBold",
  },

  grayColor15SemiBold: {
    color: Colors.grayColor,
    fontSize: 15.0,
    fontFamily: "Montserrat_SemiBold",
  },

  grayColor16SemiBold: {
    color: Colors.grayColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  grayColor18SemiBold: {
    color: Colors.grayColor,
    fontSize: 18.0,
    fontFamily: "Montserrat_SemiBold",
  },

  greenColor14SemiBold: {
    color: Colors.greenColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_SemiBold",
  },

  greenColor16SemiBold: {
    color: Colors.greenColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

  redColor14Medium: {
    color: Colors.redColor,
    fontSize: 14.0,
    fontFamily: "Montserrat_Medium",
  },

  redColor16SemiBold: {
    color: Colors.redColor,
    fontSize: 16.0,
    fontFamily: "Montserrat_SemiBold",
  },

};

export const Sizes = {
  fixPadding: 10.0,
};

export const screenWidth = Dimensions.get("window").width;
export const screenHeight = Dimensions.get("window").height;

export const CommonStyles = {
  shadow: {
    shadowColor: Colors.blackColor,
    shadowOpacity: 0.2,
    shadowOffset: { x: 0, y: 0 },
    elevation: 2.0,
    borderColor: Platform.OS == 'ios' ? 'transparent' : "#e0e0e0",
    borderWidth: 1,
  },
  button: {
    backgroundColor: Colors.secondaryColor,
    borderRadius: Sizes.fixPadding,
    alignItems: "center",
    justifyContent: "center",
    padding: Sizes.fixPadding + 4.0,
    marginHorizontal: Sizes.fixPadding * 2.0,
  },
  rowAlignCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
};
