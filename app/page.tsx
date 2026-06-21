"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSpaceTracker } from "./components/SpaceTrackerContext";
import { BootSequence } from "./components/BootSequence";
import { LocationPicker } from "./components/LocationPicker";
import { SkyChart } from "./components/SkyChart";
import { ISSTracker } from "./components/ISSTracker";
import { PlanetTracker } from "./components/PlanetTracker";
import { 
  Play, 
  Pause, 
  Grid, 
  Tv, 
  Activity, 
  Compass, 
  Clock, 
  ChevronRight 
} from "lucide-react";

export default function Home() {
  const [booted, setBooted] = useState<boolean>(false);
  const {
    activeLocation,
    selectedObjectId,
    setSelectedObjectId,
    simulationSpeed,
    setSimulationSpeed,
    simulationTime,
    crtEnabled,
    setCrtEnabled,
    hudGridEnabled,
    setHudGridEnabled,
    trackingActive,
    setTrackingActive,
    trackedObjects,
    positions,
  } = useSpaceTracker();

  // Lazy initializer to seed initial logs cleanly
  const [logs, setLogs] = useState<string[]>(() => [
    `[00:00:00] Geodetic star tracker aligned: index 0.9994`,
    `[00:00:00] Comm lock acquired on default satellite transponders`,
    `[00:00:00] Space tracker dashboard systems online`,
  ]);

  // Keep a reference to the latest state to avoid restarting the interval
  const stateRef = useRef({ selectedObjectId, activeLocation, positions, trackedObjects, simulationTime });
  
  useEffect(() => {
    stateRef.current = { selectedObjectId, activeLocation, positions, trackedObjects, simulationTime };
  }, [selectedObjectId, activeLocation, positions, trackedObjects, simulationTime]);

  // Simulation clock formatted string
  const formatTime = (ts: number) => {
    return new Date(ts).toISOString().replace("T", " ").substring(0, 19) + " UTC";
  };

  // Add automated logs to the status log ticker
  useEffect(() => {
    if (!booted) return;

    const interval = setInterval(() => {
      const { selectedObjectId: id, activeLocation: loc, positions: posMap, trackedObjects: objs, simulationTime: time } = stateRef.current;
      const activeObj = objs.find((o) => o.id === id);
      const pos = posMap[id];
      const timeStr = new Date(time).toISOString().substring(11, 19);
      
      const logTemplates = [
        `Telemetry frame rx: Azimuth ${pos?.azimuth.toFixed(2)}° // Elevation ${pos?.elevation.toFixed(2)}°`,
        `Sidereal clock tick aligned with longitude ${loc.lng.toFixed(2)}°`,
        `Solar tracker efficiency calibrated: 94.8%`,
        `Interpreting geodetic slant range: ${Math.round(pos?.range || 0).toLocaleString()} km`,
        `LST offset drift recalculation complete`,
        `Active target locked on: ${activeObj?.name.toUpperCase()}`,
        `Calibration envelope stable on ${loc.label.split(",")[0]} array`,
      ];

      const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setLogs((prev) => [`[${timeStr}] ${randomLog}`, ...prev.slice(0, 14)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [booted]);

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div className={`flex flex-col flex-1 min-h-screen ${crtEnabled ? "crt-screen" : ""} space-grid select-none`}>
      {/* Header Deck */}
      <header className="border-b border-[#7c3aed]/15 bg-[#020206]/85 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        
        {/* Title and active status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-ping" />
            <h1 className="font-mono text-lg font-black tracking-[0.2em] text-white">
              ZENITH <span className="text-[#00f3ff]">GLITCH</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4 font-mono text-[9px] text-[#ededed]/50">
            <span>ACTIVE ARRAY:</span>
            <span className="text-[#7c3aed] font-semibold uppercase">{activeLocation.label.split(",")[0]}</span>
          </div>
        </div>

        {/* Global Control Center */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Time warp control */}
          <div className="flex items-center bg-[#0b0b14] border border-white/5 rounded-lg p-1 gap-1">
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#ededed]/40 px-2">Time-Warp:</span>
            {[1, 10, 60, 600].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`py-1 px-2.5 rounded text-[10px] font-mono font-bold transition-all duration-300 cursor-pointer ${
                  simulationSpeed === speed
                    ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30"
                    : "text-[#ededed]/60 hover:text-white border border-transparent"
                }`}
              >
                {speed === 1 ? "REAL" : `${speed}x`}
              </button>
            ))}
          </div>

          {/* Pause / Play clock */}
          <button
            onClick={() => setTrackingActive(!trackingActive)}
            className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
              trackingActive
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10"
            }`}
            title={trackingActive ? "Pause clock" : "Resume clock"}
          >
            {trackingActive ? <Play className="w-3.5 h-3.5 fill-emerald-400" /> : <Pause className="w-3.5 h-3.5 fill-amber-400" />}
          </button>

          {/* HUD Grid Overlay Toggle */}
          <button
            onClick={() => setHudGridEnabled(!hudGridEnabled)}
            className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
              hudGridEnabled
                ? "border-[#7c3aed]/30 bg-[#7c3aed]/5 text-[#7c3aed] hover:bg-[#7c3aed]/10"
                : "border-white/5 text-[#ededed]/50 hover:text-white"
            }`}
            title="Toggle Grid Overlay"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* CRT Screen Toggle */}
          <button
            onClick={() => setCrtEnabled(!crtEnabled)}
            className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
              crtEnabled
                ? "border-[#ff007f]/30 bg-[#ff007f]/5 text-[#ff007f] hover:bg-[#ff007f]/10"
                : "border-white/5 text-[#ededed]/50 hover:text-white"
            }`}
            title="Toggle CRT Screen Scanlines"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Calibration Clock Readout */}
          <div className="bg-[#0b0b14] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2 text-right">
            <Clock className="w-3.5 h-3.5 text-[#00f3ff] animate-pulse" />
            <span className="font-mono text-xs font-semibold tracking-wider text-white">
              {formatTime(simulationTime)}
            </span>
          </div>

        </div>
      </header>

      {/* Command Deck Grid Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-7xl mx-auto w-full">
        
        {/* Left Panel: Location Calibration (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <LocationPicker />
          
          {/* Geodetic Details card */}
          <div className="glass-panel border border-white/5 rounded-xl p-5 flex flex-col gap-3 font-mono">
            <h3 className="text-xs font-bold text-[#7c3aed] uppercase border-b border-[#7c3aed]/10 pb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Observation Node Diagnostics
            </h3>
            <div className="text-[10px] space-y-2 text-[#ededed]/70">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Calibration Status:</span>
                <span className="text-emerald-400 font-bold">OPERATIONAL</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Declination Lock:</span>
                <span>±{Math.abs(90 - activeLocation.lat).toFixed(2)}° Horizon</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>LST Sidereal Drift:</span>
                <span>{((simulationTime / 3600000) % 24).toFixed(4)} hr</span>
              </div>
              <div className="flex justify-between">
                <span>Tracking Channels:</span>
                <span className="text-[#00f3ff]">6 Channels Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Panel: Celestial Sky Dome tracker (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-grow">
            <SkyChart />
          </div>
          
          {/* Quick Target Locks list */}
          <div className="glass-panel border border-white/5 rounded-xl p-4 flex flex-col gap-2 font-mono">
            <span className="text-[8px] uppercase tracking-wider text-[#ededed]/40">Interactive Target locks list</span>
            <div className="flex flex-wrap gap-1.5">
              {trackedObjects.map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                const isAbove = positions[obj.id]?.elevation > 0;
                
                let chipColor = "bg-[#0b0b14] border-white/5 text-[#ededed]/60";
                if (isSelected) {
                  chipColor = "bg-[#7c3aed]/15 border-[#7c3aed] text-white font-semibold";
                } else if (isAbove) {
                  chipColor = "border-emerald-500/20 text-emerald-400";
                }

                return (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`py-1.5 px-2.5 rounded text-[9px] border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${chipColor}`}
                  >
                    <span>{obj.name}</span>
                    <ChevronRight className="w-2.5 h-2.5 opacity-40" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Panel: Dynamic detailed parameters card (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Render both, with active one highlighted or side-by-side inside tabs, or adapt stack */}
          <div className="flex-1">
            <ISSTracker />
          </div>
          <div className="flex-1">
            <PlanetTracker />
          </div>
        </section>
      </main>

      {/* Scrolling Diagnostic logs ticker */}
      <footer className="border-t border-[#7c3aed]/15 bg-[#020206]/90 py-3.5 px-6 font-mono text-[9px] tracking-wider flex items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="w-3.5 h-3.5 text-[#ff007f] animate-pulse" />
          <span className="text-[#ff007f] font-semibold">DIAGNOSTIC TELEMETRY TICKER:</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="absolute inset-0 flex items-center">
            {logs.length > 0 ? (
              <span className="text-[#00f3ff] animate-[pulse_2s_infinite] truncate block">
                {logs[0]}
              </span>
            ) : (
              <span className="text-[#ededed]/40">Scanning for signal channels...</span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#ededed]/30 text-right shrink-0">
          <span>MEM_BUFFER: 100% OK</span>
          <span>CALIBRATION: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
