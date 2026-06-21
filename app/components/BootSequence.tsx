"use client";

import React, { useState, useEffect } from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Radar, ShieldAlert, Check, Crosshair, Navigation, Globe, Cpu } from "lucide-react";

interface BootSequenceProps {
  onComplete: () => void;
}

const diagnosticMessages = [
  "Establishing connection to orbital array...",
  "Syncing Local Sidereal Clock with observation point...",
  "Calibrating celestial dome projection limits...",
  "Caching planetary orbital vectors (Mars, Venus, Jupiter, Saturn)...",
  "Interpolating satellite orbits (ISS inclination 51.64°)...",
  "Synchronizing telemetry deck graphics and HUD overlays...",
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const { activeLocation, setActiveLocation, locationPresets } = useSpaceTracker();
  const [bootPhase, setBootPhase] = useState<"intro" | "diagnostics" | "completed">("intro");
  const [diagStep, setDiagStep] = useState<number>(0);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Geolocation trigger
  const handleGPSDetect = () => {
    setGpsLoading(true);
    setGpsError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setActiveLocation({
            lat: parseFloat(position.coords.latitude.toFixed(4)),
            lng: parseFloat(position.coords.longitude.toFixed(4)),
            label: "User Geolocation (GPS Sync)",
          });
          setGpsLoading(false);
          startDiagnostics();
        },
        (error) => {
          let msg = "Sensor access denied. Falling back to default preset.";
          if (error.code === error.POSITION_UNAVAILABLE) msg = "Location unavailable. Using preset.";
          if (error.code === error.TIMEOUT) msg = "GPS calibration timed out. Using preset.";
          setGpsError(msg);
          setGpsLoading(false);
          // Wait briefly then fallback
          setTimeout(() => {
            setActiveLocation(locationPresets[0]); // fallback to Kennedy Space Center
            startDiagnostics();
          }, 1500);
        },
        { timeout: 10000 }
      );
    } else {
      setGpsError("GPS sensor not supported by browser. Using preset.");
      setGpsLoading(false);
      setTimeout(() => {
        setActiveLocation(locationPresets[0]);
        startDiagnostics();
      }, 1500);
    }
  };

  const handleUsePreset = () => {
    setActiveLocation(locationPresets[0]); // Kennedy Space Center
    startDiagnostics();
  };

  const startDiagnostics = () => {
    setBootPhase("diagnostics");
  };

  // Run diagnostics log typing effect
  useEffect(() => {
    if (bootPhase !== "diagnostics") return;

    if (diagStep < diagnosticMessages.length) {
      const timer = setTimeout(() => {
        setDiagStep((prev) => prev + 1);
      }, 800 + Math.random() * 500);
      return () => clearTimeout(timer);
    } else {
      // Completed, prompt main deck load
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

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020206] space-grid overflow-hidden transition-all duration-1000 ${
        glitchActive ? "scale-105 opacity-0 brightness-150 filter saturate-200" : ""
      }`}
    >
      {/* Scanline grid effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020206] via-transparent to-[#020206] pointer-events-none" />
      <div className="absolute inset-x-0 h-1 bg-[#00f3ff]/10 blur-[1px] scanline-scanner pointer-events-none" />

      {/* Cybernetic HUD elements */}
      <div className="absolute top-8 left-8 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-[#00f3ff]/60">
        <Cpu className="w-4 h-4 animate-pulse" />
        <span>SYS.LOCK // ZENITH.GLITCH_v4.8</span>
      </div>

      <div className="absolute top-8 right-8 font-mono text-xs tracking-[0.2em] text-[#7c3aed]/60">
        <span>GRID_COORD // [ {activeLocation.lat.toFixed(4)}, {activeLocation.lng.toFixed(4)} ]</span>
      </div>

      {/* Main content deck */}
      <div className="w-full max-w-lg px-6 flex flex-col items-center relative z-10">
        
        {/* Glowing Radar Calibrator */}
        <div className="relative mb-12 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border border-[#00f3ff]/20 flex items-center justify-center animate-[spin_20s_linear_infinite]" />
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-[#7c3aed]/40 flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]" />
          <div className="absolute w-20 h-20 rounded-full border border-[#ff007f]/20 flex items-center justify-center animate-pulse" />
          <div className="absolute flex items-center justify-center">
            {bootPhase === "intro" ? (
              <Globe className="w-8 h-8 text-[#00f3ff] animate-pulse" />
            ) : bootPhase === "diagnostics" ? (
              <Radar className="w-8 h-8 text-[#7c3aed] animate-spin" />
            ) : (
              <Crosshair className="w-8 h-8 text-[#ff007f] animate-[spin_4s_linear_infinite]" />
            )}
          </div>
        </div>

        {/* Dynamic Titles */}
        <div className="text-center mb-8">
          <h1 className="font-mono text-4xl md:text-5xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#7c3aed] to-[#ff007f] drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
            ZENITH GLITCH
          </h1>
          <p className="mt-2 text-xs md:text-sm font-mono tracking-[0.4em] text-[#00f3ff]/70 uppercase">
            Orbital Telemetry & Sky Tracker
          </p>
        </div>

        {/* Phase Interfaces */}
        {bootPhase === "intro" && (
          <div className="w-full glass-panel glow-border-cyan rounded-xl p-6 flex flex-col items-center text-center gap-6 animate-fade-in">
            <h2 className="font-mono text-sm tracking-[0.15em] text-[#ededed] uppercase border-b border-[#00f3ff]/20 pb-2 w-full">
              Observer Location Sensor Sync
            </h2>
            <p className="text-xs text-[#ededed]/70 leading-relaxed font-sans max-w-sm">
              In order to map the ISS and planets correctly overhead, the system requires observer coordinates. Align via GPS sensor or launch with the default Spaceport array.
            </p>

            {gpsError && (
              <div className="flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs px-3 py-2 rounded-lg font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleGPSDetect}
                disabled={gpsLoading}
                className="flex-1 py-3 px-4 font-mono text-xs font-semibold tracking-wider rounded-lg bg-[#00f3ff] text-[#020206] shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] hover:bg-[#00e0eb] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? "animate-bounce" : ""}`} />
                {gpsLoading ? "SYNCING GPS SENSORS..." : "AUTO-CALIBRATE GPS"}
              </button>
              
              <button
                onClick={handleUsePreset}
                className="flex-1 py-3 px-4 font-mono text-xs font-semibold tracking-wider rounded-lg border border-[#7c3aed]/40 hover:border-[#7c3aed] hover:bg-[#7c3aed]/10 text-[#ededed] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                USE PRESET ARRAY
              </button>
            </div>
          </div>
        )}

        {bootPhase === "diagnostics" && (
          <div className="w-full glass-panel glow-border-purple rounded-xl p-6 font-mono text-xs text-left animate-fade-in">
            <h2 className="text-[#7c3aed] mb-4 border-b border-[#7c3aed]/20 pb-2 tracking-wider flex justify-between items-center">
              <span>CALIBRATING ORBITAL SYSTEM</span>
              <span className="animate-pulse">RUNNING...</span>
            </h2>
            <div className="space-y-3 min-h-[140px] max-h-[200px] overflow-y-auto pr-2">
              {diagnosticMessages.slice(0, diagStep).map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[#00f3ff]/90">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{msg}</span>
                </div>
              ))}
              {diagStep < diagnosticMessages.length && (
                <div className="flex items-center gap-2 text-[#ededed]/50">
                  <span className="w-1.5 h-3 bg-[#7c3aed] animate-pulse" />
                  <span>{diagnosticMessages[diagStep]}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {bootPhase === "completed" && (
          <div className="w-full glass-panel glow-border-pink rounded-xl p-6 flex flex-col items-center gap-6 animate-fade-in">
            <h2 className="font-mono text-sm tracking-[0.15em] text-[#ff007f] uppercase border-b border-[#ff007f]/20 pb-2 w-full text-center">
              CALIBRATION COMPLETE
            </h2>
            <div className="text-center font-mono text-xs text-[#ededed]/70">
              Observer node locked at:
              <div className="text-[#00f3ff] mt-2 font-semibold text-sm">
                LAT: {activeLocation.lat}° // LNG: {activeLocation.lng}°
              </div>
              <div className="text-emerald-400 mt-1 uppercase text-[10px] tracking-widest font-bold">
                {activeLocation.label}
              </div>
            </div>

            <button
              onClick={handleRevealMainDeck}
              className="w-full py-4 px-6 font-mono text-sm font-black tracking-[0.25em] rounded-lg bg-gradient-to-r from-[#ff007f] to-[#7c3aed] text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_35px_rgba(255,0,127,0.7)] active:scale-[0.98] transition-all cursor-pointer"
            >
              INITIALIZE DECK
            </button>
          </div>
        )}
      </div>
      
      {/* Decorative footer details */}
      <div className="absolute bottom-6 font-mono text-[9px] tracking-widest text-[#ededed]/20">
        GEODETIC COORDINATE TRACKER SYSTEM // AZ/EL PROJECTION ENGINE
      </div>
    </div>
  );
};
