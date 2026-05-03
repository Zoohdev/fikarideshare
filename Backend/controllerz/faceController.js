const db = require("../db");
const fs = require("fs");
const path = require("path");

// Directory to store face embeddings
const FACE_DATA_DIR = path.join(__dirname, "../face_data");

// Ensure directory exists
if (!fs.existsSync(FACE_DATA_DIR)) {
  fs.mkdirSync(FACE_DATA_DIR, { recursive: true });
}

// Store face embedding
exports.storeFaceEmbedding = (req, res) => {
  const { email, faceEmbedding } = req.body;
  console.log("📸 Storing face embedding for:", email);

  if (!email || !faceEmbedding) {
    return res.status(400).json({ message: "Email and face embedding required" });
  }

  // Check if user exists in pending_users
  db.get("SELECT * FROM pending_users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }

    if (!user) {
      return res.status(400).json({ message: "No pending registration found" });
    }

    // Store face embedding as JSON file
    const faceData = {
      email: email,
      embedding: faceEmbedding,
      timestamp: new Date().toISOString()
    };

    const filename = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_face.json`;
    const filepath = path.join(FACE_DATA_DIR, filename);

    fs.writeFile(filepath, JSON.stringify(faceData), (fileErr) => {
      if (fileErr) {
        console.error("❌ Failed to save face data:", fileErr);
        return res.status(500).json({ message: "Failed to save face data" });
      }

      // Update pending_users table to mark face as verified
      db.run(
        "UPDATE pending_users SET faceVerified = 1 WHERE email = ?",
        [email],
        (updateErr) => {
          if (updateErr) {
            console.error("❌ DB update error:", updateErr);
            return res.status(500).json({ message: "DB update error" });
          }

          console.log("✅ Face embedding stored for:", email);
          res.json({ message: "Face data stored successfully" });
        }
      );
    });
  });
};

// Verify face
exports.verifyFace = (req, res) => {
  const { email, faceEmbedding } = req.body;
  console.log("🔍 Face verification attempt for:", email);

  if (!email || !faceEmbedding) {
    return res.status(400).json({ message: "Email and face embedding required" });
  }

  // Get stored face embedding
  const filename = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_face.json`;
  const filepath = path.join(FACE_DATA_DIR, filename);

  fs.readFile(filepath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ No face data found:", err);
      return res.status(400).json({ message: "No face data found for user" });
    }

    try {
      const storedData = JSON.parse(data);
      const similarity = calculateSimilarity(storedData.embedding, faceEmbedding);
      
      console.log("📊 Face similarity score:", similarity);

      // Threshold for face matching (adjust as needed)
      const SIMILARITY_THRESHOLD = 0.8;

      if (similarity >= SIMILARITY_THRESHOLD) {
        // Update face verification status
        db.run(
          "UPDATE pending_users SET faceVerified = 1 WHERE email = ?",
          [email],
          (updateErr) => {
            if (updateErr) {
              console.error("❌ DB update error:", updateErr);
              return res.status(500).json({ message: "DB update error" });
            }
            console.log("✅ Face verified successfully for:", email);
            res.json({ 
              message: "Face verified successfully",
              similarity: similarity,
              verified: true
            });
          }
        );
      } else {
        console.log("❌ Face verification failed - low similarity:", similarity);
        res.status(400).json({ 
          message: "Face verification failed",
          similarity: similarity,
          verified: false
        });
      }
    } catch (parseErr) {
      console.error("❌ Error parsing face data:", parseErr);
      res.status(500).json({ message: "Error processing face data" });
    }
  });
};

// Calculate cosine similarity between two embeddings
function calculateSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embedding dimensions don't match");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

// Check if all verifications are complete
exports.getVerificationStatus = (req, res) => {
  const { email } = req.params;
  console.log("🔍 Checking verification status for:", email);

  if (!email) {
    return res.status(400).json({ message: "Email parameter required" });
  }

  db.get(
    "SELECT emailVerified, phoneVerified, faceVerified FROM pending_users WHERE email = ?",
    [email],
    (err, row) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ message: "DB error" });
      }

      if (!row) {
        console.log("❌ No pending user found for email:", email);
        return res.status(404).json({ message: "User not found in pending registrations" });
      }

      console.log("📊 Verification status:", {
        email: row.emailVerified,
        phone: row.phoneVerified,
        face: row.faceVerified
      });

      res.json({
        emailVerified: row.emailVerified === 1,
        phoneVerified: row.phoneVerified === 1,
        faceVerified: row.faceVerified === 1,
        allVerified: row.emailVerified === 1 && row.phoneVerified === 1 && row.faceVerified === 1
      });
    }
  );
};