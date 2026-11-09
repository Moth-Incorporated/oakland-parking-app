import { Router } from "express";
import { mockSpots } from "./mockSpots.js";
import { searchSpots, validateRadius } from "./searchAlgorithm.js";

const router = Router();

// GET /api/search?lat=40.4444&lng=-79.9533&radius=1
router.get("/search", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius ?? 1);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }
  if (!validateRadius(radius)) {
    return res.status(400).json({ error: "Radius must be under 5 miles" });
  }

  const spots = searchSpots(mockSpots, { lat, lng, radius });
  res.json({ count: spots.length, spots, fetchedAt: Date.now() });
});

export default router;
