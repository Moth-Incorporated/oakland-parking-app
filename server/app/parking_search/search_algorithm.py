import math

MAX_RADIUS_MILES = 5  # Constraint C1: radius must be under 5 miles


def validate_radius(radius):
    return radius is not None and math.isfinite(radius) and 0 < radius < MAX_RADIUS_MILES


def miles_between(lat1, lng1, lat2, lng2):
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def search_spots(spots, lat, lng, radius):
    """Return vacant spots within `radius` miles of (lat, lng).

    TODO: filters (FR5) and legality check (C2 / isLegalAt) are not implemented yet.
    """
    return [
        s
        for s in spots
        if s["status"] == "vacant" and miles_between(lat, lng, s["lat"], s["lng"]) <= radius
    ]
