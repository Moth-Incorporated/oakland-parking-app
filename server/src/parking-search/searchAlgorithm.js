export const MAX_RADIUS_MILES = 5; // Constraint C1: radius must be under 5 miles

export function validateRadius(radius) {
  return Number.isFinite(radius) && radius > 0 && radius < MAX_RADIUS_MILES;
}

export function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Returns vacant spots within `radius` miles of (lat, lng).
// TODO: filters (FR5) and legality check (C2 / isLegalAt) are not implemented yet.
export function searchSpots(spots, { lat, lng, radius }) {
  return spots.filter(
    (s) => s.status === "vacant" && milesBetween(lat, lng, s.lat, s.lng) <= radius
  );
}
