// controllerz/driverRegController.js
const db = require('../db');
const jwt = require('jsonwebtoken');

// JWT Secret (store in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

class DriverRegController {
    // Register new driver
   // Register new driver
async registerDriver(req, res) {
    try {
        const {
            name,
            email,
            phoneNumber,
            licenseNumber,
            licenseExpiry,
            carMake,
            carModel,
            plateNumber
        } = req.body;

        // Validate required fields
        if (!name || !email || !phoneNumber || !licenseNumber || !licenseExpiry || !carMake || !carModel || !plateNumber) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate phone number
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Validate license expiry date
        const expiryDate = new Date(licenseExpiry);
        if (isNaN(expiryDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid license expiry date format (use YYYY-MM-DD)'
            });
        }

        // ✅ CHECK USERS TABLE (not drivers)
        const checkUser = await new Promise((resolve, reject) => {
            db.get(
                'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
                [email, phoneNumber],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (checkUser) {
            if (checkUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            if (checkUser.phone === phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already registered'
                });
            }
        }

        // ✅ CHECK DRIVER-SPECIFIC DUPLICATES
        const checkDriver = await new Promise((resolve, reject) => {
            db.get(
                'SELECT license_number FROM drivers WHERE license_number = ?',
                [licenseNumber],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (checkDriver) {
            return res.status(400).json({
                success: false,
                message: 'License number already registered'
            });
        }

        // ✅ INSERT INTO USERS FIRST
        const userId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (
                    name, email, phone, role_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [name, email, phoneNumber, 3], // role_id = 3 (driver)
                function (err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        // ✅ INSERT INTO DRIVERS USING user_id
        const driverId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO drivers (
                    user_id, license_number, license_expiry, joined_date, updated_at
                ) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
                [userId, licenseNumber, licenseExpiry],
                function (err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        // Generate JWT token
        const token = jwt.sign(
            { driverId: driverId, email: email, role: 'driver' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            data: {
                driverId: driverId,
                name: name,
                email: email,
                phone: phoneNumber,
                licenseNumber: licenseNumber,
                licenseExpiry: licenseExpiry,
                carMake: carMake,
                carModel: carModel,
                plateNumber: plateNumber
            },
            token: token
        });

    } catch (error) {
        console.error('Error in driver registration:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

    // Get driver profile
    async getDriverProfile(req, res) {
        try {
            const driverId = req.user.driverId;

            const driver = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT driver_id, name, email, phone, license_number, license_expiry, 
                     car_make, car_model, plate_number, is_approved, is_active, created_at 
                     FROM drivers WHERE driver_id = ?`,
                    [driverId],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!driver) {
                return res.status(404).json({
                    success: false,
                    message: 'Driver not found'
                });
            }

            res.status(200).json({
                success: true,
                data: driver
            });

        } catch (error) {
            console.error('Error fetching driver profile:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update driver profile
    async updateDriverProfile(req, res) {
        try {
            const driverId = req.user.driverId;
            const updates = req.body;
            const allowedUpdates = ['name', 'phone', 'car_make', 'car_model', 'plate_number'];
            
            const updateFields = [];
            const updateValues = [];
            
            for (const [key, value] of Object.entries(updates)) {
                if (allowedUpdates.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }
            
            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }
            
            updateValues.push(driverId);
            updateFields.push('updated_at = datetime("now")');
            
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE drivers SET ${updateFields.join(', ')} WHERE driver_id = ?`,
                    updateValues,
                    function(err) {
                        if (err) reject(err);
                        resolve(this.changes);
                    }
                );
            });
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            });
            
        } catch (error) {
            console.error('Error updating driver profile:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Driver login
    async driverLogin(req, res) {
        try {
            const { email, phone } = req.body;
            
            if (!email && !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Email or phone number is required'
                });
            }
            
            const driver = await new Promise((resolve, reject) => {
                let query = 'SELECT * FROM drivers WHERE ';
                let params = [];
                
                if (email) {
                    query += 'email = ?';
                    params.push(email);
                } else if (phone) {
                    query += 'phone = ?';
                    params.push(phone);
                }
                
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
            
            if (!driver) {
                return res.status(404).json({
                    success: false,
                    message: 'Driver not found'
                });
            }
            
            if (!driver.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { driverId: driver.driver_id, email: driver.email, role: 'driver' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    driverId: driver.driver_id,
                    name: driver.name,
                    email: driver.email,
                    phone: driver.phone,
                    isApproved: driver.is_approved
                },
                token: token
            });
            
        } catch (error) {
            console.error('Error in driver login:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete driver account
    async deleteDriverAccount(req, res) {
        try {
            const driverId = req.user.driverId;
            
            await new Promise((resolve, reject) => {
                db.run(
                    'DELETE FROM drivers WHERE driver_id = ?',
                    [driverId],
                    function(err) {
                        if (err) reject(err);
                        resolve(this.changes);
                    }
                );
            });
            
            res.status(200).json({
                success: true,
                message: 'Driver account deleted successfully'
            });
            
        } catch (error) {
            console.error('Error deleting driver account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new DriverRegController();