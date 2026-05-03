const express = require("express");
const router = express.Router();
const { findBestMatch } = require("../services/matching");

router.post("/match", async (req, res) => {
  const { rider, candidates } = req.body;

  const result = await findBestMatch(rider, candidates);

  res.json({ assigned: result });
});

module.exports = router;