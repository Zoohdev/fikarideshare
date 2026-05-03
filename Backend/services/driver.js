const drivers = [];

function addDriver(driver) {
  drivers.push(driver);
}

function updateDriverLocation(id, lat, lng) {
  const d = drivers.find(d => d.id === id);
  if (d) {
    d.lat = lat;
    d.lng = lng;
  }
}

function findNearestDriver(origin) {
  if (!drivers.length) return null;

  return drivers.reduce((best, d) => {
    const dist =
      Math.abs(d.lat - origin.lat) +
      Math.abs(d.lng - origin.lng);

    if (!best || dist < best.dist) {
      return { driver: d, dist };
    }
    return best;
  }, null)?.driver;
}

module.exports = {
  addDriver,
  updateDriverLocation,
  findNearestDriver
};