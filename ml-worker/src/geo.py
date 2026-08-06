"""Geospatial helpers for route-deviation math.

Distances are in meters. For the short segments involved in a trip, a local
equirectangular projection around the segment origin is accurate enough and far
cheaper than full geodesics.
"""
import math

EARTH_RADIUS_M = 6_371_000.0


def haversine_m(a, b):
    """Great-circle distance between two (lat, lng) points, in meters."""
    lat1, lng1 = a
    lat2, lng2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(h)))


def _to_local_xy(point, origin):
    """Project (lat, lng) to local planar (x, y) meters relative to origin."""
    lat, lng = point
    olat, olng = origin
    x = math.radians(lng - olng) * math.cos(math.radians(olat)) * EARTH_RADIUS_M
    y = math.radians(lat - olat) * EARTH_RADIUS_M
    return x, y


def point_to_segment_m(p, a, b):
    """Shortest distance (m) from point p to the segment a-b, all (lat, lng)."""
    ax, ay = 0.0, 0.0
    bx, by = _to_local_xy(b, a)
    px, py = _to_local_xy(p, a)
    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0.0:
        return math.hypot(px, py)
    t = max(0.0, min(1.0, (px * dx + py * dy) / seg_len_sq))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def distance_to_polyline_m(point, polyline):
    """Min distance (m) from point to a polyline (list of (lat, lng))."""
    if not polyline:
        return 0.0
    if len(polyline) == 1:
        return haversine_m(point, polyline[0])
    return min(
        point_to_segment_m(point, polyline[i], polyline[i + 1])
        for i in range(len(polyline) - 1)
    )


def path_length_km(points):
    """Total length of a GPS path (list of (lat, lng)) in kilometers."""
    if len(points) < 2:
        return 0.0
    return sum(haversine_m(points[i], points[i + 1]) for i in range(len(points) - 1)) / 1000.0
