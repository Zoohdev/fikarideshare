// Single source of truth for vehicle-tier metadata, matching the backend's
// Ride.vehicle_type_requested choices (economy/comfort/premium/xl) exactly.
// Previously duplicated and inconsistent: homeScreen.js requested estimates
// for all 4 tiers, but availableRidesScreen.js's display array only had 3
// (no 'xl' entry, so an XL estimate was fetched but never shown), and the
// display names/seat counts were hardcoded separately from each other.
export const VEHICLE_TYPES = [
  {
    key: "economy",
    name: "Fika go",
    description: "Affordable everyday rides",
    seats: 2,
    premium: false,
  },
  {
    key: "comfort",
    name: "Fika comfort",
    description: "Newer cars, more legroom",
    seats: 3,
    premium: false,
  },
  {
    key: "premium",
    name: "Fika luxury",
    description: "Premium cars, top drivers",
    seats: 3,
    premium: true,
  },
  {
    key: "xl",
    name: "Fika XL",
    description: "Extra seats for groups",
    seats: 6,
    premium: false,
  },
];

export const VEHICLE_TYPE_KEYS = VEHICLE_TYPES.map((v) => v.key);

export function getVehicleType(key) {
  return VEHICLE_TYPES.find((v) => v.key === key) || VEHICLE_TYPES[0];
}

export default VEHICLE_TYPES;
