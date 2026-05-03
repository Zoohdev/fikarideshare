// db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./auth.db", (err) => {
  if (err) console.error("DB open error:", err);
  else console.log("Connected to SQLite DB");
});

// create tables
db.serialize(() => {
 
  //pending registration
 
  db.run(`CREATE TABLE IF NOT EXISTS pending_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    emailOtp TEXT,
    phoneOtp TEXT,
    emailVerified INTEGER DEFAULT 0,
    phoneVerified INTEGER DEFAULT 0,
    faceVerified INTEGER DEFAULT 0,
    role_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);


  // Roles table
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    password TEXT NULL,
    profile_image TEXT NULL,
    date_of_birth DATE NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')) NULL,
    is_active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    phone_verified INTEGER DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
  )`);

  // Admins table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    admin_level INTEGER DEFAULT 1,
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`);

  // PASSENGERS TABLE - Dedicated passenger table
  db.run(`CREATE TABLE IF NOT EXISTS rider (
    rider_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    identity_document_image TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`);

  // Vehicles table
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT UNIQUE NOT NULL,
    number_passenger INTEGER NOT NULL,
    vehicle_image TEXT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    vehicle_type TEXT CHECK(vehicle_type IN ('Sedan', 'SUV', 'Hatchback', 'Van', 'Luxury', 'Bike')) NOT NULL,
    color TEXT,
    fuel_type TEXT CHECK(fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
    air_conditioned INTEGER DEFAULT 0,
    luggage_capacity INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Drivers table
  db.run(`CREATE TABLE IF NOT EXISTS drivers (
    driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    license_number TEXT UNIQUE,
    license_expiry DATE,
    license_image TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    driver_status TEXT CHECK(driver_status IN ('available', 'busy', 'offline', 'on_trip', 'suspended')) DEFAULT 'offline',
    driver_image TEXT,
    is_verified INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    bank_account_number TEXT,
    bank_name TEXT,
    account_holder_name TEXT,
    total_trips INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    vehicle_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL
  )`);

  // Payment Methods table
  db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id INTEGER PRIMARY KEY AUTOINCREMENT,
    method_type TEXT CHECK(method_type IN ('credit_card', 'debit_card', 'paypal', 'cash', 'mobile_money')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create ride_options table (available rides with dynamic pricing)
  db.run(`
    CREATE TABLE IF NOT EXISTS ride_options (
      ride_option_id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      ride_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      estimated_eta INTEGER, -- in minutes
      base_price DECIMAL(10,2),
      current_price DECIMAL(10,2),
      available_seats INTEGER DEFAULT 4,
      surge_factor DECIMAL(3,2) DEFAULT 1.00,
      discount_percentage DECIMAL(5,2) DEFAULT 0.00,
      is_available BOOLEAN DEFAULT 1,
      valid_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trips table
  db.run(`CREATE TABLE IF NOT EXISTS trips (
    trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_code TEXT UNIQUE NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_latitude DECIMAL(10,8),
    pickup_longitude DECIMAL(11,8),
    dropoff_location TEXT NOT NULL,
    dropoff_latitude DECIMAL(10,8),
    dropoff_longitude DECIMAL(11,8),
    distance DECIMAL(10,2),
    duration INTEGER,
    tripType TEXT,
    fare_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2),
    trip_status TEXT CHECK(trip_status IN ('requested', 'accepted', 'driver_arrived', 'started', 'completed', 'cancelled', 'no_show')) DEFAULT 'requested',
    cancellation_reason TEXT,
    scheduled_time DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rider_id INTEGER NOT NULL,
    driver_id INTEGER,
    payment_method_id INTEGER,
    FOREIGN KEY (rider_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id) ON DELETE SET NULL
  )`);

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_code TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('trip_payment', 'top_up', 'withdrawal', 'refund', 'bonus')) NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_provider TEXT,
    payment_reference TEXT,
    description TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trip_id INTEGER,
    payment_method_id INTEGER,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id) ON DELETE SET NULL
  )`);

  // Ratings table
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_rating INTEGER CHECK(driver_rating >= 1 AND driver_rating <= 5),
    rider_rating INTEGER CHECK(rider_rating >= 1 AND rider_rating <= 5),
    rider_comment TEXT,
    driver_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trip_id INTEGER UNIQUE NOT NULL,
    rider_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (rider_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE
  )`);

 // Insert default roles
db.run(`
  INSERT OR IGNORE INTO roles (role_name, description) VALUES 
  ('admin', 'System administrator with full access'),
  ('driver', 'Driver who provides transportation services'),
  ('rider', 'Passenger who requests rides')
`);

// ------------------ ADMIN ------------------
db.run(`
  INSERT INTO users (name, email, phone, password, role_id) VALUES 
  ('System Admin', 'admin@example.com', '+1234567890', 'password_here', 1)
`, function (err) {
  if (err) return console.error(err);

  const adminUserId = this.lastID;

  db.run(`
    INSERT OR IGNORE INTO admins (user_id, admin_level) 
    VALUES (?, 1)
  `, [adminUserId]);
});

// ------------------ RIDER ------------------
db.run(`
  INSERT INTO users (name, email, phone, password, role_id) VALUES 
  ('user', 'user@example.com', '+27633983986', 'password_here', 3)
`, function (err) {
  if (err) return console.error(err);

  const riderUserId = this.lastID;

  db.run(`
    INSERT OR IGNORE INTO rider (user_id) 
    VALUES (?)
  `, [riderUserId]);
});

// ------------------ DRIVERS ------------------
const drivers = [
  { name: 'driver1', email: 'driver@example.com', phone: '+1234567898' },
  { name: 'driver2', email: 'driver2@example.com', phone: '+1234567868' },
  { name: 'driver3', email: 'driver3@example.com', phone: '+1234587898' }
];

let driverIds = [];

drivers.forEach((driver) => {
  db.run(`
    INSERT INTO users (name, email, phone, password, role_id) 
    VALUES (?, ?, ?, 'password_here', 2)
  `, [driver.name, driver.email, driver.phone], function (err) {
    if (err) return console.error(err);

    const userId = this.lastID;

    db.run(`
      INSERT INTO drivers (user_id) 
      VALUES (?)
    `, [userId], function (err) {
      if (err) return console.error(err);

      driverIds.push(this.lastID);

      // Insert rides once all drivers are inserted
      if (driverIds.length === drivers.length) {
        insertRides(driverIds);
      }
    });
  });
});

// ------------------ RIDES ------------------
function insertRides(driverIds) {
  db.run(`
    INSERT OR IGNORE INTO ride_options 
    (driver_id, ride_code, name, type, description, estimated_eta, base_price, current_price, available_seats, surge_factor, discount_percentage, is_available, valid_until)
    VALUES
    (?, 'RIDE001', 'Quick Ride', 'Standard', 'Affordable everyday ride', 5, 50.00, 50.00, 4, 1.00, 0.00, 1, datetime('now', '+1 day')),

    (?, 'RIDE002', 'Comfort Ride', 'Premium', 'More comfortable ride with AC', 7, 80.00, 85.00, 4, 1.10, 5.00, 1, datetime('now', '+1 day')),

    (?, 'RIDE003', 'Group Ride', 'Van', 'Perfect for groups and families', 10, 120.00, 130.00, 7, 1.20, 10.00, 1, datetime('now', '+1 day'))
  `, [
    driverIds[0],
    driverIds[1],
    driverIds[2]
  ], (err) => {
    if (err) console.error(err);
    else console.log("✅ Data seeded successfully!");
  });
}
  // Create indexes for better performance (using IF NOT EXISTS)
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(trip_status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trips_rider ON trips(rider_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(driver_status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_trip ON ratings(trip_id)`);
  
  console.log("Database tables created successfully!");
});


// Promisify methods
db.allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // gives lastID, changes
    });
  });
};

module.exports = db;