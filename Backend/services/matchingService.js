// matchingService.js
const { getRoute } = require("./route");
const { isValidMatch } = require("./matching");
const { findBestRoute } = require("./matching");
const h3 = require("h3-js");
const matchedRiders = new Map(); 
const axios = require("axios");
const riderStore = new Map(); // riderId → rider
const h3Buckets = {}; // h3Index → riders[]
const MAX_CAPACITY = 3;
function addRider(rider) {
  const h3Index = h3.latLngToCell(rider.pickup.lat, rider.pickup.lng, 8);

  rider.h3 = h3Index;
  riderStore.set(rider.id, rider);
  console.log("✅ riderStore keys:", Array.from(riderStore.keys()));
  if (!h3Buckets[h3Index]) {
    h3Buckets[h3Index] = [];
  }

  h3Buckets[h3Index].push(rider);
}

function removeRider(riderId) {
  const rider = riderStore.get(riderId);
  if (!rider) return;

  riderStore.delete(riderId);

  const bucket = h3Buckets[rider.h3];
  if (bucket) {
    h3Buckets[rider.h3] = bucket.filter(r => r.id !== riderId);
  }
}

// async function matchRider(r1, capacity) {
async function matchRider(r1){
  const nearbyCells = h3.gridDisk(r1.h3, 1);

  let candidates = [];

  for (let cell of nearbyCells) {
    if (h3Buckets[cell]) {
      candidates.push(...h3Buckets[cell]);
    }
  }

  candidates = candidates.filter(r => r.id !== r1.id);

const remainingSeats = MAX_CAPACITY - r1.seats;

  const validGroups = [];

  function backtrack(start, group, usedSeats) {
    if (usedSeats === remainingSeats) {
      validGroups.push([...group]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      const r = candidates[i];
      console.log("Checking candidate:", r.id, riderStore.has(r.id));
      if (!riderStore.has(r.id)) continue; // cancelled

      if (usedSeats + r.seats > remainingSeats) continue;

      group.push(r);
      backtrack(i + 1, group, usedSeats + r.seats);
      group.pop();
    }
  }

  backtrack(0, [], 0);

  if (!validGroups.length) return null;

  const baseRoute = await getRoute(r1.pickup, r1.destination);
  console.log("Route API response:", baseRoute);
  if (!baseRoute) {
    console.log(" Base route failed for rider:", r1.id);
    return null; 
  }
  
  const baseEta = baseRoute.eta;

  let bestMatch = null;

  // STEP F: VALIDATE
  for (let group of validGroups) {
    let valid = true;

    for (let r of group) {
      const res = await isValidMatch(r1, r, baseEta, []);
      if (!res) {
        valid = false;
        break;
      }
    }

    if (!valid) continue;

    const route = await findBestRoute(r1.pickup, group, r1);

    if (!route) continue;

    if (!bestMatch || route.eta < bestMatch.eta) {
      bestMatch = route;
    }
  }

  if (!bestMatch) return null;

  const assignedRiders = [
    r1,
    ...bestMatch.sequence
      .filter(s => s.type === "pickup")
      .map(s => s.rider)
  ];
  
  // BUILD FULL SEQUENCE (IMPORTANT)
  const finalSequence = [];
  
  // 1. Add ALL pickups
  assignedRiders.forEach(r => {
    finalSequence.push({
      type: "pickup",
      riderId: r.id,
      name: r.name,
      lat: r.pickup.lat,
      lng: r.pickup.lng
    });
  });
  
  const formattedSequence = bestMatch.sequence.map(s => ({
    type: s.type,
    riderId: s.rider.id,
    name: s.rider.name,
    lat: s.type === "pickup"
      ? s.rider.pickup.lat
      : s.rider.destination.lat,
    lng: s.type === "pickup"
      ? s.rider.pickup.lng
      : s.rider.destination.lng
  }));
  // 2. Add ALL drops
  assignedRiders.forEach(r => {
    finalSequence.push({
      type: "drop",
      riderId: r.id,
      name: r.name,
      lat: r.destination.lat,
      lng: r.destination.lng
    });
  });



const tripId = "trip_" + Date.now();


const GOOGLE_API_KEY = "AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA";

const origin = `${finalSequence[0].lat},${finalSequence[0].lng}`;
const destination = `${finalSequence[finalSequence.length - 1].lat},${finalSequence[finalSequence.length - 1].lng}`;

const waypoints = finalSequence
  .slice(1, -1)
  .map(p => `${p.lat},${p.lng}`)
  .join("|");

const response = await axios.get(
  "https://maps.googleapis.com/maps/api/directions/json",
  {
    params: {
      origin,
      destination,
      waypoints,
      key: GOOGLE_API_KEY
    }
  }
);

const directions = response.data;

if (!directions.routes || directions.routes.length === 0) {
  console.log("❌ No route found from Google API");
  return null;
}

const legs = directions.routes[0].legs;

const riderETAs = {};
let cumulativeTime = 0;

for (let i = 0; i < finalSequence.length - 1; i++) {

  const nextStop = finalSequence[i + 1];
  const legTime = legs[i].duration.value / 60; // minutes

  cumulativeTime += legTime;

  //  When a rider is dropped → store ETA
  if (nextStop.type === "drop") {
    riderETAs[nextStop.riderId] = cumulativeTime;
  }
}


  return {
    assignedRiders,
    trip_id:tripId,
    eta: bestMatch.eta,
    riderETAs,
    sequence: finalSequence
  };
}

function getAllRiders() {
    return Array.from(riderStore.values());
  }
  
  function getBuckets() {
    return h3Buckets;
  }
  function getMatchedRiders() {
    return Array.from(matchedRiders.values());
  }
  
  function getUnmatchedRiders() {
    return Array.from(riderStore.values());
  }
  module.exports = {
    addRider,
    removeRider,
    matchRider,
    getAllRiders,     
    getBuckets,
    getMatchedRiders,      
  getUnmatchedRiders         
  };
