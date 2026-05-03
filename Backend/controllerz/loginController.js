const db = require("../db");




// // Clean up old OTPs (optional - can be run periodically for maintenance)
exports.cleanupOldOtps = (req, res) => {
  db.run("DELETE FROM pending_logins WHERE created_at < datetime('now', '-1 day')", function(err) {
    if (err) {
      console.error("Cleanup error:", err);
      return res.status(500).json({ message: "Cleanup failed" });
    }
    console.log(`Cleaned up ${this.changes} old OTPs (older than 1 day)`);
    return res.json({ message: `Cleaned up ${this.changes} old OTPs` });
  });
};

// Debug route for pending logins
exports.getPendingLogins = (req, res) => {
  db.all("SELECT * FROM pending_logins", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Debug route for all users
exports.getAllUsers = (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// // Test route
// exports.test = (req, res) => res.send("API working");

exports.directLogin = (req, res) => {
  const { phone } = req.body;

  console.log("Direct login attempt for:", phone);

  if (!phone) {
    return res.status(400).json({
      message: "Missing phone number",
    });
  }

  db.get(
    "SELECT * FROM users WHERE phone = ?",
    [phone],
    (err, user) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({
          message: "DB error",
        });
      }

      if (!user) {
        console.log("User not found:", phone);

        return res.status(404).json({
          message: "User not registered",
        });
      }

      console.log("User found:", user);


      if (user.role_id === 1) {

        return res.json({

          message: "Driver login successful",

          userId: user.user_id,

          roleId: user.role_id,

          driverId: user.user_id
        });
      }

      // 👤 RIDER
      else {

        return res.json({

          message: "Rider login successful",

          userId: user.user_id,

          roleId: user.role_id,

          riderId: user.user_id
        });
      }
    }
  );
};
exports.test = (req, res) => res.send("API working");