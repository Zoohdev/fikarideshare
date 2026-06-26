import api from "./api";

// Status -> destination screen for landing on an in-progress ride instead
// of the generic home screen, whether that's right after logging in or on
// a cold app relaunch with an existing session. Without this, both paths
// always went straight to home regardless of ride state, so an active
// ride's OTP/tracking screen became unreachable - there was no way back in
// except waiting for the ride to expire/be cancelled.
export function resumeRoute(ride, myUserId) {
  const role = String(ride.driver?.id) === String(myUserId) ? "driver" : "rider";

  if (role === "rider" && ride.status === "in_progress") {
    return { pathname: "/rideTracking/riderInTripScreen", params: { rideId: ride.id, role } };
  }

  const params = { rideId: ride.id, role };
  if (ride.ride_type === "shared") params.ride_type = "shared";
  return { pathname: "/rideTracking/rideTrackingScreen", params };
}

// Given an authenticated user's profile, returns the route they should
// land on: their active ride if one exists, otherwise their home screen.
export async function getPostAuthRoute(profile) {
  try {
    const activeRes = await api.get("/rides/trips/active/");
    return resumeRoute(activeRes.data, profile.id);
  } catch (err) {
    // 404 = no active ride, the normal case.
    return profile.is_driver ? "/(driverTabs)/home/homeScreen" : "/(tabs)/home/homeScreen";
  }
}
