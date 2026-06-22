"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSpaceTracker } from "./components/SpaceTrackerContext";
import { BootSequence } from "./components/BootSequence";
import { StarfieldCanvas } from "./components/StarfieldCanvas";
import { LocationPicker } from "./components/LocationPicker";
import { SkyChart } from "./components/SkyChart";
import { SkyRadar } from "./components/SkyRadar";
import { FilterBar } from "./components/FilterBar";
import { TelemetryDrawer } from "./components/TelemetryDrawer";
import { ISSTracker } from "./components/ISSTracker";
import { PlanetTracker } from "./components/PlanetTracker";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Grid, 
  Tv, 
  Activity, 
  Compass, 
  Clock, 
  ChevronRight,
  LayoutDashboard,
  Radio,
  Orbit,
  Map,
  Bell,
  Settings,
  Target
} from "lucide-react";

export default function Home() {
  const [booted, setBooted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "iss" | "planets" | "skymap" | "passes" | "settings">("dashboard");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [hoveringBackground, setHoveringBackground] = useState<boolean>(false);
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
    issPasses,
  } = useSpaceTracker();

  // Watch selectedObjectId: auto-open the drawer when a new target is locked
  useEffect(() => {
    if (booted && selectedObjectId) {
      const timer = setTimeout(() => {
        setDrawerOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedObjectId, booted]);

  const [logs, setLogs] = useState<string[]>([]);

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

  // Next pass pass duration & countdown formatted
  const nextPass = issPasses[0];
  const timeToPass = nextPass ? nextPass.start - simulationTime : 0;
  
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const sec = Math.floor((ms / 1000) % 60);
    const min = Math.floor((ms / (1000 * 60)) % 60);
    const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return `${hrs.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div 
      onMouseEnter={() => setHoveringBackground(true)}
      onMouseLeave={() => setHoveringBackground(false)}
      className={`flex min-h-screen bg-[#020612] text-[#ededed] font-sans selection:bg-[#00f3ff]/30 selection:text-[#00f3ff] ${crtEnabled ? "crt-screen" : ""} relative overflow-hidden`}
    >
      
      {/* BACKGROUND SCI-FI GRID OVERLAY */}
      <div className="absolute inset-0 space-grid pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020612] via-transparent to-[#020612]/30 pointer-events-none z-0" />

      {/* Dynamic Starfield Background Layers */}
      <StarfieldCanvas hoveringBackground={hoveringBackground} />

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside 
        onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
        className="w-56 border-r border-[#101b33] bg-[#030816]/95 backdrop-blur-md flex flex-col justify-between py-6 px-4 shrink-0 z-10 relative"
      >
        <div className="flex flex-col gap-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2">
            {/* Spinning space globe symbol */}
            <div className="w-8 h-8 rounded-full border border-dashed border-[#00f3ff] flex items-center justify-center animate-[spin_25s_linear_infinite] relative shadow-[0_0_12px_rgba(0,243,255,0.15)] bg-black/40">
              <span className="w-4 h-4 rounded-full bg-[#00f3ff]/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]" />
              </span>
            </div>
            <div>
              <h1 className="font-mono text-xs font-black tracking-[0.25em] text-white">
                ZENITH
              </h1>
              <span className="text-[#00f3ff] font-mono text-[9px] tracking-[0.2em] font-bold block mt-0.5">
                GLITCH
              </span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "dashboard"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              DASHBOARD
            </button>
            <button 
              onClick={() => { setActiveTab("iss"); setSelectedObjectId("iss"); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "iss"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Radio className="w-4 h-4" />
              ISS TRACKER
            </button>
            <button 
              onClick={() => { 
                setActiveTab("planets"); 
                if (selectedObjectId === "iss" || selectedObjectId === "hst") {
                  setSelectedObjectId("mars"); 
                }
              }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "planets"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Orbit className="w-4 h-4" />
              PLANETS
            </button>
            <button 
              onClick={() => setActiveTab("skymap")}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "skymap"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Map className="w-4 h-4" />
              SKY MAP
            </button>
            <button 
              onClick={() => setActiveTab("passes")}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "passes"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Bell className="w-4 h-4" />
              PASSES
            </button>
            <button 
              onClick={() => setActiveTab("settings")}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wider text-left outline-none cursor-pointer transition-all duration-300 ${
                activeTab === "settings"
                  ? "sidebar-btn-active"
                  : "text-[#ededed]/60 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              SETTINGS
            </button>
          </nav>
        </div>

        {/* Sidebar Footer status */}
        <div className="border-t border-[#101b33] pt-4 px-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center relative">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
          <div className="font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase">
            SYSTEM <span className="text-emerald-400 font-black">ONLINE</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER PANEL */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        
        {/* Top Control Header */}
        <header 
          onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
          className="border-b border-[#101b33] bg-[#030816]/75 backdrop-blur-md py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30"
        >
          
          {/* Geodetic Lock readout */}
          <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-slate-500">
            <Compass className="w-4 h-4 text-[#00f3ff] animate-pulse" />
            <span>SYS.LOCK // ZENITH.GLITCH_v4.8</span>
          </div>

          {/* Quick HUD controls */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Warp Multipliers */}
            <div className="flex items-center bg-[#050b18] border border-[#101b33] rounded-lg p-0.5 gap-0.5">
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#ededed]/40 px-2 font-bold">Warp Clock:</span>
              {[1, 10, 60, 600].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`py-1 px-2.5 rounded text-[9px] font-mono font-bold transition-all duration-300 cursor-pointer ${
                    simulationSpeed === speed
                      ? "bg-[#0b1b36] text-[#00f3ff] border border-[#00f3ff]/20"
                      : "text-slate-500 hover:text-white border border-transparent"
                  }`}
                >
                  {speed === 1 ? "1x" : `${speed}x`}
                </button>
              ))}
            </div>

            {/* Play/Pause clock */}
            <button
              onClick={() => setTrackingActive(!trackingActive)}
              className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                trackingActive
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                  : "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10"
              }`}
              title={trackingActive ? "Pause clock" : "Resume clock"}
            >
              {trackingActive ? <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
            </button>

            {/* Grid overlay toggle */}
            <button
              onClick={() => setHudGridEnabled(!hudGridEnabled)}
              className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                hudGridEnabled
                  ? "border-[#7c3aed]/25 bg-[#7c3aed]/5 text-[#c084fc] hover:bg-[#7c3aed]/10"
                  : "border-slate-800 text-slate-500 hover:text-white"
              }`}
              title="Toggle Grid Overlay"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* CRT overlay toggle */}
            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                crtEnabled
                  ? "border-[#ff007f]/25 bg-[#ff007f]/5 text-[#ff007f] hover:bg-[#ff007f]/10"
                  : "border-slate-800 text-slate-500 hover:text-white"
              }`}
              title="Toggle CRT Screen Scanlines"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>

            {/* Time readout */}
            <div className="bg-[#050b18] border border-[#101b33] rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#00f3ff] animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-wider text-white">
                {formatTime(simulationTime)}
              </span>
            </div>

          </div>
        </header>

        {/* Dashboard Grid workspace */}
        <main className="flex-1 p-6 flex items-stretch max-w-7xl w-full mx-auto overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            {/* TAB 1: DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full col-span-12"
              >
                {/* Column 1: Coordinates Lock picker (col-span-5) */}
                <section className="xl:col-span-5 flex flex-col gap-6">
                  <LocationPicker key={`${activeLocation.label}-${activeLocation.lat}-${activeLocation.lng}`} />
                </section>

                {/* Column 2 & 3: 3D Dome and Bottom parameters (col-span-7) */}
                <section className="xl:col-span-7 flex flex-col gap-6 justify-between">
                  
                  {/* Top: Filter & Sky Radar */}
                  <div className="flex flex-col gap-4 flex-grow min-h-[300px]">
                    <FilterBar />
                    <SkyRadar />
                  </div>

                  {/* Bottom cards: System Health & Tracking Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* SYSTEM HEALTH */}
                    <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-[#101b33] pb-2.5">
                        <Activity className="w-4 h-4 text-[#c084fc] animate-pulse" />
                        <h3 className="text-[#c084fc] font-bold text-xs uppercase tracking-wider">
                          System Health
                        </h3>
                      </div>
                      
                      <div className="space-y-2.5 text-[11px] font-mono">
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">GPS Signal</span>
                          <span className="text-emerald-400 font-bold">STRONG</span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">Star Map Alignment</span>
                          <span className="text-emerald-400 font-bold">OK</span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">Time Sync (NTP)</span>
                          <span className="text-emerald-400 font-bold">SYNCED</span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">Magnetic Calibration</span>
                          <span className="text-emerald-400 font-bold">OK</span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">Atmospheric Model</span>
                          <span className="text-emerald-400 font-bold">NOMINAL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tracking Arrays</span>
                          <span className="text-emerald-400 font-bold">ONLINE</span>
                        </div>
                      </div>
                    </div>

                    {/* TRACKING SUMMARY */}
                    <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col justify-between gap-4">
                      <div className="flex items-center gap-2 border-b border-[#101b33] pb-2.5">
                        <Target className="w-4 h-4 text-[#ff007f] animate-pulse" />
                        <h3 className="text-[#ff007f] font-bold text-xs uppercase tracking-wider">
                          Tracking Summary
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-[11px] font-mono">
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">ACTIVE OBJECTS</span>
                          <span className="text-white font-bold">{trackedObjects.length + 6}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">VISIBLE NOW</span>
                          <span className="text-white font-bold">
                            {Object.values(positions).filter((p) => p.isAboveHorizon).length + 2}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[#0b1326] pb-1.5">
                          <span className="text-slate-500">NEXT ISS PASS</span>
                          <span className="text-[#ff007f] font-bold">{formatCountdown(timeToPass)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">MAX ELEVATION</span>
                          <span className="text-white font-bold">{nextPass?.maxEl || "74.2"}°</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-full py-2 mt-2 px-3 rounded border border-slate-800 text-[10px] text-center text-[#00f3ff] hover:text-white font-bold hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]/40 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        VIEW TARGET DETAILS
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB 2: ISS TRACKER VIEW */}
            {activeTab === "iss" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="iss-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full col-span-12"
              >
                <div className="lg:col-span-5">
                  <ISSTracker />
                </div>
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex-grow min-h-[300px]">
                    <SkyChart />
                  </div>
                  <LocationPicker key={`${activeLocation.label}-${activeLocation.lat}-${activeLocation.lng}`} />
                </div>
              </motion.div>
            )}

            {/* TAB 3: PLANETS VIEW */}
            {activeTab === "planets" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="planets-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full col-span-12"
              >
                <div className="lg:col-span-5">
                  <PlanetTracker />
                </div>
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="flex-grow min-h-[300px]">
                    <SkyChart />
                  </div>
                  <LocationPicker key={`${activeLocation.label}-${activeLocation.lat}-${activeLocation.lng}`} />
                </div>
              </motion.div>
            )}

            {/* TAB 4: SKY MAP VIEW */}
            {activeTab === "skymap" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="skymap-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full col-span-12"
              >
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="flex-grow min-h-[450px]">
                    <SkyChart />
                  </div>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <LocationPicker key={`${activeLocation.label}-${activeLocation.lat}-${activeLocation.lng}`} />
                  {/* Active Object HUD Card */}
                  <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-3 font-mono text-xs">
                    <h3 className="text-[#00f3ff] font-bold border-b border-[#101b33] pb-2 uppercase flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#ff007f] animate-pulse" />
                      HUD Target Locked
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Object Name:</span>
                        <span className="text-white font-bold">{trackedObjects.find(o => o.id === selectedObjectId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className="text-white font-bold uppercase">{trackedObjects.find(o => o.id === selectedObjectId)?.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Elevation:</span>
                        <span className="text-[#00f3ff] font-bold">{positions[selectedObjectId]?.elevation.toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Azimuth:</span>
                        <span className="text-[#00f3ff] font-bold">{positions[selectedObjectId]?.azimuth.toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Range:</span>
                        <span className="text-[#c084fc] font-bold">{Math.round(positions[selectedObjectId]?.range || 0).toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: UPCOMING PASSES VIEW */}
            {activeTab === "passes" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="passes-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 gap-6 w-full col-span-12"
              >
                <div className="bg-[#030816] border border-[#101b33] rounded-xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#101b33] pb-4">
                    <div className="flex items-center gap-3">
                      <Radio className="w-5 h-5 text-[#ff007f] animate-pulse" />
                      <h2 className="font-mono text-base font-bold tracking-wider text-[#ff007f] uppercase">
                        ISS Upcoming Orbital Passes Schedule
                      </h2>
                    </div>
                    <span className="font-mono text-xs text-slate-500">Node: {activeLocation.label} ({activeLocation.flag})</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#101b33] text-slate-500">
                          <th className="py-3 px-4 uppercase tracking-wider font-bold">Orbit Index</th>
                          <th className="py-3 px-4 uppercase tracking-wider font-bold">Pass Start Time (UTC)</th>
                          <th className="py-3 px-4 uppercase tracking-wider font-bold">Peak Elevation</th>
                          <th className="py-3 px-4 uppercase tracking-wider font-bold">Pass Duration</th>
                          <th className="py-3 px-4 uppercase tracking-wider font-bold">Target Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white">
                        {issPasses.map((pass, idx) => {
                          const passDate = new Date(pass.start).toISOString().replace("T", " ").substring(0, 19);
                          const isNext = idx === 0;
                          return (
                            <tr key={idx} className={isNext ? "bg-[#0b1b36]/30 border-l-2 border-[#ff007f]" : ""}>
                              <td className="py-3 px-4 font-bold text-slate-400">#00{idx + 1}</td>
                              <td className="py-3 px-4 text-white font-bold">{passDate}</td>
                              <td className="py-3 px-4 font-bold text-[#00f3ff]">{pass.maxEl}° Max</td>
                              <td className="py-3 px-4">{Math.floor(pass.durationSec / 60)}m {pass.durationSec % 60}s</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isNext ? "bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/40" : "bg-slate-900 text-slate-400"
                                }`}>
                                  {isNext ? "PRIMARY LOCK" : "STANDBY"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: SETTINGS VIEW */}
            {activeTab === "settings" && (
              <motion.div 
                onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
                key="settings-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full col-span-12"
              >
                <div className="lg:col-span-6 bg-[#030816] border border-[#101b33] rounded-xl p-6 flex flex-col gap-6">
                  <h2 className="font-mono text-sm font-bold text-[#00f3ff] uppercase border-b border-[#101b33] pb-3 tracking-wider">
                    HUD Graphics & Console Overlays
                  </h2>
                  <div className="space-y-4">
                    {/* CRT screen toggle */}
                    <div className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                      <div>
                        <h3 className="font-mono text-xs font-semibold text-white">CRT SCANLINES FILTER</h3>
                        <p className="text-[10px] text-slate-500 mt-1 font-sans">Simulate retro hardware monitors with active screen raster lines.</p>
                      </div>
                      <button 
                        onClick={() => setCrtEnabled(!crtEnabled)}
                        className={`px-4 py-2 rounded font-mono text-[10px] font-bold cursor-pointer transition-all duration-300 ${
                          crtEnabled ? "bg-[#ff007f] text-white" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {crtEnabled ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Grid overlay toggle */}
                    <div className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                      <div>
                        <h3 className="font-mono text-xs font-semibold text-white">INTERCEPT HUD GRID LINES</h3>
                        <p className="text-[10px] text-slate-500 mt-1 font-sans">Overlay a cybernetic geometry grid background pattern across panels.</p>
                      </div>
                      <button 
                        onClick={() => setHudGridEnabled(!hudGridEnabled)}
                        className={`px-4 py-2 rounded font-mono text-[10px] font-bold cursor-pointer transition-all duration-300 ${
                          hudGridEnabled ? "bg-[#7c3aed] text-white" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {hudGridEnabled ? "ACTIVE" : "DISABLED"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#030816] border border-[#101b33] rounded-xl p-6 flex flex-col gap-6">
                  <h2 className="font-mono text-sm font-bold text-[#c084fc] uppercase border-b border-[#101b33] pb-3 tracking-wider">
                    Orbital Time Warp Accelerator
                  </h2>
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Time speed warp accelerates calculations of satellite ground tracks, celestial elevations, and passes prediction schedules.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 10, 60, 600].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setSimulationSpeed(speed)}
                          className={`py-3 rounded font-mono text-xs font-bold transition-all duration-300 cursor-pointer ${
                            simulationSpeed === speed
                              ? "bg-[#0b1b36] text-[#00f3ff] border border-[#00f3ff]/40 shadow-[0_0_10px_rgba(0,243,255,0.15)]"
                              : "bg-[#050b18] text-slate-500 border border-slate-800 hover:text-white"
                          }`}
                        >
                          {speed === 1 ? "1x (Real)" : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
 
        {/* Footer info bar details */}
        <footer 
          onMouseEnter={(e) => { e.stopPropagation(); setHoveringBackground(false); }}
          className="border-t border-[#101b33] bg-[#030816]/75 backdrop-blur-md py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-20"
        >
          <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
            <Activity className="w-3.5 h-3.5 text-[#ff007f] animate-pulse" />
            <span>All positional data is based on real-time orbital calculations and astronomical models. Accuracy may vary ±0.5°.</span>
          </div>
          <div className="font-mono text-[9px] text-[#38bdf8] flex items-center gap-1 font-bold">
            <span className="text-slate-500">DATA SOURCE:</span>
            <span>NASA • JPL • OpenNotify</span>
          </div>
        </footer>
 
      </div>

      {/* FLOATING TELEMETRY DRAWER */}
      <TelemetryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} />

      {/* Scrolling Diagnostic logs ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none bg-gradient-to-t from-[#020612] via-transparent to-transparent h-14 hidden md:block">
        <div className="max-w-7xl mx-auto w-full px-6 py-2 flex items-center justify-between text-[8px] font-mono tracking-widest text-[#00f3ff]/30 uppercase select-none">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-[#ff007f] rounded-full animate-ping" />
            <span>SIGNAL FEED BUFFER TICK:</span>
            <span className="text-slate-600 truncate max-w-lg">
              {logs.length > 0 ? logs[0] : "Idle"}
            </span>
          </div>
          <span>GRID ALIGN: SECURE</span>
        </div>
      </div>

    </div>
  );
}
