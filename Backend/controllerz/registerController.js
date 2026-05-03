const db = require("../db");

// Generate 6-digit OTP
function genOtp() {
  return Math.floor(100000 + Math.random()  * 900000).toString();
}

// Register request
exports.registerRequest = (req, res) => {
  const { name, email, phone } = req.body;
  console.log("📨 Register request received:", { name, email, phone });

  if (!name || !email || !phone)
    return res.status(400).json({ message: "All fields required" });

  db.get("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, user) => {
    if (err) {
      console.error("❌ DB search error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    
    if (user) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: "Email or phone already registered" });
    }

    const emailOtp = genOtp();
    const phoneOtp = genOtp();
    
    console.log("🎯 GENERATED OTP CODES:");
    console.log("📧 Email OTP:", emailOtp, "for", email);
    console.log("📱 Phone OTP:", phoneOtp, "for", phone);
    console.log("🔑 Use these codes in your verification screen!");

    db.run("DELETE FROM pending_users WHERE email = ? OR phone = ?", [email, phone], (dErr) => {
      if (dErr) console.error("Cleanup error:", dErr);
      
      db.run(
        `INSERT INTO pending_users (name, email, phone, emailOtp, phoneOtp, emailVerified, phoneVerified, role_id)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
        [name, email, phone, emailOtp, phoneOtp, 2],  // Hardcoded role_id = 2 (User)
        function (insertErr) {
          if (insertErr) {
            console.error("❌ DB insert error:", insertErr);
            return res.status(500).json({ message: "DB insert error" });
          }

          console.log("✅ User added to pending_users table with role_id: 2 (User)");

          // Send email (optional - won't fail if error occurs)
          if (req.transporter) {
            req.transporter.sendMail(
              {
                from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                to: email,
                subject: "Email verification code",
                text: `Your email verification code: ${emailOtp}`,
              },
              (mailErr) => {
                if (mailErr) {
                  console.error("❌ Email send failed (using console OTP):", mailErr.message);
                } else {
                  console.log(`✅ Email OTP sent to ${email}`);
                }
              }
            );
          } else {
            console.log(`📧 Email OTP for ${email}: ${emailOtp} [SMTP not configured]`);
          }

          // Send SMS (optional - won't fail if error occurs)
          if (req.twilioClient && process.env.TWILIO_FROM) {
            req.twilioClient.messages
              .create({ 
                body: `Your phone OTP: ${phoneOtp}`, 
                from: process.env.TWILIO_FROM, 
                to: phone 
              })
              .then((m) => console.log("✅ SMS sent to", phone))
              .catch((e) => {
                console.error("❌ SMS send failed (using console OTP):", e.message);
              });
          } else {
            console.log(`📱 Phone OTP for ${phone}: ${phoneOtp} [Twilio not configured]`);
          }

          // Return success with OTPs for development
          return res.json({ 
            message: "Verification codes generated. Check server console for OTPs during development.",
            testOtpEmail: emailOtp,
            testOtpPhone: phoneOtp
          });
        }
      );
    });
  });
};

// Verify email
exports.verifyEmail = (req, res) => {
  const { email, code } = req.body;
  console.log("📧 Email verification attempt:", { email, code });

  if (!email || !code) return res.status(400).json({ message: "Missing params" });

  db.get("SELECT * FROM pending_users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error("❌ DB error during email verification:", err);
      return res.status(500).json({ message: "DB error" });
    }
    
    if (!row) {
      console.log("❌ No pending registration for email:", email);
      return res.status(400).json({ message: "No pending registration for this email" });
    }

    console.log("🔍 Found pending user, stored OTP:", row.emailOtp);
    
    if (row.emailOtp === code) {
      db.run("UPDATE pending_users SET emailVerified = 1 WHERE email = ?", [email], (uErr) => {
        if (uErr) {
          console.error("❌ DB update error:", uErr);
          return res.status(500).json({ message: "DB update error" });
        }
        console.log("✅ Email verified successfully for:", email);
        return res.json({ message: "Email verified" });
      });
    } else {
      console.log("❌ Invalid email code for:", email);
      return res.status(400).json({ message: "Invalid email code" });
    }
  });
};

// Verify phone
exports.verifyPhone = (req, res) => {
  const { phone, code } = req.body;
  console.log("📱 Phone verification attempt:", { phone, code });

  if (!phone || !code) return res.status(400).json({ message: "Missing params" });

  db.get("SELECT * FROM pending_users WHERE phone = ?", [phone], (err, row) => {
    if (err) {
      console.error("❌ DB error during phone verification:", err);
      return res.status(500).json({ message: "DB error" });
    }
    
    if (!row) {
      console.log("❌ No pending registration for phone:", phone);
      return res.status(400).json({ message: "No pending registration for this phone" });
    }

    console.log("🔍 Found pending user, stored OTP:", row.phoneOtp);
    
    if (row.phoneOtp === code) {
      db.run("UPDATE pending_users SET phoneVerified = 1 WHERE phone = ?", [phone], (uErr) => {
        if (uErr) {
          console.error("❌ DB update error:", uErr);
          return res.status(500).json({ message: "DB update error" });
        }
        console.log("✅ Phone verified successfully for:", phone);
        return res.json({ message: "Phone verified" });
      });
    } else {
      console.log("❌ Invalid phone code for:", phone);
      return res.status(400).json({ message: "Invalid phone code" });
    }
  });
};

// Complete registration
exports.completeRegistration = (req, res) => {
  const { email, phone } = req.body;
  console.log("✅ Complete registration attempt:", { email, phone });

  if (!email || !phone) return res.status(400).json({ message: "Missing params" });

  db.get("SELECT * FROM pending_users WHERE email = ? AND phone = ?", [email, phone], (err, row) => {
    if (err) {
      console.error("❌ DB error during completion:", err);
      return res.status(500).json({ message: "DB error" });
    }
    
    if (!row) {
      console.log("❌ Pending registration not found");
      return res.status(400).json({ message: "Pending registration not found" });
    }
    
    if (row.emailVerified !== 1 || row.phoneVerified !== 1) {
      console.log("❌ Verification incomplete:", {
        emailVerified: row.emailVerified,
        phoneVerified: row.phoneVerified
      });
      return res.status(400).json({ message: "Both email and phone must be verified" });
    }

    console.log("✅ Both verifications complete, creating user...");
    
    // Hardcoded role_id = 2 (User)
    const roleId = 2;
    
    db.run("INSERT INTO users (name, email, phone, role_id) VALUES (?, ?, ?, ?)", 
      [row.name, row.email, row.phone, roleId], 
      function (insertErr) {
        if (insertErr) {
          console.error("❌ User creation error:", insertErr);
          return res.status(500).json({ message: "Could not create user" });
        }

        const userId = this.lastID;
        console.log("✅ User created with ID:", userId, "and role_id: 2 (User)");
        
        db.run("DELETE FROM pending_users WHERE id = ?", [row.id], (dErr) => {
          if (dErr) console.error("⚠️ Failed to delete pending user (non-critical):", dErr);
          else console.log("✅ Pending user cleaned up");
          
          // Get user with role information
          db.get(`SELECT u.*, r.role_name 
                  FROM users u 
                  LEFT JOIN roles r ON u.role_id = r.id 
                  WHERE u.id = ?`, [userId], (err, newUser) => {
            if (err) console.error("Error fetching new user:", err);
            
            return res.json({ 
              message: "Registration complete", 
              userId: userId,
              name: row.name,
              email: row.email,
              phone: row.phone,
              role_id: roleId,
              role_name: newUser ? newUser.role_name : "User"
            });
          });
        });
      }
    );
  });
};

// Get user profile with role
exports.getUserProfile = (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }
  
  db.get(`SELECT u.*, r.role_name 
          FROM users u 
          LEFT JOIN roles r ON u.role_id = r.id 
          WHERE u.id = ?`, [userId], (err, user) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ user });
  });
};

// Update user role (Admin only)
exports.updateUserRole = (req, res) => {
  const { userId, roleId } = req.body;
  const adminUserId = req.user?.id; // Assuming you have authentication middleware
  
  if (!userId || !roleId) {
    return res.status(400).json({ message: "User ID and Role ID required" });
  }
  
  // Check if role exists
  db.get("SELECT * FROM roles WHERE id = ?", [roleId], (err, role) => {
    if (err) {
      console.error("Error checking role:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (!role) {
      return res.status(400).json({ message: "Invalid role ID" });
    }
    
    // Update user role
    db.run("UPDATE users SET role_id = ? WHERE id = ?", [roleId, userId], function(updateErr) {
      if (updateErr) {
        console.error("Error updating user role:", updateErr);
        return res.status(500).json({ message: "Could not update user role" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get updated user info
      db.get(`SELECT u.*, r.role_name 
              FROM users u 
              LEFT JOIN roles r ON u.role_id = r.id 
              WHERE u.id = ?`, [userId], (err, updatedUser) => {
        if (err) {
          console.error("Error fetching updated user:", err);
          return res.json({ message: "Role updated successfully" });
        }
        
        res.json({ 
          message: "User role updated successfully",
          user: updatedUser
        });
      });
    });
  });
};

// Get all users with their roles (Admin only)
exports.getAllUsers = (req, res) => {
  db.all(`SELECT u.user_id, u.name, u.email, u.phone, u.role_id, r.role_name, u.created_at
          FROM users u 
          LEFT JOIN roles r ON u.role_id = r.id 
          ORDER BY u.created_at DESC`, (err, users) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ users });
  });
};

// Get all available roles
exports.getAllRoles = (req, res) => {
  db.all("SELECT * FROM roles ORDER BY id", (err, roles) => {
    if (err) {
      console.error("Error fetching roles:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ roles });
  });
};

// Get pending users (for debugging)
exports.getPendingUsers = (req, res) => {
  db.all("SELECT * FROM pending_users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};