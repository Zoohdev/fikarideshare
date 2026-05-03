require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const nodemailer = require("nodemailer");
const redisClient = require("./redis"); // or wherever you saved it
const driverRegRoutes = require('./routes/driverRegRoutes');
const rideRoutes = require('./routes/rideRoutes');
const socketHandler = require("./socket/socketHandler");
const { findBestMatch } = require("./services/matching");
const { findNearbyDriver } = require("./utils/matching");

const http = require("http");
const { Server } = require("socket.io");

(async () => {
  await redisClient.set("test", "Hello from backend");
  console.log("Value set in Redis");
})();

const faceController = require("./controllerz/faceController");

let twilio;
try {
  twilio = require("twilio");
} catch (e) {
  twilio = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  },
});
const riderLocations = {};

socketHandler(io);
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: "10mb" })); // Increase limit for face embeddings
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.log("📧 Email service: Not configured (check .env file)");
}

// Twilio setup (optional)
let twilioClient = null;
if (
  twilio &&
  process.env.TWILIO_ACCOUNT_SID?.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
} else {
  console.log("📱 SMS service: Not configured (check .env file)");
}

// Add services to request object
app.use((req, res, next) => {
  req.transporter = transporter;
  req.twilioClient = twilioClient;
  req.db = db;
  next();
});

// ===== DIRECT ROUTES (without separate route files) =====

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "✅ Backend is working!" });
});

// Face verification routes
app.post("/api/store-face", faceController.storeFaceEmbedding);
app.post("/api/verify-face", faceController.verifyFace);
app.get(
  "/api/register/verification-status/:email",
  faceController.getVerificationStatus,
);

// Email verification route
app.post("/api/verify-email", (req, res) => {
  const { email, code } = req.body;
  console.log("📧 Email verification attempt for:", email);

  // Check if OTP matches in pending_users
  db.get(
    "SELECT * FROM pending_users WHERE email = ? AND emailOtp = ?",
    [email, code],
    (err, user) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Update email verification status
      db.run(
        "UPDATE pending_users SET emailVerified = 1 WHERE email = ?",
        [email],
        (updateErr) => {
          if (updateErr) {
            console.error("❌ DB update error:", updateErr);
            return res.status(500).json({ message: "Failed to verify email" });
          }

          console.log("✅ Email verified for:", email);
          res.json({ message: "Email verified successfully" });
        },
      );
    },
  );
});

// Phone verification route
app.post("/api/verify-phone", (req, res) => {
  const { phone, code } = req.body;
  console.log("📱 Phone verification attempt for:", phone);

  // Check if OTP matches in pending_users
  db.get(
    "SELECT * FROM pending_users WHERE phone = ? AND phoneOtp = ?",
    [phone, code],
    (err, user) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Update phone verification status
      db.run(
        "UPDATE pending_users SET phoneVerified = 1 WHERE phone = ?",
        [phone],
        (updateErr) => {
          if (updateErr) {
            console.error("❌ DB update error:", updateErr);
            return res.status(500).json({ message: "Failed to verify phone" });
          }

          console.log("✅ Phone verified for:", phone);
          res.json({ message: "Phone verified successfully" });
        },
      );
    },
  );
});


//drivr registration route
app.use('/api/drivers', driverRegRoutes);

//view available rides
app.use('/api/rides', rideRoutes);



/*Mpumi code start*/

/* Driver location api*/
app.post("/driver/location", async (req, res) => {
  const { driver_id, latitude, longitude } = req.body;

  await redisClient.geoAdd("drivers:locations", {
    longitude: longitude,
    latitude: latitude,
    member: driver_id.toString(),
  });

  await redisClient.sAdd("drivers:available", driver_id);

  res.send({ message: "location updated" });
});

/* ==========Getting nearby drivers=============

5 is the default radius for getting drivers closer
*/
global.pendingRiders = [];
global.rides = {};
global.driverSockets = new Map();


async function handleSoloRide(socket, rider) {
  const drivers = findNearbyDriver(
    main.pickup.lat,
    main.pickup.lng,
    5
  );
  
  if (!drivers || drivers.length === 0) {
    console.log("❌ No drivers found nearby");
  
    global.pendingRiders.forEach(r => {
      io.to(r.socketId).emit("no-match", {
        message: "No drivers available"
      });
    });
  
    global.pendingRiders = [];
    return;
  }
  
  const driver = drivers[0]; // safe now


  const rideId = "ride_" + Date.now();

  global.rides[rideId] = {
    type: "solo",
    rider: { ...rider, socketId: socket.id },
    driver
  };

  const driverSocketId = global.driverSockets.get(driver.id);
  if (!driverSocketId) {
    console.log("❌ Driver socket not found for:", driver.id);
    return;
  }
  io.to(driverSocketId).emit("ride-request", {
    rideId,
    rider
  });
}


async function handleSharedRide(socket, rider) {
if (!rider || !rider.pickup || !rider.destination) {
  console.log("❌ Invalid rider data:", rider);
  return;
}
global.pendingRiders.push({
  ...rider,
  socketId: socket.id
});

console.log("👥 Pending riders:", global.pendingRiders.length);

if (global.pendingRiders.length === 1) {
  socket.emit("waiting-for-match");

  setTimeout(() => {
    processSharedRide();
  }, 3000); // 15 sec

  return;
}
if (global.pendingRiders.length >= 2) {
  await processSharedRide();
}
}

async function processSharedRide() {
  const riders = global.pendingRiders;

  if (riders.length < 2) {
    console.log("❌ No match found");

    riders.forEach(r => {
      io.to(r.socketId).emit("no-match", {
        message: "No riders found"
      });
    });

    global.pendingRiders = [];
    return;
  }

  const main = riders[0];
  const candidates = riders.slice(1);

  // 🔥 IMPORTANT: pass seats
  const match = await findBestMatch(main, candidates, 3);
  if (!match || match.assigned.length < 2) {
    console.log("❌ No valid match found");
  
    riders.forEach(r => {
      io.to(r.socketId).emit("no-match", {
        message: "No suitable riders found"
      });
    });
  
    global.pendingRiders = [];
    return;
  }
  console.log("🔥 MATCH FOUND:", match.assigned.length);

  // ✅ FIND DRIVERS
  const drivers = findNearbyDriver(
    main.pickup.lat,
    main.pickup.lng,
    5
  );

  if (!drivers || drivers.length === 0) {
    console.log("❌ No drivers found");

    riders.forEach(r => {
      io.to(r.socketId).emit("no-match", {
        message: "No drivers available"
      });
    });

    global.pendingRiders = [];
    return;
  }

  const rideId = "ride_" + Date.now();

  // ✅ STORE RIDE
  global.rides[rideId] = {
    type: "shared",
    riders: match.assigned,
    drivers,
    status: "SEARCHING"
  };

  // ✅ SEND TO ALL DRIVERS
  drivers.forEach(driver => {
    const driverSocketId = global.driverSockets.get(driver.id);

    if (driverSocketId) {
      io.to(driverSocketId).emit("ride-request", {
        rideId,
        riders: match.assigned
      });
    }
  });

  console.log("🚗 Sent ride request to drivers:", drivers.length);

  global.pendingRiders = [];
}

async function findAvailableDrivers(latitude, longitude, radius = 3) {
  const nearby = await redisClient.geoSearch(
    "drivers:locations",
    { longitude: longitude, latitude: latitude },
    { radius: radius, unit: "km" },
    { COUNT: 10, SORT: "ASC" },
  );

  const drivers = [];

  for (const driverId of nearby) {
    const available = await redisClient.sIsMember(
      "drivers:available",
      driverId,
    );
    if (available) drivers.push(driverId);
  }

  return drivers;
}

/* Api for Creating a ride */
app.post("/api/rides/ride/request", (req, res) => {
  const { riderId } = req.body;

  console.log("📦 Current locations:", riderLocations);

  const location = riderLocations[Number(riderId)];

  if (!location) {
    return res.json({
      success: false,
      message: "Rider location not available",
    });
  }

  res.json({
    success: true,
    location,
  });
});
// -------------------------------------------------------- AFIKA 
// app.post("/ride/request", async (req, res) => {
//   const { riderId, lat, lon } = req.body;

//   const ride = db.run(
//     `
//     INSERT INTO rides
//     (rider_id, pickup_lat, pickup_lon, status, payment_method, payment_status)
//     VALUES (?, ?, ?, 'REQUESTED', 'CASH', 'UNPAID')
//   `,
//     [riderId, lat, lon],
//   );

//   const rideId = ride.lastID;

//   const drivers = await findAvailableDrivers(lat, lon, 3);

//   if (drivers.length === 0) {
//     return res.send({ message: "No drivers nearby" });
//   }

//   const driverId = drivers[0];

//   db.run(
//     `
//     UPDATE rides
//     SET driver_id = ?, status = 'MATCHED'
//     WHERE id = ?
//   `,
//     [driverId, rideId],
//   );

//   await redisClient.sRem("drivers:available", driverId);

//   res.send({
//     rideId,
//     driverId,
//     status: "MATCHED",
//   });
// });


/* driver accepting a ride*/
app.post("/ride/accept", async (req, res) => {
  const { rideId, driverId } = req.body;

  db.run(
    `
    UPDATE rides
    SET status = 'ACCEPTED'
    WHERE id = ? AND driver_id = ?
  `,
    [rideId, driverId],
  );

  res.send({ message: "Ride accepted" });
});

/* driver completes a ride*/
app.post("/ride/complete", async (req, res) => {
  const { rideId } = req.body;

  db.run(
    `
    UPDATE rides
    SET status = 'COMPLETED'
    WHERE id = ?
  `,
    [rideId],
  );

  res.send({
    message: "Ride completed",
    payment_status: "UNPAID (cash)",
  });
});


/* Mpumi code add*/
// Import existing routes
const registerRoutes = require("./routes/registerRoutes");
const loginRoutes = require("./routes/loginRoutes");
//const rideRoutes = require("./routes/rideRoutes");

// Use existing routes
app.use("/", registerRoutes);
app.use("/api", registerRoutes);
app.use("/api/auth", loginRoutes);
//app.use("/api/rides", rideRoutes);







app.set("io", io);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Auth backend listening on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
  console.log(
    `📧 Email service: ${transporter ? "Configured" : "Not configured"}`
  );
  console.log(
    `📱 SMS service: ${twilioClient ? "Configured" : "Not configured"}`
  );
  console.log(`🗄️ Database tables initialized`);
  console.log(`👤 Face verification endpoints: Added`);
  console.log(`⚡ WebSocket server enabled`);
});