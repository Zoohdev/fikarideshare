import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission, fetches an Expo push token, and registers it with
 * the backend. No-ops (logs only) on any failure - most commonly because
 * this project has no EAS project linked yet (`eas init` not run), which
 * getExpoPushTokenAsync requires. Must never throw into a caller that
 * doesn't expect it, since this runs right after login/register/app start.
 */
export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log("No EAS project ID configured (run `eas init`) - skipping push token registration");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await api.post("/notifications/push-tokens/", {
      token,
      platform: Platform.OS,
    });

    return token;
  } catch (error) {
    console.log("Push notification registration failed:", error.message || error);
    return null;
  }
}
