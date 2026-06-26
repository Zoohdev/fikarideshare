import {
  Colors,
  Sizes,
  screenWidth,
  screenHeight,
} from "../../constants/styles";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  BackHandler,
  TouchableOpacity,
  Animated,
  StatusBar,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  FastReliableIllustration,
  YourRouteIllustration,
  PaySeatIllustration,
} from "./illustrations";

// Matches the "FIKA Onboarding" claude.ai/design prototype: gold radial
// glow behind a floating illustration, a fixed teal bottom sheet holding
// title/description/pagination/CTA, Skip jumps to the last slide (not
// straight to login) so the value prop + "Log in" link are still seen.
const SLIDES = [
  {
    id: "1",
    Illustration: FastReliableIllustration,
    title: "Fast and reliable",
    description:
      "We match you with a nearby driver in moments — no waiting, no guessing, just a smooth start to every trip.",
  },
  {
    id: "2",
    Illustration: YourRouteIllustration,
    title: "Your ride, your route",
    description:
      "Set your pickup and destination your way — premium comfort, shaped entirely around your schedule.",
  },
  {
    id: "3",
    Illustration: PaySeatIllustration,
    title: "Pay for just the seat",
    description:
      "Share the ride and split the fare. You only pay for the seat you take — never a krona more.",
  },
];

function FloatingIllustration({ Illustration }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Illustration />
    </Animated.View>
  );
}

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [backClickCount, setBackClickCount] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(0);
  const isLastSlide = currentScreen === SLIDES.length - 1;

  const backAction = () => {
    if (backClickCount === 1) {
      BackHandler.exitApp();
    } else {
      setBackClickCount(1);
      setTimeout(() => setBackClickCount(0), 1000);
    }
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => subscription.remove();
    }, [backAction])
  );

  const scrollToIndex = (index) => {
    listRef.current?.scrollToIndex({ animated: true, index });
    setCurrentScreen(index);
  };

  const goToLogin = () => navigation.push("auth/loginScreen");

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Gold radial glow behind the illustration area */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Wordmark + Skip */}
      <View style={[styles.headerRow, { top: insets.top + 12 }]}>
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkBadge}>
            <View style={styles.wordmarkDot} />
          </View>
          <Text style={styles.wordmarkText}>FIKA</Text>
        </View>
        {!isLastSlide && (
          <TouchableOpacity onPress={() => scrollToIndex(SLIDES.length - 1)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentScreen(page);
        }}
        style={styles.slideList}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.illustrationArea}>
              <FloatingIllustration Illustration={item.Illustration} />
            </View>
          </View>
        )}
      />

      {/* Fixed teal sheet: title/description (driven by currentScreen, not
          the FlatList) + pagination + CTA + login link */}
      <View style={styles.sheet}>
        <LinearGradient
          colors={["rgba(212,175,55,0.10)", "rgba(212,175,55,0)"]}
          style={styles.sheetTopGlow}
        />
        <Text style={styles.title}>{SLIDES[currentScreen].title}</Text>
        <Text style={styles.description}>{SLIDES[currentScreen].description}</Text>

        <View style={styles.dotsRow}>
          {SLIDES.map((item, index) => (
            <TouchableOpacity key={item.id} onPress={() => scrollToIndex(index)}>
              <View style={[styles.dot, index === currentScreen && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => (isLastSlide ? goToLogin() : scrollToIndex(currentScreen + 1))}
        >
          <LinearGradient
            colors={["#EFB155", "#E8A33D"]}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{isLastSlide ? "Get started" : "Next"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {backClickCount === 1 && (
        <View style={styles.exitInfoWrap}>
          <Text style={styles.exitInfoText}>Press Back Once Again To Exit!</Text>
        </View>
      )}
    </View>
  );
};

export default OnboardingScreen;

const SHEET_HEIGHT = Math.min(screenHeight * 0.48, 430);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creamBackground,
  },
  glow: {
    position: "absolute",
    top: screenHeight * 0.08,
    left: "50%",
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(212,175,55,0.13)",
  },
  headerRow: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordmarkBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.2,
    borderColor: Colors.secondaryColor,
  },
  wordmarkText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
    color: Colors.primaryColor,
    fontFamily: "Montserrat_Bold",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#8A8175",
    fontFamily: "Montserrat_SemiBold",
  },
  slideList: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
  },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: SHEET_HEIGHT * 0.55,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.primaryColor,
    borderTopLeftRadius: Sizes.fixPadding * 4.0,
    borderTopRightRadius: Sizes.fixPadding * 4.0,
    paddingHorizontal: Sizes.fixPadding * 2.5,
    paddingTop: Sizes.fixPadding * 4.0,
    overflow: "hidden",
  },
  sheetTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.creamBackground,
    fontFamily: "Montserrat_Bold",
  },
  description: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: "rgba(250,247,242,0.74)",
    fontFamily: "Montserrat_Medium",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Sizes.fixPadding * 3.0,
    marginBottom: Sizes.fixPadding * 2.0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(250,247,242,0.32)",
  },
  dotActive: {
    width: 26,
    backgroundColor: Colors.secondaryColor,
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: 17,
    alignItems: "center",
    shadowColor: Colors.secondaryColor,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#2A1F06",
    fontFamily: "Montserrat_SemiBold",
  },
  exitInfoWrap: {
    backgroundColor: Colors.blackColor,
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    borderRadius: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    zIndex: 200,
  },
  exitInfoText: {
    color: Colors.whiteColor,
    fontFamily: "Montserrat_Medium",
    fontSize: 14,
  },
});
