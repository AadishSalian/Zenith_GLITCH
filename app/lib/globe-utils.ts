import { Vector3 } from "three";

// Convert lat/lon degrees to 3D unit sphere position
export function latLonToVector3(lat: number, lon: number, radius = 1): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Convert a 3D point on unit sphere back to lat/lon
export function vector3ToLatLon(v: Vector3): { lat: number; lon: number } {
  const normalized = v.clone().normalize();
  const lat = Math.asin(normalized.y) * (180 / Math.PI);
  const lon = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);
  return { lat, lon };
}

// Format lat/lon as a readable string e.g. "12.34°N, 56.78°E"
export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

// Return a human-readable cardinal direction from azimuth degrees
export function azimuthToCardinal(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((az %= 360) < 0 ? az + 360 : az) / 45) % 8;
  return dirs[index];
}

