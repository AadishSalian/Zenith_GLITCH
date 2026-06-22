import * as satellite from "satellite.js";

// Keep references to SatRec objects so we don't re-parse TLEs every tick
const satrecMap: Record<string, satellite.SatRec> = {};

// Helper for Earth's oblateness
const calculatePlanetAzimuthElevation = (
  observerLat: number,
  observerLng: number,
  ra: number,
  dec: number,
  timeMs: number
) => {
  // Simplified approximation
  const rad = Math.PI / 180;
  const JD = timeMs / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525.0;
  const gmst0 = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  let lst = (gmst0 + observerLng) % 360;
  if (lst < 0) lst += 360;
  
  const ha = (lst - ra) * rad;
  const decRad = dec * rad;
  const latRad = observerLat * rad;
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);
  
  const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;
  
  return {
    azimuth: az / rad,
    elevation: alt / rad,
    range: 1000000,
    isAboveHorizon: alt > 0,
  };
};

// Calculate generic lat/lng to az/el (for mocked ISS when no TLE or live data)
const calculateAzimuthElevation = (obsLat: number, obsLng: number, targetLat: number, targetLng: number, targetAlt: number) => {
  const rad = Math.PI / 180;
  const rEarth = 6371;
  const rTarget = rEarth + targetAlt;

  const dLng = (targetLng - obsLng) * rad;
  const lat1 = obsLat * rad;
  const lat2 = targetLat * rad;

  const cosAngle = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const angle = Math.acos(cosAngle);

  const d1 = rEarth;
  const d2 = rTarget;
  const distance = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosAngle);

  const sinEl = (d2 * Math.cos(angle) - d1) / distance;
  const elevation = Math.asin(sinEl) / rad;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let azimuth = Math.atan2(y, x) / rad;
  if (azimuth < 0) azimuth += 360;

  return { azimuth, elevation, range: distance, isAboveHorizon: elevation > 0 };
};


self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === "UPDATE_TLES") {
    const { tleLines } = data;
    let count = 0;
    for (let i = 0; i < tleLines.length; i += 3) {
      if (i + 2 < tleLines.length) {
        const name = tleLines[i];
        const tle1 = tleLines[i+1];
        const tle2 = tleLines[i+2];
        
        try {
          const satrec = satellite.twoline2satrec(tle1, tle2);
          const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
          if (!satrecMap[id]) {
            satrecMap[id] = satrec;
          }
          count++;
        } catch(err) {}
      }
    }
  }

  if (type === "COMPUTE_POSITIONS") {
    const { simulationTime, activeLocation, dynamicTrackedObjects, liveIss } = data;
    const nextPositions: Record<string, any> = {};
    const date = new Date(simulationTime);

    dynamicTrackedObjects.forEach((obj: any) => {
      if (obj.id === "iss" && liveIss) {
        // Use live OpenNotify coords for ISS if available
        nextPositions[obj.id] = calculateAzimuthElevation(
          activeLocation.lat,
          activeLocation.lng,
          liveIss.latitude,
          liveIss.longitude,
          408 // avg ISS altitude
        );
      } else if (obj.type === "satellite") {
        if (satrecMap[obj.id]) {
          const satrec = satrecMap[obj.id];
          const positionAndVelocity = satellite.propagate(satrec, date);
          
          if (positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
            const gmst = satellite.gstime(date);
            
            const observerGd = {
              longitude: activeLocation.lng * Math.PI / 180,
              latitude: activeLocation.lat * Math.PI / 180,
              height: 0,
            };
            
            const positionEcf = satellite.eciToEcf(positionAndVelocity.position, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
            
            const elevation = lookAngles.elevation * 180 / Math.PI;
            const azimuth = lookAngles.azimuth * 180 / Math.PI;
            const range = lookAngles.range;
            
            nextPositions[obj.id] = {
              azimuth,
              elevation,
              range,
              isAboveHorizon: elevation > 0,
            };
          }
        } else {
          // Fallback mock
          const periodMs = (obj.id === "iss" ? 92.8 : 95.4) * 60 * 1000;
          const progress = (simulationTime % periodMs) / periodMs;
          const angle = progress * Math.PI * 2;
          const maxInclination = obj.id === "iss" ? 51.64 : 28.47;
          const lat = Math.sin(angle) * maxInclination;
          const earthDrift = (simulationTime / (24 * 60 * 60 * 1000)) * 360;
          let lng = (progress * 360 - earthDrift) % 360;
          if (lng > 180) lng -= 360;
          if (lng < -180) lng += 360;
  
          nextPositions[obj.id] = calculateAzimuthElevation(
            activeLocation.lat,
            activeLocation.lng,
            lat,
            lng,
            obj.altitude || 400
          );
        }
      } else {
        // Planet
        nextPositions[obj.id] = calculatePlanetAzimuthElevation(
          activeLocation.lat,
          activeLocation.lng,
          obj.ra || 0,
          obj.dec || 0,
          simulationTime
        );
      }
    });

    self.postMessage({ type: "POSITIONS_UPDATED", positions: nextPositions });
  }
};
