
const rides = new Map();

function createRide(data) {
  const rideId = "ride_" + Date.now();

  const ride = {
    id: rideId,
    riders: data.riders,
    driver: null,
    status: "MATCHED",
    route: data.route,
    eta: data.eta
  };

  rides.set(rideId, ride);
  return ride;
}

function getRide(id) {
  return rides.get(id);
}

function updateRide(id, updates) {
  const ride = rides.get(id);
  if (!ride) return null;

  Object.assign(ride, updates);
  return ride;
}

module.exports = { createRide, getRide, updateRide };