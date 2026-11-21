from app.parking_search.mock_spots import MOCK_SPOTS
from app.parking_search.search_algorithm import search_spots, validate_radius

def test_radius_at_or_over_limit_is_rejected():
    assert not validate_radius(5)
    assert not validate_radius(6)

def test_search_returns_only_nearby_vacant_spots():
    spots = search_spots(MOCK_SPOTS, 40.4444, -79.9533, 1)
    assert sorted(s["id"] for s in spots) == [1, 3, 4]