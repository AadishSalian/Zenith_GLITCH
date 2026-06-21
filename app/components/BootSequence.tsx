"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSpaceTracker, Location } from "./SpaceTrackerContext";
import { motion, AnimatePresence } from "framer-motion";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import { 
  Check, 
  Navigation, 
  Globe, 
  Search, 
  Lock, 
  Compass
} from "lucide-react";

// City/Coordinates Geocoding database dictionary for manual queries
const CityDictionary: Record<string, { lat: number; lng: number; label: string; country: string; flag: string }> = {
  tokyo: { lat: 35.6762, lng: 139.6503, label: "Tokyo", country: "Japan", flag: "🇯🇵" },
  london: { lat: 51.5074, lng: -0.1278, label: "London", country: "United Kingdom", flag: "🇬🇧" },
  newyork: { lat: 40.7128, lng: -74.0060, label: "New York", country: "New York, USA", flag: "🇺🇸" },
  sydney: { lat: -33.8688, lng: 151.2093, label: "Sydney", country: "Australia", flag: "🇦🇺" },
  paris: { lat: 48.8566, lng: 2.3522, label: "Paris", country: "France", flag: "🇫🇷" },
  berlin: { lat: 52.5200, lng: 13.4050, label: "Berlin", country: "Germany", flag: "🇩🇪" },
  mumbai: { lat: 19.0760, lng: 72.8777, label: "Mumbai", country: "India", flag: "🇮🇳" },
  moscow: { lat: 55.7558, lng: 37.6173, label: "Moscow", country: "Russia", flag: "🇷🇺" },
  beijing: { lat: 39.9042, lng: 116.4074, label: "Beijing", country: "China", flag: "🇨🇳" },
  cairo: { lat: 30.0444, lng: 31.2357, label: "Cairo", country: "Egypt", flag: "🇪🇬" },
  capetown: { lat: -33.9249, lng: 18.4241, label: "Cape Town", country: "South Africa", flag: "🇿🇦" },
  rio: { lat: -22.9068, lng: -43.1729, label: "Rio de Janeiro", country: "Brazil", flag: "🇧🇷" },
  toronto: { lat: 43.6532, lng: -79.3832, label: "Toronto", country: "Canada", flag: "🇨🇦" },
  losangeles: { lat: 34.0522, lng: -118.2437, label: "Los Angeles", country: "California, USA", flag: "🇺🇸" },
  singapore: { lat: 1.3521, lng: 103.8198, label: "Singapore", country: "Singapore", flag: "🇸🇬" },
  seoul: { lat: 37.5665, lng: 126.9780, label: "Seoul", country: "South Korea", flag: "🇰🇷" },
  dubai: { lat: 25.2048, lng: 55.2708, label: "Dubai", country: "UAE", flag: "🇦🇪" },
  bangkok: { lat: 13.7563, lng: 100.5018, label: "Bangkok", country: "Thailand", flag: "🇹🇭" },
  nairobi: { lat: -1.2921, lng: 36.8219, label: "Nairobi", country: "Kenya", flag: "🇰🇪" },
  buenosaires: { lat: -34.6037, lng: -58.3816, label: "Buenos Aires", country: "Argentina", flag: "🇦🇷" },
  mexicocity: { lat: 19.4326, lng: -99.1332, label: "Mexico City", country: "Mexico", flag: "🇲🇽" },
  starbase: { lat: 25.9902, lng: -97.1561, label: "Starbase, Boca Chica", country: "Texas, USA", flag: "🇺🇸" },
  kennedy: { lat: 28.5729, lng: -80.6490, label: "Kennedy Space Center", country: "Florida, USA", flag: "🇺🇸" },
  esrange: { lat: 67.8931, lng: 21.1042, label: "Esrange Space Center", country: "Sweden", flag: "🇸🇪" },
  guiana: { lat: 5.2361, lng: -52.7684, label: "Guiana Space Centre", country: "French Guiana", flag: "🇫🇷" },
  baikonur: { lat: 45.9650, lng: 63.3050, label: "Baikonur Cosmodrome", country: "Kazakhstan", flag: "🇰🇿" },
  tanegashima: { lat: 30.4002, lng: 130.9705, label: "Tanegashima Space Center", country: "Japan", flag: "🇯🇵" },
};

const diagnosticMessages = [
  "Establishing connection to orbital array...",
  "Syncing Local Sidereal Clock with observation point...",
  "Calibrating celestial dome projection limits...",
  "Caching planetary orbital vectors (Mars, Venus, Jupiter, Saturn)...",
  "Interpolating satellite orbits (ISS inclination 51.64°)...",
  "Synchronizing telemetry deck graphics and HUD overlays...",
];

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const { activeLocation, setActiveLocation, locationPresets } = useSpaceTracker();
  const [bootPhase, setBootPhase] = useState<"intro" | "diagnostics" | "completed">("intro");
  const [diagStep, setDiagStep] = useState<number>(0);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapHoverCoords, setMapHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFeedback, setSearchFeedback] = useState<{ text: string; error: boolean } | null>(null);

  // Track state in Refs to prevent re-initializing the Leaflet map on coordinates update
  const activeLocationRef = useRef(activeLocation);
  const setActiveLocationRef = useRef(setActiveLocation);

  useEffect(() => {
    activeLocationRef.current = activeLocation;
  }, [activeLocation]);

  useEffect(() => {
    setActiveLocationRef.current = setActiveLocation;
  }, [setActiveLocation]);

  // Leaflet refs
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        LRef.current = (leaflet.default || leaflet) as typeof import("leaflet");
        setLeafletLoaded(true);
      });
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;

    const pulseIcon = L.divIcon({
      className: "custom-leaflet-pulse-icon",
      html: `<div class="relative w-6 h-6 flex items-center justify-center pointer-events-none">
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f] z-10"></span>
        <span class="absolute w-6 h-6 border border-[#ff007f] rounded-full animate-ping opacity-75"></span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const map = L.map(mapRef.current, {
      center: [activeLocationRef.current.lat, activeLocationRef.current.lng],
      zoom: 2,
      zoomControl: true,
      minZoom: 1,
      maxZoom: 12,
      attributionControl: true
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      className: "base-map-tiles"
    }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
      className: "label-tiles"
    }).addTo(map);

    const marker = L.marker([activeLocationRef.current.lat, activeLocationRef.current.lng], { icon: pulseIcon }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    map.on("click", (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const latFixed = parseFloat(lat.toFixed(4));
      const lngFixed = parseFloat(lng.toFixed(4));

      setActiveLocationRef.current({
        lat: latFixed,
        lng: lngFixed,
        label: "Custom Target Lock",
        country: "Custom Coordinates",
        flag: "📍",
      });

      setSearchFeedback({
        text: `Geodetic lock: ${latFixed}° N, ${lngFixed}° E`,
        error: false,
      });
    });

    map.on("mousemove", (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setMapHoverCoords({
        lat: parseFloat(lat.toFixed(2)),
        lng: parseFloat(lng.toFixed(2))
      });
    });

    map.on("mouseout", () => {
      setMapHoverCoords(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [leafletLoaded]);

  // Track coordinates sync and update map display
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const latlng: [number, number] = [activeLocation.lat, activeLocation.lng];
      markerRef.current.setLatLng(latlng);
      mapInstanceRef.current.panTo(latlng);
      
      const popupContent = `
        <div class="font-mono text-[9px] leading-relaxed p-0.5">
          <div class="text-[#ff007f] font-black tracking-wider border-b border-[#ff007f]/20 pb-0.5 mb-1 uppercase">
            🛰️ TARGET LOCK: ${activeLocation.label.toUpperCase()}
          </div>
          <div class="text-white">LAT: <span class="text-[#00f3ff] font-bold">${activeLocation.lat.toFixed(4)}°</span></div>
          <div class="text-white">LNG: <span class="text-[#00f3ff] font-bold">${activeLocation.lng.toFixed(4)}°</span></div>
        </div>
      `;
      
      markerRef.current.bindPopup(popupContent, { 
        closeButton: false,
        autoClose: false,
        closeOnClick: false
      }).openPopup();
    }
  }, [activeLocation.lat, activeLocation.lng, activeLocation.label]);

  // Start Calibration
  const handleStartCalibration = () => {
    setBootPhase("diagnostics");
  };

  // Run diagnostics sequence
  useEffect(() => {
    if (bootPhase !== "diagnostics") return;

    if (diagStep < diagnosticMessages.length) {
      const timer = setTimeout(() => {
        setDiagStep((prev) => prev + 1);
      }, 700 + Math.random() * 400);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setBootPhase("completed");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bootPhase, diagStep]);

  // Handle final reveal with glitch visual trigger
  const handleRevealMainDeck = () => {
    setGlitchActive(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  // Browser Geolocation GPS calibration
  const handleGPSDetect = () => {
    setGpsLoading(true);
    setGpsError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          setActiveLocation({
            lat,
            lng,
            label: "GPS Synced Node",
            country: "Observer Location",
            flag: "📡",
          });
          setGpsLoading(false);
          setSearchFeedback({
            text: `GPS lock established: ${lat}°, ${lng}°`,
            error: false,
          });
        },
        (error) => {
          let msg = "GPS calibration failed. Fallback preset loaded.";
          if (error.code === error.PERMISSION_DENIED) msg = "Location sensor access denied.";
          setGpsError(msg);
          setGpsLoading(false);
          setActiveLocation(locationPresets[0]);
        },
        { timeout: 8000 }
      );
    } else {
      setGpsError("GPS Geolocation sensor not supported.");
      setGpsLoading(false);
      setActiveLocation(locationPresets[0]);
    }
  };

  // Select a preset spaceport
  const handlePresetSelect = (preset: Location) => {
    setActiveLocation(preset);
    setSearchFeedback({
      text: `Target lock established: ${preset.label}, ${preset.country || ""} ${preset.flag || ""}`,
      error: false,
    });
  };

  // Search Address / Coordinates
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFeedback(null);
    if (!searchQuery.trim()) return;

    const normalizedQuery = searchQuery.toLowerCase().trim().replace(/[\s,_]/g, "");

    // 1. Check if query is coordinate pairs (e.g. 35.68, 139.69 or 35.68 139.69)
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setSearchFeedback({
          text: "Boundary error: Lat range [-90,90], Lng range [-180,180].",
          error: true,
        });
        return;
      }

      setActiveLocation({
        lat,
        lng,
        label: "Manual Alignment target",
        country: "Input Coords",
        flag: "✏️",
      });

      setSearchFeedback({
        text: `Target lock established: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
        error: false,
      });
      return;
    }

    // 2. Check City dictionary resolver
    const cityResult = CityDictionary[normalizedQuery];
    if (cityResult) {
      setActiveLocation(cityResult);
      setSearchFeedback({
        text: `Target lock established: ${cityResult.label}, ${cityResult.country} ${cityResult.flag}`,
        error: false,
      });
    } else {
      setSearchFeedback({
        text: `Location query unrecognized. Try presets or coordinates (e.g. "28.572, -80.649").`,
        error: true,
      });
    }
  };


  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center bg-[#020612] space-grid overflow-hidden transition-all duration-1000 ${
        glitchActive ? "scale-105 opacity-0 brightness-150 filter saturate-200" : ""
      }`}
    >
      {/* HUD scanline and screen glow filters */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020612] via-transparent to-[#020612] pointer-events-none" />
      <div className="absolute inset-x-0 h-1 bg-[#00f3ff]/10 blur-[1px] scanline-scanner pointer-events-none" />

      {/* Dynamic Starfield Background Layers */}
      <div className="starfield pointer-events-none absolute inset-0 z-0">
        <div className="stars-1 absolute inset-0" />
        <div className="stars-2 absolute inset-0" />
        <div className="stars-3 absolute inset-0" />
        <div className="shooting-star absolute" />
        <div className="shooting-star shooting-star-2 absolute" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl px-8 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20 border-b border-[#101b33]/30 bg-gradient-to-b from-[#030816]/45 to-transparent backdrop-blur-sm shrink-0">
        {/* Left: System state */}
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.15em] text-[#00f3ff]/70 md:w-1/3 justify-start">
          <Compass className="w-3.5 h-3.5 text-[#00f3ff] animate-pulse" />
          <span>BOOT_SYS // ORBIT.ARRAY_INIT</span>
        </div>

        {/* Center: Main title & subtitle */}
        <div className="text-center md:w-1/3 flex flex-col items-center">
          <motion.h1 
            animate={{ textShadow: ["0 0 10px rgba(0,243,255,0.2)", "0 0 20px rgba(0,243,255,0.4)", "0 0 10px rgba(0,243,255,0.2)"] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="font-mono text-xl md:text-2xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#a78bfa] to-[#ff007f] filter drop-shadow-[0_0_12px_rgba(0,243,255,0.25)]"
          >
            ZENITH GLITCH
          </motion.h1>
          <p className="mt-1 text-[9px] font-mono tracking-[0.3em] text-slate-500 uppercase">
            GEODETIC COORDINATE TRACKING SYSTEM
          </p>
        </div>

        {/* Right: Observer lock */}
        <div className="font-mono text-[11px] tracking-[0.15em] text-[#a78bfa]/70 md:w-1/3 text-center md:text-right">
          <span>Observer Locked: [ {activeLocation.lat.toFixed(4)}, {activeLocation.lng.toFixed(4)} ]</span>
        </div>
      </header>

      {/* Main Container Overlay with Framer Motion */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl px-6 flex-1 flex flex-col items-center justify-center relative z-10 gap-6 mt-4"
      >

        {/* Phase Interfaces container */}
        <AnimatePresence mode="wait">
          {bootPhase === "intro" && (
            <motion.div 
              key="intro-phase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Clickable Map / Globe Selector (col-span-8) */}
              <div className="lg:col-span-8 bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#101b33] pb-3">
                  <h2 className="text-[#00f3ff] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Cybernetic Targeting Grid
                  </h2>
                  
                  {/* Hover position readout */}
                  {mapHoverCoords && (
                    <div className="font-mono text-[9px] text-slate-500">
                      SYS_LOCK: [ {mapHoverCoords.lat.toFixed(2)}°, {mapHoverCoords.lng.toFixed(2)}° ]
                    </div>
                  )}
                </div>

                {/* Clickable World Map Container */}
                <div 
                  ref={mapRef}
                  className="relative aspect-[2/1] w-full bg-[#020612] z-10 map-container-cyber"
                  style={{ minHeight: "260px" }}
                >
                  {/* Cybernetic map grid lines overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.04)_1px,transparent_1px)] bg-[size:10%_20%] pointer-events-none z-[400]" />
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-center">
                  💡 Zoom, drag, and click anywhere on the target array above to align geodetic tracking coordinates
                </div>
              </div>

              {/* Geocoding search & preset settings (col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
                
                {/* Geocode query resolver box */}
                <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-[#00f3ff] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-4 h-4" /> Address query resolver
                  </h3>

                  {/* Search query form */}
                  <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, preset, or lat, lng..."
                        className="w-full py-2.5 pl-3 pr-9 rounded-lg bg-[#050b18] border border-slate-800 focus:border-[#00f3ff] text-xs font-sans text-white outline-none transition-all placeholder-slate-600 focus:ring-0"
                      />
                      <button type="submit" className="absolute right-3 p-1 text-slate-500 hover:text-[#00f3ff] cursor-pointer">
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Search feedbacks */}
                  {searchFeedback && (
                    <div className={`flex items-start gap-2 font-mono text-[9.5px] border p-2.5 rounded-lg leading-relaxed ${
                      searchFeedback.error
                        ? "border-rose-500/10 bg-rose-500/5 text-rose-500"
                        : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
                    }`}>
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{searchFeedback.text}</span>
                    </div>
                  )}

                  {/* Quick Preset array selectors */}
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Spaceport presets</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        onClick={() => handlePresetSelect(locationPresets[0])}
                        className={`py-1.5 px-2 rounded font-sans text-[9px] text-left border ${
                          activeLocation.label === "Kennedy Space Center"
                            ? "bg-[#0b1b36] border-[#00f3ff] text-[#00f3ff]"
                            : "bg-[#050b18] border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        }`}
                      >
                        🇺🇸 KENNEDY
                      </button>
                      <button 
                        onClick={() => handlePresetSelect(locationPresets[1])}
                        className={`py-1.5 px-2 rounded font-sans text-[9px] text-left border ${
                          activeLocation.label === "Starbase, Boca Chica"
                            ? "bg-[#0b1b36] border-[#00f3ff] text-[#00f3ff]"
                            : "bg-[#050b18] border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        }`}
                      >
                        🇺🇸 STARBASE
                      </button>
                      <button 
                        onClick={() => handlePresetSelect(locationPresets[2])}
                        className={`py-1.5 px-2 rounded font-sans text-[9px] text-left border ${
                          activeLocation.label === "Baikonur Cosmodrome"
                            ? "bg-[#0b1b36] border-[#00f3ff] text-[#00f3ff]"
                            : "bg-[#050b18] border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        }`}
                      >
                        🇰🇿 BAIKONUR
                      </button>
                      <button 
                        onClick={() => handlePresetSelect(locationPresets[3])}
                        className={`py-1.5 px-2 rounded font-sans text-[9px] text-left border ${
                          activeLocation.label === "Guiana Space Centre"
                            ? "bg-[#0b1b36] border-[#00f3ff] text-[#00f3ff]"
                            : "bg-[#050b18] border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        }`}
                      >
                        🇫🇷 GUIANA
                      </button>
                    </div>
                  </div>
                </div>

                {/* GPS trigger calibration */}
                <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-3">
                  <button
                    onClick={handleGPSDetect}
                    disabled={gpsLoading}
                    className="w-full py-3 px-4 font-sans text-xs font-bold tracking-widest rounded-lg bg-gradient-to-r from-[#0d2242] to-[#0a1830] hover:from-[#132c54] hover:to-[#0f2445] border border-[#00f3ff]/20 hover:border-[#00f3ff]/50 text-[#00f3ff] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                    AUTO-DETECT GEOLOCATION
                  </button>
                  {gpsError && (
                    <span className="text-[9px] text-rose-500 font-mono text-center">{gpsError}</span>
                  )}
                  <button
                    onClick={handleStartCalibration}
                    className="w-full py-3.5 px-4 font-sans text-xs font-bold tracking-[0.2em] rounded-lg bg-[#00f3ff] text-[#020206] shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    LOCK OBSERVER COORDINATES
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {bootPhase === "diagnostics" && (
            <motion.div 
              key="diagnostics-phase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md bg-[#030816] border border-[#101b33] rounded-xl p-6 font-mono text-xs text-left shadow-[0_0_40px_rgba(124,58,237,0.03)]"
            >
              <h2 className="text-[#a78bfa] mb-4 border-b border-[#101b33] pb-2 tracking-wider flex justify-between items-center">
                <span>SYS_DIAGNOSTIC_CALIBRATION</span>
                <span className="animate-pulse">ACTIVE...</span>
              </h2>
              <div className="space-y-3 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                {diagnosticMessages.slice(0, diagStep).map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[#00f3ff]/90">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5 animate-pulse" />
                    <span>{msg}</span>
                  </div>
                ))}
                {diagStep < diagnosticMessages.length && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-1.5 h-3 bg-[#a78bfa] animate-pulse" />
                    <span>{diagnosticMessages[diagStep]}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {bootPhase === "completed" && (
            <motion.div 
              key="completed-phase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm bg-[#030816] border border-[#101b33] rounded-xl p-6 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(255,0,127,0.03)]"
            >
              <h2 className="font-mono text-sm tracking-[0.15em] text-[#ff007f] uppercase border-b border-[#101b33] pb-2.5 w-full text-center">
                CALIBRATION COMPLETION
              </h2>
              <div className="text-center font-sans text-xs text-slate-400">
                Observer deck locked on coordinate target:
                <div className="text-[#00f3ff] mt-2.5 font-mono font-bold text-sm">
                  {activeLocation.lat}° N // {activeLocation.lng}° E
                </div>
                <div className="text-emerald-400 mt-1 uppercase text-[10px] tracking-widest font-mono font-bold">
                  {activeLocation.flag} {activeLocation.label}
                </div>
              </div>

              <button
                onClick={handleRevealMainDeck}
                className="w-full py-4 px-6 font-sans text-xs font-bold tracking-[0.25em] rounded-lg bg-gradient-to-r from-[#ff007f] to-[#a78bfa] text-white shadow-[0_0_25px_rgba(255,0,127,0.3)] hover:shadow-[0_0_35px_rgba(255,0,127,0.5)] active:scale-[0.98] transition-all cursor-pointer uppercase"
              >
                INITIALIZE COMMAND DECK
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
      
      {/* Footer metadata details */}
      <div className="absolute bottom-6 font-mono text-[9px] tracking-widest text-slate-700">
        GEODETIC CALIBRATION GRID LOCK // AZ/EL INTERCEPT ENGINE v4.8
      </div>
    </div>
  );
};
