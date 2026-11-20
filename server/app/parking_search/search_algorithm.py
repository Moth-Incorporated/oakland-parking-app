
import math

MAX_RADIUS_MILES = 5


def validate_radius(radius):
    return radius is not None and math.isfinite(radius) and 0 < radius < MAX_RADIUS_MILES


def miles_between(lat1, lng1, lat2, lng2):
    earth_radius = 3958.8

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    lat_diff = lat2 - lat1
    lng_diff = math.radians(lng2 - lng1)

    a = (
        math.sin(lat_diff / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(lng_diff / 2) ** 2
    )

    return 2 * earth_radius * math.asin(math.sqrt(min(1.0, a)))


def search_spots(spots, lat, lng, radius, filters=None):
    """Find vacant parking spots within the radius that match user preferences."""

    if filters is None:
        filters = {}

    matching_spots = []

    for spot in spots:
        if spot["status"] != "vacant":
            continue

        distance = miles_between(lat, lng, spot["lat"], spot["lng"])
        if distance > radius:
            continue

        if filters.get("is_covered") and not spot.get("is_covered", False):
            continue

        if filters.get("is_handicapped") and not spot.get("is_handicap", False):
            continue

        matching_spots.append(spot)

    return matching_spots
