"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

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

  // Sidereal clock approximation: Earth rotates 360 degrees in 24 hours.
  // We use the observer's longitude and current time.
  const msInDay = 24 * 60 * 60 * 1000;
  const dayFraction = (timeMs % msInDay) / msInDay;
  const lstDeg = (dayFraction * 360 + obsLng + 180) % 360;

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
  const [activeLocation, setActiveLocation] = useState<Location>(LocationPresets[0]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("iss");
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [simulationTime, setSimulationTime] = useState<number>(() => Date.now());
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [hudGridEnabled, setHudGridEnabled] = useState<boolean>(true);
  const [trackingActive, setTrackingActive] = useState<boolean>(true);

  const lastTickRef = useRef<number>(0);

  // Clock tick effect supporting time warp speed
  useEffect(() => {
    lastTickRef.current = Date.now();
    
    if (!trackingActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setSimulationTime((prev) => prev + delta * simulationSpeed);
    }, 100);

    return () => clearInterval(interval);
  }, [simulationSpeed, trackingActive]);

  // Derive real-time positions whenever time or location changes
  const positions = React.useMemo(() => {
    const nextPositions: Record<string, ObjectPosition> = {};

    TrackedObjects.forEach((obj) => {
      if (obj.type === "satellite") {
        // Simulating ground track position
        // Orbit cycle time calculation
        const periodMs = (obj.id === "iss" ? 92.8 : 95.4) * 60 * 1000;
        const progress = (simulationTime % periodMs) / periodMs;
        const angle = progress * Math.PI * 2;

        const maxInclination = obj.id === "iss" ? 51.64 : 28.47;
        const lat = Math.sin(angle) * maxInclination;

        // Longitude drifts as Earth rotates under the satellite
        // 360 degrees per period + earth rotation drift
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

    return nextPositions;
  }, [simulationTime, activeLocation]);

  // Derive upcoming passes for ISS based on active coordinates
  const issPasses = React.useMemo(() => {
    // Generate simulated upcoming passes for the ISS above active coordinates
    const passes = [];
    const baseTime = simulationTime;
    const periodMs = 92.8 * 60 * 1000; // 92.8 minutes
    
    // Check next 4 orbits
    for (let i = 1; i <= 4; i++) {
      const passTime = baseTime + i * periodMs - (activeLocation.lat * 120000 + activeLocation.lng * 80000) % 600000;
      // Generate elevation max angle (15 to 88 degrees)
      const seed = Math.sin(activeLocation.lat * i + activeLocation.lng) * 0.5 + 0.5;
      const maxEl = Math.round(15 + seed * 73);
      const durationSec = Math.round(300 + seed * 300); // 5 to 10 mins pass

      passes.push({
        start: passTime,
        maxEl,
        durationSec,
      });
    }

    return passes;
  }, [activeLocation, simulationTime]);

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
        trackedObjects: TrackedObjects,
        positions,
        issPasses,
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
