// routes/driverRegRoutes.js
const express = require('express');
const router = express.Router();
const DriverRegController = require('../controllerz/driverRegController');
const { authenticateDriver } = require('../middleware/auth');

// Public routes
router.post('/register', DriverRegController.registerDriver.bind(DriverRegController));
router.post('/login', DriverRegController.driverLogin.bind(DriverRegController));

// Protected routes (require authentication)
router.get('/profile', authenticateDriver, DriverRegController.getDriverProfile.bind(DriverRegController));
router.put('/profile', authenticateDriver, DriverRegController.updateDriverProfile.bind(DriverRegController));
router.delete('/account', authenticateDriver, DriverRegController.deleteDriverAccount.bind(DriverRegController));

module.exports = router;