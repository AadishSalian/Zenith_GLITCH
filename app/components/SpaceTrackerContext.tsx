"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles, SatRec } from "satellite.js";
import { useSpaceTrackerStore } from "../store/spaceTrackerStore";

export interface Location {
  lat: number;
  lng: number;
  label: string;
  country?: string;
  flag?: string;
}
 
export interface TrackedObject {
  id: string;
  name: string;
  type: "satellite" | "planet";
  altitude?: number; // in km (for satellites)
  velocity?: number; // in km/h (for satellites)
  description: string;
  // Planet specific properties (approximate J2000 coordinates)
  ra?: number;  // Right Ascension in hours (0 to 24)
  dec?: number; // Declination in degrees (-90 to 90)
}
 
export interface ObjectPosition {
  azimuth: number;
  elevation: number;
  range: number; // in km
  lat?: number;  // simulated ground track latitude
  lng?: number;  // simulated ground track longitude
  isAboveHorizon: boolean;
}
 
interface SpaceTrackerContextType {
  activeLocation: Location;
  setActiveLocation: (loc: Location) => void;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  simulationSpeed: number; // multiplier: 1, 10, 60, 600
  setSimulationSpeed: (speed: number) => void;
  simulationTime: number; // timestamp in ms
  setSimulationTime: (time: number) => void;
  crtEnabled: boolean;
  setCrtEnabled: (val: boolean) => void;
  hudGridEnabled: boolean;
  setHudGridEnabled: (val: boolean) => void;
  trackingActive: boolean;
  setTrackingActive: (val: boolean) => void;
  activeFilter: "all" | "satellite" | "planet" | "iss";
  setActiveFilter: (filter: "all" | "satellite" | "planet" | "iss") => void;
  locationPresets: Location[];
  trackedObjects: TrackedObject[];
  positions: Record<string, ObjectPosition>;
  issPasses: Array<{ start: number; maxEl: number; durationSec: number }>;
}
 
const LocationPresets: Location[] = [
  { lat: 28.5729, lng: -80.649, label: "Kennedy Space Center", country: "Florida, USA", flag: "🇺🇸" },
  { lat: 25.9902, lng: -97.1561, label: "Starbase, Boca Chica", country: "Texas, USA", flag: "🇺🇸" },
  { lat: 45.965, lng: 63.305, label: "Baikonur Cosmodrome", country: "Kazakhstan", flag: "🇰🇿" },
  { lat: 5.2361, lng: -52.7684, label: "Guiana Space Centre", country: "French Guiana", flag: "🇫🇷" },
  { lat: 67.8931, lng: 21.1042, label: "Esrange Space Center", country: "Sweden", flag: "🇸🇪" },
  { lat: 30.4002, lng: 130.9705, label: "Tanegashima Space Center", country: "Japan", flag: "🇯🇵" },
];

const TrackedObjects: TrackedObject[] = [
  {
    id: "iss",
    name: "ISS (Zarya)",
    type: "satellite",
    altitude: 418,
    velocity: 27580,
    description: "International Space Station - humanity's modular space research laboratory in low Earth orbit. Orbited by an international expedition crew at an inclination of 51.6°.",
  },
  {
    id: "hst",
    name: "Hubble Telescope",
    type: "satellite",
    altitude: 540,
    velocity: 27320,
    description: "Hubble Space Telescope - a legendary space observatory deployed in 1990. Orbiting at a lower inclination of 28.5°, it continues to map distant galaxies.",
  },
  {
    id: "mars",
    name: "Mars",
    type: "planet",
    ra: 13.5, // approximate hours
    dec: -8.5, // approximate degrees
    description: "The Red Planet - 4th planet from the Sun. Currently tracking its position along the ecliptic plane. Features extreme dust storms and a thin CO2 atmosphere.",
  },
  {
    id: "venus",
    name: "Venus",
    type: "planet",
    ra: 5.5,
    dec: 23.2,
    description: "Earth's sister planet - covered in highly reflective sulfuric clouds with a runaway greenhouse heating the surface to over 460°C.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "planet",
    ra: 19.8,
    dec: -21.4,
    description: "The King of Planets - a colossal gas giant with 95 official moons. Known for its bands of colored ammonia clouds and the Great Red Spot storm.",
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "planet",
    ra: 22.4,
    dec: -10.9,
    description: "The Ringed Jewel - second-largest planet in the solar system, characterized by a massive ring system composed of water-ice and dust particles.",
  },
];

const SpaceTrackerContext = createContext<SpaceTrackerContextType | undefined>(undefined);

// Helper function to calculate Azimuth, Elevation and Slant Range
function calculateAzimuthElevation(
  obsLat: number,
  obsLng: number,
  targetLat: number,
  targetLng: number,
  altKm: number
): ObjectPosition {
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  const lat1 = obsLat * d2r;
  const lng1 = obsLng * d2r;
  const lat2 = targetLat * d2r;
  const lng2 = targetLng * d2r;

  const R = 6371; // Earth radius in km

  // Geocentric coordinates of observer
  const x1 = R * Math.cos(lat1) * Math.cos(lng1);
  const y1 = R * Math.cos(lat1) * Math.sin(lng1);
  const z1 = R * Math.sin(lat1);

  // Geocentric coordinates of target (satellite)
  const R2 = R + altKm;
  const x2 = R2 * Math.cos(lat2) * Math.cos(lng2);
  const y2 = R2 * Math.cos(lat2) * Math.sin(lng2);
  const z2 = R2 * Math.sin(lat2);

  // Vector observer -> target
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  const slantRange = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Local horizon vectors (North, East, Up) at observer location
  const ux = Math.cos(lat1) * Math.cos(lng1);
  const uy = Math.cos(lat1) * Math.sin(lng1);
  const uz = Math.sin(lat1); // UP

  const ex = -Math.sin(lng1);
  const ey = Math.cos(lng1);
  const ez = 0; // EAST

  const nx = -Math.sin(lat1) * Math.cos(lng1);
  const ny = -Math.sin(lat1) * Math.sin(lng1);
  const nz = Math.cos(lat1); // NORTH

  // Projection onto horizon coordinate systems
  const vUp = dx * ux + dy * uy + dz * uz;
  const vEast = dx * ex + dy * ey + dz * ez;
  const vNorth = dx * nx + dy * ny + dz * nz;

  const elevation = Math.asin(vUp / slantRange) * r2d;
  let azimuth = Math.atan2(vEast, vNorth) * r2d;
  if (azimuth < 0) azimuth += 360;

  return {
    azimuth,
    elevation,
    range: slantRange,
    lat: targetLat,
    lng: targetLng,
    isAboveHorizon: elevation > 0,
  };
}

// Helper function to calculate Planet Azimuth and Elevation (Hour angle approximation)
function calculatePlanetAzimuthElevation(
  obsLat: number,
  obsLng: number,
  raHours: number,
  decDegrees: number,
  timeMs: number
): ObjectPosition {
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  // Calculate Greenwich Mean Sidereal Time (GMST) accurately using satellite.js
  const gmstRads = gstime(new Date(timeMs));
  const lstRads = gmstRads + (obsLng * d2r);
  let lstDeg = (lstRads * r2d) % 360;
  if (lstDeg < 0) lstDeg += 360;

  const raDeg = raHours * 15;
  let haDeg = lstDeg - raDeg;
  if (haDeg < -180) haDeg += 360;
  if (haDeg > 180) haDeg -= 360;

  const lat = obsLat * d2r;
  const dec = decDegrees * d2r;
  const ha = haDeg * d2r;

  // Elevation formula
  const sinEl = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const elevation = Math.asin(sinEl) * r2d;

  // Azimuth formula
  const cosAz = (Math.sin(dec) - sinEl * Math.sin(lat)) / (Math.cos(elevation * d2r) * Math.cos(lat));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * r2d;

  if (Math.sin(ha) > 0) {
    azimuth = 360 - azimuth;
  }

  // Distance to planet is simulated in Astronomical Units (AU) converted to km for range display
  // Mapped to an approximate distance from Earth (e.g. Mars is 0.5 - 2.5 AU, let's use a nice baseline)
  const baseAU = raHours % 2 === 0 ? 1.5 : 5.2; // just dynamic seed
  const rangeKm = baseAU * 149597870.7; 

  return {
    azimuth,
    elevation,
    range: rangeKm,
    isAboveHorizon: elevation > 0,
  };
}

export const SpaceTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeLocation,
    setActiveLocation,
    selectedObjectId,
    setSelectedObjectId,
    simulationSpeed,
    setSimulationSpeed,
    simulationTime,
    setSimulationTime,
    crtEnabled,
    setCrtEnabled,
    hudGridEnabled,
    setHudGridEnabled,
    trackingActive,
    setTrackingActive,
    activeFilter,
    setActiveFilter,
  } = useSpaceTrackerStore();

  const lastTickRef = useRef<number>(0);
  // Initialize satrec map for SGP4
  const satrecMapRef = useRef<Record<string, SatRec>>({});
  const [tleMap, setTleMap] = useState<Record<string, boolean>>({});
  const [dynamicTrackedObjects, setDynamicTrackedObjects] = useState<TrackedObject[]>(TrackedObjects);
  const [liveIss, setLiveIss] = useState<{latitude: number, longitude: number} | null>(null);
  const [positions, setPositions] = useState<Record<string, ObjectPosition>>({});
  const [issPasses, setIssPasses] = useState<Array<{ start: number; maxEl: number; durationSec: number }>>([]);

  // Fetch ISS passes from N2YO
  useEffect(() => {
    async function fetchPasses() {
      try {
        const res = await fetch(`/api/passes?lat=${activeLocation.lat}&lng=${activeLocation.lng}`);
        const data = await res.json();
        if (data.passes && Array.isArray(data.passes)) {
          const nextPasses = data.passes.map((p: any) => ({
            start: p.startUTC * 1000,
            maxEl: p.maxEl,
            durationSec: p.endUTC - p.startUTC
          }));
          setIssPasses(nextPasses);
        }
      } catch (err) {
        console.error("Failed to fetch passes:", err);
      }
    }
    fetchPasses();
  }, [activeLocation.lat, activeLocation.lng]);

  // Fetch live planet RA/DEC from NASA JPL
  useEffect(() => {
    async function fetchPlanets() {
      const planetIds: Record<string, string> = {
        mars: "499",
        venus: "299",
        jupiter: "599",
        saturn: "699"
      };

      const newObjects = [...dynamicTrackedObjects];
      let updated = false;

      for (const [id, target_id] of Object.entries(planetIds)) {
        try {
          const res = await fetch(`/api/horizons?target_id=${target_id}`);
          if (res.ok) {
            const data = await res.json();
            const objIndex = newObjects.findIndex(o => o.id === id);
            if (objIndex !== -1 && data.ra !== undefined && data.dec !== undefined) {
              newObjects[objIndex] = { ...newObjects[objIndex], ra: data.ra, dec: data.dec };
              updated = true;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch JPL data for ${id}:`, err);
        }
      }

      if (updated) {
        setDynamicTrackedObjects(newObjects);
      }
    }
    
    // Only run when dynamicTrackedObjects is initially populated with planets
    if (dynamicTrackedObjects.find(o => o.type === "planet" && o.ra === TrackedObjects.find(t => t.id === o.id)?.ra)) {
      fetchPlanets();
    }
  }, []);

  // Fetch ISS Live Data
  useEffect(() => {
    async function fetchIss() {
      try {
        const res = await fetch("/api/iss");
        const data = await res.json();
        if (data.iss_position) {
          setLiveIss({
            latitude: parseFloat(data.iss_position.latitude),
            longitude: parseFloat(data.iss_position.longitude),
          });
        }
      } catch (err) {}
    }
    fetchIss();
    const interval = setInterval(fetchIss, 2000); // 2s polling
    return () => clearInterval(interval);
  }, []);

  // Fetch active satellites from API
  useEffect(() => {
    async function fetchSatellites() {
      try {
        const res = await fetch("/api/satellites");
        const text = await res.text();
        const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        
        // Parse TLEs into satrecs
        let parseCount = 0;
        for (let i = 0; i < lines.length; i += 3) {
          if (i + 2 < lines.length) {
            const name = lines[i];
            const tle1 = lines[i+1];
            const tle2 = lines[i+2];
            try {
              const satrec = twoline2satrec(tle1, tle2);
              const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
              if (!satrecMapRef.current[id]) {
                satrecMapRef.current[id] = satrec;
              }
              parseCount++;
            } catch(err) {}
          }
        }

        const newTleMap: Record<string, boolean> = {};
        const newObjects: TrackedObject[] = [...TrackedObjects];
        
        let count = 0;
        for (let i = 0; i < lines.length && count < 1000; i += 3) {
          if (i + 2 < lines.length) {
            const name = lines[i];
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
            
            if (id === "iss" || id.includes("zarya") || newObjects.find(o => o.id === id)) continue;
            
            newTleMap[id] = true;
            newObjects.push({
              id,
              name,
              type: "satellite",
              description: `Active satellite orbiting Earth. SGP4 propagated.`,
            });
            count++;
          }
        }
        setTleMap(newTleMap);
        setDynamicTrackedObjects(newObjects);
      } catch (err) {
        console.error("Failed to load satellites:", err);
      }
    }
    fetchSatellites();
  }, []);

  // Compute positions
  useEffect(() => {
    lastTickRef.current = Date.now();
    
    if (!trackingActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      const nextSimulationTime = simulationTime + delta * simulationSpeed;
      setSimulationTime(nextSimulationTime);

      // Perform position computations inline instead of worker
      const nextPositions: Record<string, ObjectPosition> = {};
      const date = new Date(nextSimulationTime);

      dynamicTrackedObjects.forEach((obj) => {
        if (obj.id === "iss" && liveIss) {
          nextPositions[obj.id] = calculateAzimuthElevation(
            activeLocation.lat,
            activeLocation.lng,
            liveIss.latitude,
            liveIss.longitude,
            408
          );
        } else if (obj.type === "satellite") {
          const satrec = satrecMapRef.current[obj.id];
          if (satrec) {
            const positionAndVelocity = propagate(satrec, date);
            
            if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
              const gmst = gstime(date);
              const observerGd = {
                longitude: activeLocation.lng * Math.PI / 180,
                latitude: activeLocation.lat * Math.PI / 180,
                height: 0,
              };
              
              const positionEcf = eciToEcf(positionAndVelocity.position, gmst);
              const lookAngles = ecfToLookAngles(observerGd, positionEcf);
              
              const elevation = lookAngles.elevation * 180 / Math.PI;
              const azimuth = lookAngles.azimuth * 180 / Math.PI;
              const range = lookAngles.rangeSat;
              
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
            const progress = (nextSimulationTime % periodMs) / periodMs;
            const angle = progress * Math.PI * 2;
            const maxInclination = obj.id === "iss" ? 51.64 : 28.47;
            const lat = Math.sin(angle) * maxInclination;
            const earthDrift = (nextSimulationTime / (24 * 60 * 60 * 1000)) * 360;
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
            nextSimulationTime
          );
        }
      });

      setPositions(nextPositions);
    }, 100);

    return () => clearInterval(interval);
  }, [simulationSpeed, trackingActive, simulationTime, activeLocation, dynamicTrackedObjects, liveIss, setSimulationTime]);

  // Real upcoming passes are now fetched from N2YO API in useEffect

  return (
    <SpaceTrackerContext.Provider
      value={{
        activeLocation,
        setActiveLocation,
        selectedObjectId,
        setSelectedObjectId,
        simulationSpeed,
        setSimulationSpeed,
        simulationTime,
        setSimulationTime,
        crtEnabled,
        setCrtEnabled,
        hudGridEnabled,
        setHudGridEnabled,
        trackingActive,
        setTrackingActive,
        locationPresets: LocationPresets,
        trackedObjects: dynamicTrackedObjects,
        positions,
        issPasses,
        activeFilter,
        setActiveFilter,
      }}
    >
      {children}
    </SpaceTrackerContext.Provider>
  );
};

export const useSpaceTracker = () => {
  const context = useContext(SpaceTrackerContext);
  if (!context) {
    throw new Error("useSpaceTracker must be used within a SpaceTrackerProvider");
  }
  return context;
};



