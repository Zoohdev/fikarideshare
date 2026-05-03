const riderLocations = new Map();
const driverLocations = new Map();

module.exports = {
  setLocation: (id, lat, lng, type = "rider") => {
    if (type === "driver") {
      driverLocations.set(id, { lat, lng });
    } else {
      riderLocations.set(id, { lat, lng });
    }
  },

  getAll: () => riderLocations,

  getAllDrivers: () => {
    return Array.from(driverLocations.entries()).map(([id, loc]) => ({
      id,
      ...loc
    }));
  },
  removeDriver: (driverId) => {

    driverLocations.delete(
      Number(driverId)
    );

    console.log(
      "🗑 Driver removed:",
      driverId
    );
  }
};

