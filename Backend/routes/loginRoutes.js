const express = require("express");
const router = express.Router();
const loginController = require("../controllerz/loginController");

// Test route
router.get("/test", loginController.test);

// Login routes
// router.post("/send-otp", loginController.sendLoginOtp);
// router.post("/verify-login", loginController.verifyLoginOtp);
router.post("/login", loginController.directLogin);
router.get("/cleanup-old-otps", loginController.cleanupOldOtps);

// Debug routes
router.get("/debug/pending-logins", loginController.getPendingLogins);
router.get("/debug/users", loginController.getAllUsers);

module.exports = router;