
const locationStore = require("../store/locationStore");
const db = require("../db");

//  Global maps (ONLY HERE)
global.riderSockets = global.riderSockets || new Map();
global.driverSockets = global.driverSockets || new Map();
// global.pendingTrips =global.pendingTrips || new Map();

const socketHandler = (io) => {
  global.io = io; // make globally accessible

  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // =========================
    // REGISTER RIDER
    // =========================
    // socket.on("register-rider", ({ riderId }) => {
    //   if (!riderId) {
    //     console.log(" Invalid riderId");
    //     return;
    //   }
    //   const id = riderId.toString();   
    //   // global.riderSockets.set(riderId, socket.id);
    //   global.riderSockets.set(id, socket.id);

    //   console.log(" Rider registered:", riderId);
    //   console.log(" riderSockets:", global.riderSockets);
    // });
    socket.on(
      "register-rider",
      ({ riderId }) => {
    
        console.log(
          "🧍 rider registered:",
          riderId
        );
    
        global.riderSockets.set(
          riderId.toString(),
          socket.id
        );
    
      }
    );
    // =========================
    // REGISTER DRIVER
    // =========================
    socket.on("register-driver", ({ driverId }) => {

      const finalId = Number(driverId);
    
      if (!finalId || isNaN(finalId)) {
    
        console.log(
          " Invalid driverId:",
          driverId
        );
    
        return;
      }
    
      global.driverSockets.set(
        finalId,
        socket.id
      );
    
      console.log(
        " Driver registered:",
        finalId
      );
    
      console.log(
        " driverSockets:",
        Array.from(
          global.driverSockets.entries()
        )
      );
    });

    // =========================
    //  DRIVER LOCATION
    // =========================
    socket.on("driver-location", ({ driverId, lat, lng }) => {
      const id = Number(driverId);

if (!id || isNaN(id)) {

  console.log(
    " Invalid driverId:",
    driverId
  );

  return;
}

      if (isNaN(id) || lat == null || lng == null) {
        console.log(" Invalid driver location:", {
          driverId,
          lat,
          lng,
        });
        return;
      }

      locationStore.setLocation(id, lat, lng, "driver");

      console.log(" Drivers:", locationStore.getAllDrivers());
    });
    
    // =========================
    //  RIDER LOCATION
    // =========================
    socket.on("send-location", ({ riderId, lat, lng }) => {
      const id = Number(riderId);

      if (isNaN(id) || lat == null || lng == null) {
        console.log(" riderId is NaN or invalid:", riderId);
        return;
      }

      locationStore.setLocation(id, lat, lng, "rider");

      console.log(" Riders:", locationStore.getAll());
    });

    // =========================
    // 🚗 DRIVER ACCEPT RIDE
    // =========================
//     socket.on(
//       "acceptRide",
//       async ({ trip_id, driver }) => {
    
//         console.log(
//           ` Driver accepted trip ${trip_id}`
//         );
    
//         if (!trip_id || !driver?.id) {
    
//           console.log(
//             "Invalid accept payload"
//           );
    
//           socket.emit(
//             "acceptRideError",
//             {
//               message:
//                 "Invalid payload"
//             }
//           );
    
//           return;
//         }
    
//         // find pending trip
//         const pendingTrip =
//           global.pendingTrips?.get(
//             trip_id
//           );
    
//         if (!pendingTrip) {
    
//           socket.emit(
//             "acceptRideError",
//             {
//               message:
//                 "Trip expired"
//             }
//           );
    
//           return;
//         }
    
//         // update DB
//         db.run(
//           `UPDATE trips
//            SET driver_id = ?,
//            trip_status = 'accepted'
//            WHERE trip_id = ?`,
//           [
//             driver.id,
//             trip_id
//           ],
//           function (err) {
    
//             if (err) {
    
//               console.error(
//                 "❌ DB Error:",
//                 err
//               );
    
//               socket.emit(
//                 "acceptRideError",
//                 {
//                   message:
//                     "Database error"
//                 }
//               );
    
//               return;
//             }
    
//             console.log(
//               "🚗 Trip assigned successfully"
//             );
    
//             // notify other drivers
//             io.emit(
//               "rideTaken",
//               {
//                 tripId: trip_id
//               }
//             );
    
//             // resolve waiting promise
//             // notify accepted driver
// socket.emit(
//   "rideAccepted",
//   {

//     trip_id,

//     driver,

//     match: pendingTrip.match,

//     sequence:
//       pendingTrip.match.sequence,

//     riders:
//       pendingTrip.match.assignedRiders,

//     eta:
//       pendingTrip.match.eta,

//     route:
//       pendingTrip.match.route

//   }
// );

// // resolve AFTER emit
// pendingTrip.resolve({

//   driver,

//   match: pendingTrip.match

// });

// // NOW remove
// setTimeout(() => {

//   global.pendingTrips.delete(
//     trip_id
//   );

// }, 1000);
    
//           }
//         );
    
//       }
//     );

    // =========================
    //  DRIVER REJECT
    // =========================
    socket.on("rejectRide", ({ driverId, tripId }) => {
      console.log(`Driver ${driverId} rejected trip ${tripId}`);
    });

    // =========================
    // DISCONNECT CLEANUP
    // =========================
    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);

      // 🔥 Remove rider
      for (let [riderId, sId] of global.riderSockets.entries()) {
        if (sId === socket.id) {
          global.riderSockets.delete(riderId);
          console.log("🗑 Removed rider:", riderId);
        }
      }

      // 🔥 Remove driver
      for (let [driverId, sId] of global.driverSockets.entries()) {
        if (sId === socket.id) {
          global.driverSockets.delete(driverId);
          console.log("🗑 Removed driver:", driverId);
          locationStore.removeDriver(driverId);
        }
      }
    });
  });
};

module.exports = socketHandler;