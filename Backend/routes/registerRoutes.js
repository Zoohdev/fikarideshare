const express = require("express");
const router = express.Router();
const registerController = require("../controllerz/registerController");


// Registration routes
router.post("/register-request", registerController.registerRequest);
router.post("/verify-email", registerController.verifyEmail);
router.post("/verify-phone", registerController.verifyPhone);
router.post("/complete-registration", registerController.completeRegistration);



// Debug routes
router.get("/debug/pending-users", registerController.getPendingUsers);

module.exports = router;