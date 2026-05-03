const axios = require("axios");
require("dotenv").config();

const API_KEY = "AIzaSyAwM10scPwotqO_WRQDYbndfFo4fWbriXA";


async function getRoute(origin, destination, waypoints = []) {
  try {
    const waypointStr = waypoints
      .map(p => `${p.lat},${p.lng}`)
      .join("|");

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          waypoints: waypointStr || undefined,
          departure_time: "now",
          key: API_KEY
        }
      }
    );

    const data = response.data;

    if (data.status !== "OK") return null;

    const legs = data.routes[0].legs;

    let totalDuration = 0;

    legs.forEach(leg => {
      totalDuration += leg.duration_in_traffic?.value || leg.duration.value;
    });

    return {
      eta: totalDuration / 60, // minutes
      legs
    };

  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = { getRoute };