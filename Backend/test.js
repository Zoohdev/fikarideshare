const { findBestMatch } = require("./services/matching");
const { buildFinalRoute } = require("./services/routePlanner");

(async () => {
  console.log("🚀 Running Ride Matching Test...\n");

  const data = {
    rider: {
      name: "Kundalahalli Gate",
      pickup: { lat: 12.9558, lng: 77.7147 },
      destination: { lat: 12.9787, lng: 77.7162 }
    },

    candidates: [
      {
        name: "AECS Layout",
        pickup: { lat: 12.9714, lng: 77.7125 },
        destination: { lat: 12.9765, lng: 77.7248 }
      },
      {
        name: "Brookefield",
        pickup: { lat: 12.9711, lng: 77.7106 },
        destination: { lat: 12.9789, lng: 77.7139 }
      },
      {
        name: "Marathahalli Bridge",
        pickup: { lat: 12.9698, lng: 77.7126 },
        destination: { lat: 12.9776, lng: 77.7162 }
      },
      {
        name: "Graphite India Road",
        pickup: { lat: 12.9783, lng: 77.7108 },
        destination: { lat: 12.9776, lng: 77.7162 }
      }
    ]
  };

  // 🔥 STEP 1 — Find best matches
  const result = await findBestMatch(
    data.rider,
    data.candidates
  );

  console.log("\n✅ FINAL MATCHED RIDERS:\n");

  result.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
  });

  // 🔥 STEP 2 — Build final route
  const finalRoute = await buildFinalRoute(result);

  console.log("\n🗺 FINAL ROUTE:\n");

  finalRoute.stops.forEach((stop, i) => {
    console.log(`${i + 1}. (${stop.lat}, ${stop.lng})`);
  });

  console.log(`\n⏱ Total ETA: ${finalRoute.eta.toFixed(2)} mins`);

  // =========================================================
  // 📊 STEP 3 — MATCH REPORT (IMPORTANT PART)
  // =========================================================

  console.log("\n📊 MATCH REPORT:\n");

  const totalRiders = result.length;
  const totalETA = finalRoute.eta;

  // ✅ 🔥 CORRECT PLACE TO ADD EFFICIENCY
  // (This is where you asked 👇)
  const efficiency = (totalRiders - 1) / totalETA;

  // 🔥 Average detour
  let avgDetour = 0;

  if (result.length > 1) {
    avgDetour =
      result
        .slice(1)
        .reduce((sum, r) => sum + (r.detour || 0), 0) /
      (result.length - 1);
  }

  // 🔥 Match quality classification
  let quality = "❌ Poor";

  if (efficiency > 0.15) quality = "⚠️ Average";
  if (efficiency > 0.25) quality = "✅ Good";
  if (efficiency > 0.35) quality = "🔥 Excellent";

  console.log("Total Riders:", totalRiders);
  console.log("Final ETA:", totalETA.toFixed(2), "mins");
  console.log("Efficiency Score:", efficiency.toFixed(3));
  console.log("Average Detour:", avgDetour.toFixed(2), "%");
  console.log("Match Quality:", quality);
})();