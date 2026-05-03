const express = require('express');
const router = express.Router();
const rideController = require('../controllerz/rideController');

// Public routes
router.get('/available', rideController.getAvailableRides);


// Trip routes
router.post('/trips', rideController.createTrip);
router.get('/trips/:tripId', rideController.getTripById);
router.put('/trips/:tripId/status', rideController.updateTripStatus);
router.post('/trips/:tripId/cancel', rideController.cancelTrip);
router.get('/trips/estimate/fare', rideController.estimateFare);

// Rider-specific routes
router.get('/riders/:riderId/trips', rideController.getTripsByRider);
router.get('/riders/:riderId/trips/active', rideController.getActiveTrip);

// Driver-specific routes
router.get('/drivers/:driverId/trips', rideController.getTripsByDriver);
router.post("/ride/request", rideController.requestRide);

router.post("/request", rideController.requestRide);
router.get("/debug/riders", rideController.getAllRidersDebug);
module.exports = router;