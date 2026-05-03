

const { getRoute } = require("./route");
const { calculateAngle } = require("./utils");

const PICKUP_ANGLE = 45;
const DEST_ANGLE = 60;
const BUFFER = 15;

// Validate rider
async function isValidMatch(route, rider, baseEta, waypoints) {

  const pickupAngle = calculateAngle(
    route.pickup,
    route.destination,
    rider.pickup
  );

  if (pickupAngle > PICKUP_ANGLE) return null;

  const destAngle = calculateAngle(
    route.pickup,
    route.destination,
    rider.destination
  );

  if (destAngle > DEST_ANGLE) return null;

  // Try adding this rider to current waypoints
  const newWaypoints = [...waypoints, rider.pickup];

  const result = await getRoute(
    route.pickup,
    route.destination,
    newWaypoints
  );

  if (!result) return null;

  const newEta = result.eta;

  if (newEta > baseEta + BUFFER) return null;
  const isSamePickup =
  Math.abs(route.pickup.lat - rider.pickup.lat) < 0.0001 &&
  Math.abs(route.pickup.lng - rider.pickup.lng) < 0.0001;

if (isSamePickup) {
  return null;
}

  return {
    rider,
    eta: newEta,
    detour: newEta - baseEta,
    waypoints: newWaypoints
  };
}

function getPermutations(arr) {
  if (arr.length <= 1) return [arr];

  const perms = [];

  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    const restPerms = getPermutations(rest);

    for (let perm of restPerms) {
      perms.push([arr[i], ...perm]);
    }
  }

  return perms;
}

function getCombinations(arr, k) {
  const result = [];

  function backtrack(start, path) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}

async function findBestRoute(origin, riders) {

  // ✅ ensure ONLY selected riders are used
const cleanRiders = riders.map(r => ({
  name: r.name,
  pickup: r.pickup,
  destination: r.destination
}));

const sequences = generateValidSequences(cleanRiders);

  let best = null;

  
  for (let seq of sequences) {

    const waypoints = [];
const seen = new Set();

seq.forEach((step, index) => {

  //  skip last (final destination)
  if (index === seq.length - 1) return;

  // skip main rider pickup completely
  if (
    step.type === "pickup" &&
    step.rider.name === riders[0].name
  ) return;

  const coord =
    step.type === "pickup"
      ? step.rider.pickup
      : step.rider.destination;

  const key = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;

  if (seen.has(key)) return;

  seen.add(key);
  waypoints.push(coord);
});
  
    const finalDestStep = seq[seq.length - 1];
  
    // ensure valid route ends with drop
    if (finalDestStep.type !== "drop") continue;
  
    const finalDest = finalDestStep.rider.destination;
  
    const route = await getRoute(origin, finalDest, waypoints);
    if (!route) continue;
  
    // DEBUG HERE
    console.log(
      "SEQUENCE:",
      seq.map(s => `${s.type}-${s.rider.name}`).join(" → ")
    );
    console.log("ETA:", route.eta);
    console.log("----------------------");
  
    const penalty = calculateFairnessPenalty(seq, {});
    const score = route.eta + penalty;
  
    if (!best || score < best.score) {
      best = {
        sequence: seq,
        eta: route.eta,
        score,
        waypoints,
        finalDest
      };
    }
  }
  return best;
}
function generateValidSequences(riders) {
  const results = [];

  function backtrack(path, picked, dropped) {

    if (path.length === (riders.length * 2) - 1) {
      results.push([...path]);
      return;
    }

    for (let i = 0; i < riders.length; i++) {

      //MAIN RIDER (index 0)
      if (i === 0) {
        //  never pickup
        if (picked[i] && !dropped[i]) {
          dropped[i] = true;
          path.push({ type: "drop", rider: riders[i] });

          backtrack(path, picked, dropped);

          path.pop();
          dropped[i] = false;
        }
        continue;
      }

      // PICKUP
      if (!picked[i]) {
        picked[i] = true;
        path.push({ type: "pickup", rider: riders[i] });

        backtrack(path, picked, dropped);

        path.pop();
        picked[i] = false;
      }

      // DROP
      if (picked[i] && !dropped[i]) {
        dropped[i] = true;
        path.push({ type: "drop", rider: riders[i] });

        backtrack(path, picked, dropped);

        path.pop();
        dropped[i] = false;
      }
    }
  }

  const picked = Array(riders.length).fill(false);
  const dropped = Array(riders.length).fill(false);

  picked[0] = true; // main rider already picked

  backtrack([], picked, dropped);

  return results;
}

async function findBestMatch(r1, riders) {

  const baseRoute = await getRoute(r1.pickup, r1.destination);
  if (!baseRoute) return [];

  let baseEta = baseRoute.eta;

  let selected = [];

  // Step 1: Filter riders
  for (let r of riders) {
    const result = await isValidMatch(r1, r, baseEta, []);
    if (result) selected.push(r);
  }

  if (!selected.length) {
    return {
      assigned: [r1],
      eta: baseEta,
      waypoints: []
    };
  }

  // Step 2: Optimize full route
  const capacity = 3; // including r1

  let bestOverall = null;
  
  const combos = getCombinations(selected, capacity - 1);
  
  for (let group of combos) {
  
    const route = await findBestRoute(
      r1.pickup,
      [r1, ...group]
    );
  
    if (!route) continue;
  
    if (!bestOverall || route.eta < bestOverall.eta) {
      bestOverall = route;
    }
  }
  
  const bestRoute = bestOverall;

  if (!bestRoute) {
    return {
      assigned: [r1],
      eta: baseEta,
      waypoints: []
    };
  }

  // Extract pickup order
  const orderedRiders = [];
  bestRoute.sequence.forEach(step => {
    if (step.type === "pickup") {
      orderedRiders.push(step.rider);
    }
  });

  const finalAssigned = bestRoute.sequence
  .filter(s => s.type === "pickup")
  .map(s => s.rider);

  console.log("BEST ROUTE:", bestRoute);

  return {
    assigned: finalAssigned,
    sequence: bestRoute.sequence.map(s => ({
      type: s.type,
      name: s.rider.name
    })),
    eta: bestRoute.eta,
    waypoints: bestRoute.waypoints,
    finalDest: bestRoute.finalDest   // 🔥 ADD
  };
}


function calculateFairnessPenalty() {
  return 0;
}


module.exports = { findBestMatch };