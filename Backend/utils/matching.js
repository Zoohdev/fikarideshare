const h3 = require("h3-js");

// Mock store (replace with your real store/db)
const locationStore = require("../store/locationStore");
/**
 * Find nearby drivers using H3 indexing
 * @param {number} lat - rider latitude
 * @param {number} lng - rider longitude
 * @param {number} radius - search radius (hex rings)
 */
const findNearbyDriver = (lat, lng, radius = 1) => {
  try {
    const resolution = 9; // balance between precision & performance

    //  Convert rider location → H3 index
    const riderIndex = h3.latLngToCell(lat, lng, resolution);

    //  Get nearby hex cells
    const nearbyCells = h3.gridDisk(riderIndex, radius);

    //  Get all drivers
    const drivers = locationStore.getAllDrivers();

    console.log(" Rider H3:", riderIndex);
    console.log(" Nearby cells:", nearbyCells.length);
    console.log(" Total drivers:", drivers.length);

    //  Filter drivers inside nearby cells
    const nearbyDrivers = drivers.filter((driver) => {
      const driverIndex = h3.latLngToCell(driver.lat, driver.lng, resolution);
      return nearbyCells.includes(driverIndex);
    });

    console.log(" Nearby drivers found:", nearbyDrivers.length);

    return nearbyDrivers;
  } catch (error) {
    console.error(" findNearbyDriver error:", error);
    return [];
  }
};

module.exports = { findNearbyDriver };