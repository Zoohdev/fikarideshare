const { getRoute } = require("./route");
const { calculateAngle } = require("./utils");

const PICKUP_ANGLE = 100;
const DEST_ANGLE = 100;
const BUFFER = 15;


async function isValidMatch(route, rider, baseEta, waypoints) {

    console.log(`\n🔍 Checking rider: ${rider.name}`);
  
    const reasons = [];
  
  
    // 2. PICKUP ANGLE
    const pickupAngle = calculateAngle(
      route.pickup,
      route.destination,
      rider.pickup
    );
  
    if (pickupAngle > PICKUP_ANGLE) {
      reasons.push(`PICKUP ANGLE ${pickupAngle.toFixed(2)}°`);
    }
  
    // 3. DESTINATION ANGLE
    const destAngle = calculateAngle(
      route.pickup,
      route.destination,
      rider.destination
    );
  
    if (destAngle > DEST_ANGLE) {
      reasons.push(`DESTINATION ANGLE ${destAngle.toFixed(2)}°`);
    }
  
    // 4. ROUTE TEST
    const newWaypoints = [...waypoints, rider.pickup];
  
    const result = await getRoute(
      route.pickup,
      route.destination,
      newWaypoints
    );
  
    if (!result) {
      reasons.push("ROUTE FAILED");
    }
  
    let newEta = result?.eta || Infinity;
  
    // 5. DETOUR
    if (newEta > baseEta + BUFFER) {
      reasons.push(`DETOUR TOO HIGH (${newEta.toFixed(2)})`);
    }
  
    //  FINAL DECISION
    if (reasons.length > 0) {
      console.log(`❌ ${rider.name} rejected → ${reasons.join(", ")}`);
      return null;
    }
  
    console.log(
      ` ${rider.name} accepted → ETA: ${newEta.toFixed(2)}`
    );
  
    return {
      rider,
      eta: newEta,
      detour: newEta - baseEta
    };
  }
/* ================================
   GENERATE VALID SEQUENCES (ONLY OTHER RIDERS)
================================ */
function generateValidSequences(riders) {
  const results = [];

  function backtrack(path, picked, dropped) {
    if (path.length === riders.length * 2) {
      results.push([...path]);
      return;
    }

    for (let i = 0; i < riders.length; i++) {

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

  backtrack(
    [],
    Array(riders.length).fill(false),
    Array(riders.length).fill(false)
  );

  return results;
}

/* ================================
   COMBINATIONS (FOR CAPACITY)
================================ */
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

/* ================================
   BUILD BEST ROUTE
================================ */
async function findBestRoute(origin, riders, mainRider) {

  const sequences = generateValidSequences(riders);
  let best = null;

  for (let seq of sequences) {

    //  BUILD FULL STEPS (MAIN RIDER FIXED)
    const steps = [];

    // pickups first
    seq.forEach(s => {
      if (s.type === "pickup") steps.push(s);
    });

    //  main rider drop in middle
    steps.push({ type: "drop", rider: mainRider });

    // then drops
    seq.forEach(s => {
      if (s.type === "drop") steps.push(s);
    });

    //  BUILD WAYPOINTS
    const waypoints = [];
    const seen = new Set();

    steps.forEach((step, index) => {

      if (index === steps.length - 1) return;

      const coord =
        step.type === "pickup"
          ? step.rider.pickup
          : step.rider.destination;

      const key = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;

      if (seen.has(key)) return;

      seen.add(key);
      waypoints.push(coord);
    });

    const finalDest = steps[steps.length - 1].rider.destination;

    const route = await getRoute(origin, finalDest, waypoints);
    if (!route) continue;

    // DEBUG
    console.log(
      "SEQUENCE:",
      steps.map(s => `${s.type}-${s.rider.name}`).join(" → ")
    );
    console.log("ETA:", route.eta);
    console.log("----------------------");

    if (!best || route.eta < best.eta) {
      best = {
        sequence: steps,
        eta: route.eta,
        waypoints,
        finalDest
      };
    }
  }

  return best;
}

/* ================================
   MAIN MATCH FUNCTION
================================ */
async function findBestMatch(r1, riders,seats) {

  const baseRoute = await getRoute(r1.pickup, r1.destination);
  if (!baseRoute) return [];

  const baseEta = baseRoute.eta;

  let selected = [];

  //  FILTER VALID RIDERS
  for (let r of riders) {
    const result = await isValidMatch(r1, r, baseEta, []);
    if (result) selected.push(r);
  }

  if (!selected.length) {
    return null;   
  }

  const capacity = seats || 3;

  let bestOverall = null;

  const combos = getCombinations(selected, capacity - 1);

  for (let group of combos) {

    const route = await findBestRoute(
      r1.pickup,
      group,       
      r1            
    );

    if (!route) continue;

    if (!bestOverall || route.eta < bestOverall.eta) {
      bestOverall = route;
    }
  }

  if (!bestOverall) {
    return {
      assigned: [r1],
      eta: baseEta,
      waypoints: []
    };
  }

  const finalAssigned = [
    r1,
    ...bestOverall.sequence
      .filter(s => s.type === "pickup")
      .map(s => s.rider)
  ];

  return {
    assigned: finalAssigned,
    sequence: bestOverall.sequence.map(s => ({
      type: s.type,
      name: s.rider.name
    })),
    eta: bestOverall.eta,
    waypoints: bestOverall.waypoints,
    finalDest: bestOverall.finalDest
  };
}

module.exports = {
  findBestMatch,
  isValidMatch,
  findBestRoute,
  generateValidSequences,
  getCombinations
};