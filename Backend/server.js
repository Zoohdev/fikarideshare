


const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: { origin: "*" }
});

async function handleSoloRide(socket, rider) {

  const driver = findNearbyDrivers(
    rider.pickup.lat,
    rider.pickup.lng,
    1
  )[0];

  if (!driver) {
    socket.emit("no-driver");
    return;
  }

  const rideId = "ride_" + Date.now();

  global.rides[rideId] = {
    type: "solo",
    rider: { ...rider, socketId: socket.id },
    driver,
    status: "REQUESTED"
  };

  const driverSocketId = global.driverSockets.get(driver.id);

  io.to(driverSocketId).emit("ride-request", {
    rideId,
    rider
  });
}



async function handleSharedRide(socket, rider, seats = 3) {

  global.pendingRiders.push({
    ...rider,
    socketId: socket.id,
    timestamp: Date.now()
  });

  console.log("👥 SHARED RIDE FLOW");
  console.log("Pending riders:", global.pendingRiders.length);

  socket.emit("waiting-for-match");

  //  WAIT 30 seconds
  setTimeout(async () => {

    const riders = global.pendingRiders;

    if (riders.length < 2) {
      socket.emit("no-match", {
        message: "No riders found for sharing"
      });

      global.pendingRiders = [];
      return;
    }

    const main = riders[0];
    const candidates = riders.slice(1);

    const match = await findBestMatch(main, candidates, seats);

    if (!match || match.assigned.length < 2) {
      socket.emit("no-match", {
        message: "Matching failed"
      });

      global.pendingRiders = [];
      return;
    }

    const driver = findNearbyDriver(
      main.pickup.lat,
      main.pickup.lng,
      1
    )[0];

    const rideId = "ride_" + Date.now();

    global.rides[rideId] = {
      type: "shared",
      riders: match.assigned,
      driver
    };

    const driverSocketId = global.driverSockets.get(driver.id);

    io.to(driverSocketId).emit("ride-request", {
      rideId,
      riders: match.assigned
    });

    global.pendingRiders = [];

  }, 30000); //  30 sec
}

global.pendingRiders = [];
global.rides = {};
global.driverSockets = new Map();

io.on("connection", (socket) => {

  console.log("🔌 Connected:", socket.id);


  socket.on("register-driver", (data) => {
    console.log(" Driver registered:", data.id);
    global.driverSockets.set(data.id, socket.id);
  });


  socket.on("request-ride", async (data) => {

    const { rideType, rider } = data;

    console.log(" Ride request:", rideType);

    if (rideType === "solo") {
      await handleSoloRide(socket, rider);
    } else {
      await handleSharedRide(socket, rider);
    }

  });


  socket.on("driver-accept", ({ rideId }) => {

    const ride = global.rides[rideId];
    if (!ride) return;

    ride.status = "CONFIRMED";

    console.log(" Driver accepted ride:", rideId);

    if (ride.type === "solo") {

      io.to(ride.rider.socketId).emit("rideAccepted", {
        rideId,
        driverId: ride.driver.id
      });

    } else {

      ride.riders.forEach(r => {
        io.to(r.socketId).emit("rideAccepted", {
          rideId,
          driverId: ride.driver.id
        });
      });

    }

  });

});


server.listen(3000, () => {
  console.log("Server running on 3000");
});
