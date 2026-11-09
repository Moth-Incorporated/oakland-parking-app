import time

from flask import Blueprint, jsonify, request

from .mock_spots import MOCK_SPOTS
from .search_algorithm import search_spots, validate_radius

parking_search_bp = Blueprint("parking_search", __name__)


# GET /api/search?lat=40.4444&lng=-79.9533&radius=1
@parking_search_bp.get("/search")
def search():
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    radius = request.args.get("radius", default=1.0, type=float)

    if lat is None or lng is None:
        return jsonify(error="lat and lng are required"), 400
    if not validate_radius(radius):
        return jsonify(error="Radius must be under 5 miles"), 400

    spots = search_spots(MOCK_SPOTS, lat, lng, radius)
    return jsonify(count=len(spots), spots=spots, fetchedAt=int(time.time() * 1000))
