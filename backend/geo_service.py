import math
from config import settings

OFFICE_LAT = 28.6139   # Change to your office coordinates
OFFICE_LNG = 77.2090

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def is_within_geofence(lat: float, lng: float) -> dict:
    """Check if user is within office geofence radius."""
    distance = haversine_distance(OFFICE_LAT, OFFICE_LNG, lat, lng)
    within = distance <= settings.GEOFENCE_RADIUS_METERS
    return {
        "within_geofence": within,
        "distance_meters": round(distance, 2),
        "allowed_radius": settings.GEOFENCE_RADIUS_METERS
    }
