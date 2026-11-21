
import csv
import io
import random
import time

from flask import Blueprint, Response, jsonify, request

# Center point: Cathedral of Learning.
CENTER_LATITUDE = 40.4443
CENTER_LONGITUDE = -79.9532

DEFAULT_COUNT = 160
MAX_COUNT = 1000
DEFAULT_SEED = 42
STATUS_CHANGE_SECONDS = 30

STREETS = [
    "Forbes Ave", "Fifth Ave", "Bigelow Blvd", "Atwood St", "Meyran Ave",
    "Bouquet St", "Semple St", "Sennott St", "Craig St", "Bayard St",
]

# Vacancy fields in output order (field name, display label). The CSV uses this order.
COLUMNS = [
    ("id", "ID"),
    ("name", "Name"),
    ("lat", "Latitude"),                    # lat/lng match parking_search/search_algorithm.py
    ("lng", "Longitude"),
    ("type", "Type"),                       # street | garage | surface
    ("status", "Status"),                   # vacant | occupied
    ("is_free", "Free"),
    ("price_per_hour", "Price / hr ($)"),   # US4
    ("is_covered", "Covered"),
    ("is_handicapped", "Handicap"),
    ("is_ev_charging", "EV Charging"),
    ("height_clearance_ft", "Clearance (ft)"),  # US9, blank = no height limit
    ("available_from", "Available From"),   # US8, 24-hour HH:MM
    ("available_until", "Available Until"), # US8, may run past midnight
    ("last_updated", "Last Updated"),      
]


def generate_vacancies(count=DEFAULT_COUNT, seed=DEFAULT_SEED, now_ms=None):
    now_ms = int(time.time() * 1000) if now_ms is None else now_ms
    place = random.Random(seed)  # fixed details: location, type, price, hours
    flip = random.Random(f"{seed}-{now_ms // (STATUS_CHANGE_SECONDS * 1000)}")  # vacant/occupied
    type_counts = {"street": 0, "garage": 0, "surface": 0}
    spots = []

    for spot_id in range(1, count + 1):
        roll = place.random()
        spot_type = "street" if roll < 0.70 else "garage" if roll < 0.85 else "surface"
        type_counts[spot_type] += 1
        n = type_counts[spot_type]

        latitude = CENTER_LATITUDE + (place.random() + place.random() - 1) * 0.009
        longitude = CENTER_LONGITUDE + (place.random() + place.random() - 1) * 0.012

        if spot_type == "street":
            name = f"{place.choice(STREETS)}, curb {n}"
            is_free = place.random() < 0.25
            price = place.choice([1.50, 2.00, 2.50])
            hours = place.choice([("08:00", "18:00"), ("08:00", "20:00"), ("18:00", "08:00")])
            clearance = None
        elif spot_type == "garage":
            name = f"Oakland Garage {n}"
            is_free = False
            price = place.choice([3.50, 4.00, 4.50, 5.00])
            hours = place.choice([("00:00", "23:59"), ("05:00", "23:00"), ("06:00", "22:00")])
            clearance = place.choice([6.5, 6.8, 7.0, 7.5])
        else:
            name = f"Surface Lot {n}"
            is_free = place.random() < 0.10
            price = place.choice([2.00, 3.00])
            hours = place.choice([("06:00", "22:00"), ("07:00", "19:00")])
            clearance = None

        spots.append({
            "id": spot_id,
            "name": name,
            "lat": round(latitude, 6),
            "lng": round(longitude, 6),
            "type": spot_type,
            "status": "vacant" if flip.random() < 0.8 else "occupied",
            "is_free": is_free,
            "price_per_hour": 0.0 if is_free else price,
            "is_covered": spot_type == "garage",
            "is_handicapped": place.random() < 0.10,
            "is_ev_charging": spot_type != "street" and place.random() < 0.30,
            "height_clearance_ft": clearance,
            "available_from": hours[0],
            "available_until": hours[1],
            "last_updated": now_ms,
        })

    return spots


def to_csv(spots):
    """Return the spots as CSV text with a header row."""
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(key for key, _ in COLUMNS)
    for spot in spots:
        writer.writerow("" if spot[key] is None else spot[key] for key, _ in COLUMNS)
    return out.getvalue()


def _request_options():
    """Read ?count and ?seed. Returns (count, seed, error message or None)."""
    try:
        count = int(request.args.get("count", DEFAULT_COUNT))
        seed = int(request.args.get("seed", DEFAULT_SEED))
    except ValueError:
        return None, None, "count and seed must be whole numbers"
    if not 1 <= count <= MAX_COUNT:
        return None, None, f"count must be from 1 to {MAX_COUNT}"
    return count, seed, None


vacancy_bp = Blueprint("vacancy_data", __name__)


@vacancy_bp.get("/vacancies")
def vacancies_json():
    count, seed, error = _request_options()
    if error:
        return jsonify(error=error), 400
    spots = generate_vacancies(count, seed)
    vacant = sum(spot["status"] == "vacant" for spot in spots)
    return jsonify(count=len(spots), vacantCount=vacant, vacancies=spots, fetchedAt=spots[0]["last_updated"])


@vacancy_bp.get("/vacancies.csv")
def vacancies_csv():
    count, seed, error = _request_options()
    if error:
        return jsonify(error=error), 400
    return Response(
        to_csv(generate_vacancies(count, seed)),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=vacancy_data.csv"},
    )
