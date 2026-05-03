const { io } = require("socket.io-client");
const readline = require("readline");


const socket = io("http://192.168.0.9:3000", {
  transports: ["websocket"]
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DRIVER_ID = 1;


let isBusy = false;


socket.on("connect", () => {
  console.log(" Connected to server");
  console.log(" Socket ID:", socket.id);

  socket.emit("register-driver", {
    driverId: DRIVER_ID
  });

  console.log(" Driver registered:", DRIVER_ID);
});


socket.on("ride-request", (data) => {

  if (isBusy) {
    console.log("Already handling a request, ignoring new one");
    return;
  }

  isBusy = true;



  console.log("Ride ID:", data.tripId);

  if (data.rider) {
    console.log("👤 Solo Rider:");
    console.log(data.rider);
  }

  if (data.riders) {
    console.log("👥 Shared Riders:");
    data.riders.forEach((r, i) => {
      console.log(`  ${i + 1}.`, r.name || r.id || "Rider");
    });
  }

  if (data.route) {
    console.log("🗺 Route ETA:", data.route.eta);
  }


  rl.question("\nAccept ride? (1 = Yes, 2 = No): ", (answer) => {

    if (answer === "1") {

      socket.emit("acceptRide", {
        rideId: data.rideId
      });

      console.log(" Ride ACCEPTED");

    } else {

      socket.emit("rejectRide", {
        rideId: data.rideId
      });

      console.log(" Ride REJECTED");
    }

    isBusy = false;
  });

});


socket.on("disconnect", () => {
  console.log("Disconnected:", socket.id);

  for (let [driverId, sockId] of global.driverSockets.entries()) {
    if (sockId === socket.id) {
      global.driverSockets.delete(driverId);
      console.log("🗑 Removed driver:", driverId);
    }
  }
});


socket.on("connect_error", (err) => {
  console.log(" Connection error:", err.message);
});

