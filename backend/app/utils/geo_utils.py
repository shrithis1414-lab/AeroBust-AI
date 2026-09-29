import math
from typing import List, Tuple, Dict
from ..config import LAT_MIN, LAT_MAX, LON_MIN, LON_MAX, GRID_STEP

def get_grid_coordinates(step: float = GRID_STEP) -> List[Tuple[float, float]]:
    """Generate lat/lon tuples covering the Indian subcontinent domain."""
    coords = []
    lat = LAT_MIN
    while lat <= LAT_MAX + 1e-6:
        lon = LON_MIN
        while lon <= LON_MAX + 1e-6:
            coords.append((round(lat, 2), round(lon, 2)))
            lon += step
        lat += step
    return coords

def classify_region(lat: float, lon: float) -> str:
    """Classify coordinates into realistic meteorological sub-regions."""
    if lat < 18.0 and lon < 73.5:
        return "South Arabian Sea"
    elif lat >= 18.0 and lat <= 25.0 and lon < 72.5:
        return "North Arabian Sea / Saurashtra Coast"
    elif lat < 19.5 and lon > 83.0 and lon < 95.0:
        return "Bay of Bengal"
    elif lat >= 8.0 and lat <= 20.0 and 72.5 <= lon <= 75.8:
        return "Western Ghats / Konkan-Goa"
    elif 16.0 <= lat <= 22.5 and 81.0 <= lon <= 87.5:
        return "Odisha & Coastal Andhra"
    elif 18.5 <= lat <= 22.5 and 76.0 <= lon <= 80.5:
        return "Vidarbha & Marathwada"
    elif 21.0 <= lat <= 26.5 and 75.0 <= lon <= 83.5:
        return "Central India (MP & CG)"
    elif 24.5 <= lat <= 28.5 and 78.0 <= lon <= 88.0:
        return "Gangetic Plains (UP & Bihar)"
    elif 23.5 <= lat <= 30.5 and 68.5 <= lon <= 76.5:
        return "Northwest India (Rajasthan & Punjab)"
    elif 30.5 <= lat <= 37.5 and 73.0 <= lon <= 81.0:
        return "Western Himalayas (J&K & Himachal)"
    elif 23.5 <= lat <= 29.0 and 89.0 <= lon <= 97.0:
        return "Northeast India (Assam & Meghalaya)"
    elif 8.0 <= lat <= 16.0 and 76.0 <= lon <= 80.5:
        return "Southern Peninsula (Tamil Nadu & Karnataka)"
    else:
        return "Indian Subcontinent"

def is_land_point(lat: float, lon: float) -> bool:
    """Approximate India land vs oceanic water mask."""
    # South of peninsular tip
    if lat < 8.0:
        return False
    # Arabian Sea cutout
    if lat < 21.0 and lon < 72.0:
        return False
    # Bay of Bengal cutout
    if 8.0 <= lat <= 15.0 and lon > 80.5:
        return False
    if 15.0 < lat <= 21.0 and lon > 86.5:
        return False
    return True

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in kilometers between two points."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
