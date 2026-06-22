const db = require("../db"); // Adjust path as needed
const h3 = require("h3-js");
const crypto = require("crypto");

const { findNearbyDriver } = require("../utils/matching");
const { findBestMatch } = require("../services/matching");
const locationStore = require("../store/locationStore");
const { addRider, matchRider } = require("../services/matchingService");
const { getAllRiders,getMatchedRiders,getUnmatchedRiders, getBuckets } = require("../services/matchingService");


exports.acceptRide = async (req, res) => {

  const { trip_id, driver } = req.body;
 
    
    
  const pendingTrip =
    global.pendingTrips.get(trip_id);

  if (!pendingTrip) {

    return res.status(404).json({
      success: false,
      message: "Trip expired"
    });

  }

  // resolve waiting promise
  pendingTrip.resolve(driver);

  // remove from pending
  global.pendingTrips.delete(
    trip_id
  );

  return res.json({
    success: true
  });

};

exports.requestRide = async (req, res) => {

  try {

    const rider = req.body;

// fetch real user
const user = await db.getAsync(
  `
  SELECT name
  FROM users
  WHERE user_id = ?
  `,
  [rider.riderId]
);

console.log(
  "USER FROM DB:",
  user
);

// FORCE overwrite frontend fake name
rider.name =
  user?.name || "Unknown Rider";

rider.id =
  rider.riderId.toString();

console.log(
  "FINAL RIDER:",
  rider
);

addRider(rider);

    // Match riders
    const match =
      await matchRider(rider, 3);

    if (!match) {

      return res.json({
        success: false,
        message:
          "Waiting for other riders..."
      });

    }

    // Find pickup point
    const pickupPoint =
      match.sequence.find(
        s => s.type === "pickup"
      );

    // Find nearby drivers
    const nearbyDrivers =
      findNearbyDriver(
        pickupPoint.lat,
        pickupPoint.lng,
        1
      );

    if (!nearbyDrivers.length) {

      return res.json({
        success: false,
        message:
          "No nearby drivers available"
      });

    }

    const io = global.io;

    // Wait for driver acceptance
    const driverAcceptedPromise =
      new Promise((resolve, reject) => {

        global.pendingTrips.set(
          match.trip_id,
          {
            match,
            resolve,
            reject
          }
        );

        // timeout after 30 sec
        setTimeout(() => {

          if (
            global.pendingTrips.has(
              match.trip_id
            )
          ) {

            global.pendingTrips.delete(
              match.trip_id
            );

            reject(
              new Error(
                "No driver accepted"
              )
            );

          }

        }, 30000);

      });

    // Send request to drivers
    nearbyDrivers.forEach(driver => {

      const socketId =
        global.driverSockets?.get(
          Number(driver.id)
        );

      if (!socketId) {

        console.log(
          "No socket for driver:",
          driver.id
        );

        return;

      }

      io.to(socketId).emit(
        "newRideRequest",
        {

          trip_id: match.trip_id,

          created_at:
            new Date(),

          pickup_location:
            match.assignedRiders?.[0]
              ?.pickupAddress ||

            rider.pickupAddress ||

            "Pickup",

          dropoff_location:
            match.assignedRiders?.[
              match.assignedRiders.length - 1
            ]?.destinationAddress ||

            rider.destinationAddress ||

            "Destination",

          total_amount: 10,

          riders:
            match.assignedRiders.map(r => ({

              rider_id: r.id,

              rider_name:
                r.name ||
                `Rider ${r.id}`,

              pickup:
                r.pickup,

              destination:
                r.destination,

              seats:
                r.seats,

              pickupAddress:
                r.pickupAddress,

              destinationAddress:
                r.destinationAddress

            })),

          eta:
            match.eta,

          sequence:
            match.sequence,

          route:
            match.route,

          fullMatch:
            match

        }
      );

      console.log(
        "📡 Ride request sent to driver:",
        driver.id
      );

    });

    // WAIT until driver accepts
    const acceptedDriver =
      await driverAcceptedPromise;

    console.log(
      "Driver accepted:",
      acceptedDriver
    );

    // Notify riders AFTER acceptance
    match.assignedRiders.forEach(r => {

      const riderSocket =
        global.riderSockets?.get(
          r.id.toString()
        );

      if (!riderSocket) {

        console.log(
          " No socket found for rider:",
          r.id
        );

        return;

      }

      io.to(riderSocket).emit(
        "driverAssigned",
        {

          trip_id:
            match.trip_id,

          driver:
            acceptedDriver.driver,

          riders:
            match.assignedRiders,

          sequence:
            match.sequence,

          eta:
            match.eta,

          route:
            match.route,

          pickup_location:
            match.assignedRiders?.[0]
              ?.pickupAddress,

          dropoff_location:
            match.assignedRiders?.[
              match.assignedRiders.length - 1
            ]?.destinationAddress

        }
      );

    });

    // Final response
    return res.json({

      success: true,

      message:
        "Driver accepted ride",

      data: {

        tripId:
          match.trip_id,

        driver:
          acceptedDriver.driver

      }

    });

  } catch (error) {

    console.error(
      " requestRide error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message || "Server error"

    });

  }

};


exports.getAllRidersDebug = (req, res) => {
  const matched = getMatchedRiders();
  const unmatched = getUnmatchedRiders();
  const buckets = getBuckets();

  res.json({
    success: true,

    matchedCount: matched.length,
    unmatchedCount: unmatched.length,

    matched,
    unmatched,

    buckets
  });
};



exports.getAvailableRides = async (req, res) => {
  try {
    const { 
      rideType, 
      numberOfChairs, 
      pickupAddress, 
      destinationAddress,
      latitude,
      longitude,
      destinationLat,
      destinationLng,
      
    } = req.query;

    // Base query to get available rides
    let query = `
      SELECT 
        ride_option_id as id,
        name,
        type,
        description,
        estimated_eta as eta,
        base_price,
        current_price as amount,
        available_seats as availableSheet,
        surge_factor,
        discount_percentage,
        is_available,
        valid_until,
        driver_id,
        ride_code
      FROM ride_options 
      WHERE is_available = 1 
        AND available_seats > 0
    `;

    const params = [];

    // Add ride type filter if provided
    if (rideType && rideType !== 'all') {
      query += ` AND type = ?`;
      params.push(rideType);
    }
    console.log(rideType, 
      numberOfChairs, 
      pickupAddress, 
      destinationAddress)
    // Add seat availability filter if number of chairs is provided
    if (numberOfChairs) {
      query += ` AND available_seats >= ?`;
      params.push(parseInt(numberOfChairs));
    }

    // Order by current price (after applying surge and discount)
    query += ` ORDER BY (base_price * surge_factor * (1 - discount_percentage/100)) ASC`;

    const rides = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

    // Transform the data to match the frontend format
    const formattedRides = rides.map(ride => ({
      id: ride.id.toString(),
      name: ride.name,
      type: ride.type,
      eta: `${ride.eta} min`,
      amount: `R${ride.amount.toFixed(2)}`,
      availableSheet: ride.availableSheet,
      description: ride.description,
      basePrice: ride.base_price,
      surgeFactor: ride.surge_factor,
      discountPercentage: ride.discount_percentage,
      rideCode: ride.ride_code,
      driverId: ride.driver_id
    }));

    // Log the request for debugging (optional)
    console.log('Available rides fetched:', {
      count: formattedRides.length,
      filters: { rideType, numberOfChairs, pickupAddress, destinationAddress },
      data:formattedRides
    });

    res.status(200).json({
      success: true,
      data: formattedRides,
      message: 'Available rides fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching available rides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available rides',
      error: error.message
    });
  }
};



// Generate unique trip code
const generateTripCode = () => {
  return `TRIP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

exports.requestTrip = async (req, res) => {
  try {
    const trip_code = generateTripCode();
    const {
      rider_id,
      pickup_location,
      pickup_latitude,
      pickup_longitude,
      dropoff_location,
      dropoff_latitude,
      dropoff_longitude,
      // distance,
      // duration,
      trip_type,
      fare_amount,
      discount_amount,
      total_amount,
      ride_option_id,
      payment_method_id
    } = req.body;

    // ✅ Basic validation
    if (!rider_id || !pickup_location || !dropoff_location) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    
    const trip = await new Promise(
      (resolve, reject) => {

        db.run(
          `
          INSERT INTO trips (
            trip_code,

            pickup_location,
            pickup_latitude,
            pickup_longitude,

            dropoff_location,
            dropoff_latitude,
            dropoff_longitude,

            trip_type,

            fare_amount,
            discount_amount,
            total_amount,

            trip_status,

            rider_id,
            driver_id,

            payment_method_id,
            ride_option_id,

            searching_started_at,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            trip_code,

            pickup_location,
            pickup_latitude,
            pickup_longitude,

            dropoff_location,
            dropoff_latitude,
            dropoff_longitude,

            trip_type,

            fare_amount,
            discount_amount || 0,
            total_amount,

            //  IMPORTANT
            "requested",

            rider_id,

            //  NO DRIVER YET
            null,

            payment_method_id,
            ride_option_id,

            new Date().toISOString(),
            new Date().toISOString()
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                trip_id: this.lastID,
                trip_code
              });
            }
          }
        );
      }
    );
    const nearbyDrivers = findNearbyDriver(
      pickup_latitude,
      pickup_longitude,
      1
    );
    console.log(
      "🚗 Nearby drivers:",
      nearbyDrivers
    );

    if (!nearbyDrivers.length) {

      await new Promise((resolve, reject) => {

        db.run(
          `
          UPDATE trips
          SET
            trip_status = 'cancelled',
            failure_reason = 'NO_NEARBY_DRIVER'
            WHERE trip_id = ?
            AND rider_id = ?
          `,
          [trip.trip_id],
          function (err) {

            if (err) reject(err);
            else resolve(this);

          }
        );

      });

      return res.json({
        success: false,
        message: "No nearby drivers"
      });
    }
    const io = global.io;


// ✅ fetch rider ONCE
const rider = await new Promise(
  (resolve, reject) => {

    db.get(
      `
      SELECT
        user_id,
        name,
        profile_image,
        phone
      FROM users
      WHERE user_id = ?
      `,
      [rider_id],

      (err, row) => {

        if (err) {
          reject(err);
        } else {
          resolve(row);
        }

      }
    );

  }
);

// ✅ loop properly
for (const driver of nearbyDrivers) {

  const socketId =
    global.driverSockets?.get(
      Number(driver.id)
    );

  if (!socketId) {
    continue;
  }

  io.to(socketId).emit(
    "new_trip_request",
    {

      trip_id:
        trip.trip_id,

      trip_code:
        trip.trip_code,

      riders: [{

        rider_id:
          rider.user_id,

        name:
          rider.name ||
          "Rider",

        profile_image:
          rider.profile_image,

        phone:
          rider.phone

      }],

      pickup_location,
      pickup_latitude,
      pickup_longitude,

      dropoff_location,
      dropoff_latitude,
      dropoff_longitude,

      fare_amount:
        total_amount,

      payment_method_id,

      trip_type,

      ride_option_id,

      created_at:
        new Date().toISOString()

    }
  );

  console.log(
    "📡 dispatched to driver:",
    driver.id
  );

}
return res.status(200).json({
  success: true,
  message: "Trip created successfully",
  data: {
    trip_id: trip.trip_id,
    trip_code: trip.trip_code,
    trip_status: "requested"
  }
});
  } catch (err) {
    console.error("❌ createTrip error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create trip",
      error: err.message
    });
  }
};


exports.acceptTrip = async (req, res) => {

  try {

    const { tripId } = req.params;

    const {
      driver_id
    } = req.body;
    console.log(
      "🔥 incoming driver_id:",
      driver_id
    );
    db.all(
      "SELECT * FROM drivers",
      [],
      (e, rows) => {
        console.log(rows);
      }
    );    
    // ✅ ATOMIC LOCK
    const result =
      await new Promise(
        (resolve, reject) => {

          db.run(
            `
            UPDATE trips
            SET
              driver_id = ?,

              trip_status = 'accepted',

              accepted_at = CURRENT_TIMESTAMP,

              driver_assigned_at =
                CURRENT_TIMESTAMP

            WHERE trip_id = ?
            AND driver_id IS NULL
            `,
            [driver_id, tripId],

            function (err) {

              if (err) {
                reject(err);
              } else {

                resolve(this);

              }

            }
          );

        }
      );

    // another driver accepted
    if (result.changes === 0) {

      return res.status(409).json({

        success: false,

        message:
          "Trip already accepted"

      });

    }

    // fetch updated trip
    const trip =
      await new Promise(
        (resolve, reject) => {

          db.get(
            `
            SELECT *
            FROM trips
            WHERE trip_id = ?
            `,
            [tripId],

            (err, row) => {

              if (err) {
                reject(err);
              } else {

                resolve(row);

              }

            }
          );

        }
      );

    // ✅ NOTIFY RIDER
    const riderSocket =
  global.riderSockets.get(
    trip.rider_id.toString()
  );

console.log(
  "🎯 rider socket:",
  riderSocket
);

console.log(
  "🗺 all rider sockets:",
  Array.from(
    global.riderSockets.entries()
  )
);
const driver =
  await new Promise(
    (resolve, reject) => {

      // db.get(
      //   `
      //   SELECT
      //     d.driver_id,
      //     d.user_id,
      //     d.driver_status,

      //     u.name,
      //     u.phone,
      //     u.profile_image

      //   FROM drivers d

      //   LEFT JOIN users u
      //   ON d.user_id = u.user_id

      //   WHERE d.driver_id = ?
      //   `,
      //   [driver_id],
      db.get(
        `
        SELECT

          d.driver_id,

          d.user_id,

          d.driver_status,

          u.name,
          u.phone,
          u.profile_image

          

        FROM drivers d

        LEFT JOIN users u
          ON d.user_id = u.user_id

        WHERE d.driver_id = ?
        `,
        [driver_id],

        (err, row) => {

          if (err)
            reject(err);
          else
            resolve(row);

        }
      );

    }
  );

console.log(
  "🚗 DRIVER:",
  driver
);

if (
  riderSocket &&
  global.io
) {

  // const payload = {

  //   trip_id:
  //     trip.trip_id,
  //   trip_code:
  //     trip.trip_code,
  //   pickup_location:
  //     trip.pickup_location,

  //   dropoff_location:
  //     trip.dropoff_location,

  //   trip_type:
  //     trip.trip_type,

  //   fare_amount:
  //     trip.fare_amount,

  //     driver: driver
  //     ? {
      
  //         driver_id:
  //           driver.driver_id,
      
  //         name:
  //           driver.name,
      
  //         phone:
  //           driver.phone,
      
  //         profile_image:
  //           driver.profile_image
      
  //       }
  //     : null

  // };
  const payload = {
    trip_id: trip.trip_id,
    trip_code: trip.trip_code,
  
    pickup_location: trip.pickup_location,
    pickup_latitude: trip.pickup_latitude,
    pickup_longitude: trip.pickup_longitude,
  
    dropoff_location: trip.dropoff_location,
    dropoff_latitude: trip.dropoff_latitude,
    dropoff_longitude: trip.dropoff_longitude,
  
    fare_amount: trip.fare_amount,
    trip_type: trip.trip_type,
  
    driver: {
      driver_id: driver.driver_id,
      name: driver.name,
      phone: driver.phone,
      profile_image: driver.profile_image,
  
      // vehicle_model: driver.vehicle_model,
      // vehicle_number: driver.vehicle_number,
      // vehicle_color: driver.vehicle_color,
    }
  };
  console.log(
    "📦 EMITTING:",
    payload
  );

  global.io
    .to(riderSocket)
    .emit(
      "trip_accepted",
      payload
    );

  console.log(
    "✅ trip_accepted emitted"
  );

}
else {

  console.log(
    "❌ rider socket missing"
  );

}
  
// global.io
//   .to(riderSocket)
//   .emit(
//     "trip_accepted",
//     {

//       trip_id:
//         trip.trip_id,

//       trip_status:
//         "accepted",

//       pickup_location:
//         trip.pickup_location,

//       dropoff_location:
//         trip.dropoff_location,

//         driver: {

//           driver_id:
//             driver.driver_id,
        
//           name:
//             driver.name ||
//             "Driver",
        
//           phone:
//             driver.phone,
        
//           profile_image:
//             driver.profile_image
        
//         }
//     }
//   );
console.log(
  "✅ trip_accepted emitted"
);
return res.json({

  success: true,

  message:
    "Trip accepted",

  data: trip

});
  }

catch (error) {

    console.error(
      "acceptTrip error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};


// Get trips by rider ID
exports.getTripsByRider = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    
    // Convert to integers
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);
    
    let query = `
      SELECT pickup_location, dropoff_location, tripType, created_at, total_amount, trip_status,trip_id as id
      FROM trips 
      WHERE rider_id = ? 
      AND trip_status IN ('completed', 'cancelled')
    `;
    
    const params = [riderId];
    
    // Add status filter if provided
    if (status) {
      query += ` AND trip_status = ?`;
      params.push(status);
    }
    
    // Add ORDER BY and pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);
    
    const trips = await new Promise((resolve, reject) => {
      req.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM trips 
      WHERE rider_id = ? 
      AND trip_status IN ('completed', 'cancelled')
    `;
    const countParams = [riderId];
    
    if (status) {
      countQuery += ` AND trip_status = ?`;
      countParams.push(status);
    }
    
    const totalCount = await new Promise((resolve, reject) => {
      req.db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
    
    // Calculate if there are more records
    const hasMore = totalCount > (parsedOffset + trips.length);
    
    // Return response with proper structure
    res.status(200).json({
      success: true,
      data: {
        trips: trips,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: hasMore,
          total: totalCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching rider trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
};

// Get trips by driver ID
exports.getTripsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT t.*, 
        u.name as rider_name, u.email as rider_email, u.phone as rider_phone,
        pm.method_type as payment_method_type
      FROM trips t
      LEFT JOIN users u ON t.rider_id = u.user_id
      LEFT JOIN payment_methods pm ON t.payment_method_id = pm.payment_method_id
      WHERE t.driver_id = ?
    `;
    
    const params = [driverId];
    
    if (status) {
      query += ` AND t.trip_status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const trips = await new Promise((resolve, reject) => {
      req.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.status(200).json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
};

// Update trip status
exports.updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status, cancellation_reason } = req.body;
    
    const validStatuses = ['requested', 'accepted', 'driver_arrived', 'started', 'completed', 'cancelled', 'no_show'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip status'
      });
    }
    
    // Get current trip
    const currentTrip = await new Promise((resolve, reject) => {
      req.db.get('SELECT * FROM trips WHERE trip_id = ?', [tripId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!currentTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Prepare update fields
    const updates = { trip_status: status };
    const updateParams = [status];
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updateParams.push(updates.completed_at);
    }
    
    if (status === 'cancelled' && cancellation_reason) {
      updates.cancellation_reason = cancellation_reason;
      updateParams.push(cancellation_reason);
    }
    
    // Build update query
    let updateQuery = 'UPDATE trips SET trip_status = ?, updated_at = CURRENT_TIMESTAMP';
    if (updates.completed_at) updateQuery += ', completed_at = ?';
    if (updates.cancellation_reason) updateQuery += ', cancellation_reason = ?';
    updateQuery += ' WHERE trip_id = ?';
    updateParams.push(tripId);
    
    await new Promise((resolve, reject) => {
      req.db.run(updateQuery, updateParams, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    // Fetch updated trip
    const updatedTrip = await new Promise((resolve, reject) => {
      req.db.get(
        `SELECT t.*, 
          u.name as rider_name, d.name as driver_name
         FROM trips t
         LEFT JOIN users u ON t.rider_id = u.user_id
         LEFT JOIN drivers d ON t.driver_id = d.driver_id
         WHERE t.trip_id = ?`,
        [tripId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.status(200).json({
      success: true,
      data: updatedTrip,
      message: `Trip status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip status',
      error: error.message
    });
  }
};

// Cancel a trip
exports.cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { cancellation_reason ,cancelled_by} = req.body;
    console.log(
      "🚫 tripId:",
      tripId
    );
    
    console.log(
      "🚫 cancelled_by:",
      cancelled_by
    );
    // 🔍 1. Get current trip
    const currentTrip = await new Promise((resolve, reject) => {
      req.db.get(
        'SELECT * FROM trips WHERE trip_id = ?',
        [tripId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    //  Trip not found
    if (!currentTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Invalid status
    if (!['requested', 'accepted'].includes(currentTrip.trip_status)) {
      return res.status(400).json({
        success: false,
        message: `Trip cannot be cancelled in ${currentTrip.trip_status} status. Only 'requested' or 'accepted' trips can be cancelled.`
      });
    }

    //  Missing reason
    if (!cancellation_reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    //  2. Update trip
    await new Promise((resolve, reject) => {
     //  Correct - no comma before WHERE
        req.db.run(
          `UPDATE trips 
          SET trip_status = 'cancelled', 
              cancellation_reason = ?
          WHERE trip_id = ?`,
          [cancellation_reason || null, tripId],
          function (err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
    });

    //  3. Fetch updated trip
    const updatedTrip = await new Promise((resolve, reject) => {
      req.db.get(
        'SELECT * FROM trips WHERE trip_id = ?',
        [tripId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
 // 🚗 notify driver if assigned
 if (updatedTrip.driver_id) {

  const driverSocket =
    global.driverSockets?.get(
      updatedTrip.driver_id.toString()
    );

  console.log(
    "📡 notifying driver socket:",
    driverSocket
  );

  if (
    driverSocket &&
    global.io
  ) {

    global.io
      .to(driverSocket)
      .emit(
        "trip_cancelled",
        {

          trip_id:
            updatedTrip.trip_id,

          cancellation_reason:
            updatedTrip.cancellation_reason,

          message:
            "Rider cancelled the trip"

        }
      );

    console.log(
      "✅ trip_cancelled emitted to driver"
    );

  } else {

    console.log(
      "❌ driver socket not found"
    );

  }

}

    //  4. Success response
    return res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully',
      data: updatedTrip
    });

  } catch (error) {
    console.error('Error cancelling trip:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel trip',
      error: error.message
    });
  }
};


// Get trip by ID 
exports.getTripById = async (req, res) => {
  try {
    const { riderId } = req.params;
    
    const trip = await new Promise((resolve, reject) => {
      req.db.get(
        `SELECT t.*, 
          u.name as rider_name, u.email as rider_email, u.phone as rider_phone,
          d.name as driver_name, d.phone as driver_phone, d.vehicle_model, d.license_plate,
          pm.method_type as payment_method_type
         FROM trips t
         LEFT JOIN users u ON t.rider_id = u.user_id
         LEFT JOIN drivers d ON t.driver_id = d.driver_id
         LEFT JOIN payment_methods pm ON t.payment_method_id = pm.payment_method_id
         WHERE t.trip_id = ?`,
        [tripId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message
    });
  }
};

// Get trip fare estimate
exports.estimateFare = async (req, res) => {
  try {
    const {
      rideOptionId,
      distance,
      duration,
      numberOfChairs
    } = req.query;
    
    if (!rideOptionId || !distance) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: rideOptionId, distance'
      });
    }
    
    // Get ride option details
    const rideOption = await new Promise((resolve, reject) => {
      req.db.get(
        `SELECT * FROM ride_options WHERE ride_option_id = ? AND is_available = 1`,
        [rideOptionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!rideOption) {
      return res.status(404).json({
        success: false,
        message: 'Ride option not available'
      });
    }
    
    // Calculate fare
    const baseFare = rideOption.base_price;
    const perKmRate = 2.5; // R2.5 per km - you can make this dynamic
    const distanceFare = parseFloat(distance) * perKmRate;
    const surgeMultiplier = rideOption.surge_factor || 1;
    
    let totalFare = (baseFare + distanceFare) * surgeMultiplier;
    
    // Apply discount if any
    let discountAmount = 0;
    if (rideOption.discount_percentage && rideOption.discount_percentage > 0) {
      discountAmount = (totalFare * rideOption.discount_percentage) / 100;
      totalFare = totalFare - discountAmount;
    }
    
    res.status(200).json({
      success: true,
      data: {
        ride_option: rideOption,
        distance_km: parseFloat(distance),
        duration_minutes: duration ? parseInt(duration) : null,
        base_fare: baseFare,
        distance_fare: distanceFare,
        surge_multiplier: surgeMultiplier,
        discount_percentage: rideOption.discount_percentage || 0,
        discount_amount: discountAmount,
        total_fare: totalFare
      }
    });
  } catch (error) {
    console.error('Error estimating fare:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate fare',
      error: error.message
    });
  }
};

// Get active trips for rider
exports.getActiveTrip = async (req, res) => {
  try {
    const { riderId } = req.params;
    
    const activeTrip = await new Promise((resolve, reject) => {
      req.db.get(
        `SELECT t.*, 
          d.name as driver_name, d.phone as driver_phone, d.vehicle_model, d.license_plate,
          pm.method_type as payment_method_type
         FROM trips t
         LEFT JOIN drivers d ON t.driver_id = d.driver_id
         LEFT JOIN payment_methods pm ON t.payment_method_id = pm.payment_method_id
         WHERE t.rider_id = ? 
           AND t.trip_status IN ('requested', 'accepted', 'driver_arrived', 'started')
         ORDER BY t.created_at DESC LIMIT 1`,
        [riderId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.status(200).json({
      success: true,
      data: activeTrip || null
    });
  } catch (error) {
    console.error('Error fetching active trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active trip',
      error: error.message
    });
  }
};


