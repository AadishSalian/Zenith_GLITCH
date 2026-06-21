"use client";

import React, { useState, useEffect } from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Radio, Users, Cpu, Sun, Clock, Zap, Target, TrendingUp } from "lucide-react";

export const ISSTracker: React.FC = () => {
  const {
    activeLocation,
    selectedObjectId,
    trackedObjects,
    positions,
    issPasses,
    simulationTime,
  } = useSpaceTracker();

  // Active object selection
  const activeObj = trackedObjects.find((o) => o.id === selectedObjectId);
  const position = positions[selectedObjectId];
  
  const [solarPanelAngle, setSolarPanelAngle] = useState<number>(0);
  const [commsFlicker, setCommsFlicker] = useState<boolean>(false);

  // Animate solar panel tracker
  useEffect(() => {
    const timer = setInterval(() => {
      setSolarPanelAngle((prev) => (prev + 0.5) % 360);
      setCommsFlicker((prev) => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeObj || !position) return null;

  // Render placeholders if planet is selected (we have a separate PlanetTracker for details, but we can display a summary here or adapt)
  const isSatellite = activeObj.type === "satellite";
  
  // Simulated crew logs
  const crewMembers = [
    "Cmdr. Oleg Kononenko (Roscosmos)",
    "Nikolai Chub (Roscosmos)",
    "Tracy Caldwell Dyson (NASA)",
    "Matthew Dominick (NASA)",
    "Michael Barratt (NASA)",
    "Jeanette Epps (NASA)",
    "Alexander Grebenkin (Roscosmos)",
  ];

  // Next pass computation details
  const nextPass = issPasses[0];
  const timeToPass = nextPass ? nextPass.start - simulationTime : 0;
  const isPassActive = position.isAboveHorizon;

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "TRANSIT ACTIVE";
    const sec = Math.floor((ms / 1000) % 60);
    const min = Math.floor((ms / (1000 * 60)) % 60);
    const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return `${hrs.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-panel glow-border-cyan rounded-xl p-5 flex flex-col gap-5 h-full">
      {/* Component Title */}
      <div className="flex items-center justify-between border-b border-[#00f3ff]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-[#00f3ff]" />
          <h2 className="font-mono text-sm font-semibold tracking-wider text-[#00f3ff] uppercase">
            {isSatellite ? "Satellite Telemetry Array" : "Astral Target Telemetry"}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#00f3ff]/80">
          <span>SOURCE:</span>
          <span className="font-bold text-white uppercase">{activeObj.name}</span>
        </div>
      </div>

      {isSatellite ? (
        <div className="flex flex-col gap-5 flex-1">
          {/* Coordinates and Speed Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
              <span className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 flex items-center gap-1">
                <Target className="w-3 h-3 text-[#7c3aed]" /> Coordinates
              </span>
              <div className="font-mono text-xs text-white mt-1.5 space-y-1">
                <div>LAT: <span className="text-[#00f3ff] font-bold">{position.lat?.toFixed(4)}°</span></div>
                <div>LNG: <span className="text-[#00f3ff] font-bold">{position.lng?.toFixed(4)}°</span></div>
              </div>
            </div>

            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
              <span className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#ff007f]" /> Orbit Stats
              </span>
              <div className="font-mono text-xs text-white mt-1.5 space-y-1">
                <div>ALT: <span className="text-[#ff007f] font-bold">{activeObj.altitude} km</span></div>
                <div>VEL: <span className="text-white font-bold">{activeObj.velocity?.toLocaleString()} km/h</span></div>
              </div>
            </div>
          </div>

          {/* Elevation and Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 mb-2">Topocentric Vectors</div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span>Elevation:</span>
                  <span className={position.isAboveHorizon ? "text-emerald-400 font-bold" : "text-[#ededed]/80"}>
                    {position.elevation.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Azimuth:</span>
                  <span className="text-[#ededed]">{position.azimuth.toFixed(0)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Slant Range:</span>
                  <span className="text-[#ededed]">{Math.round(position.range).toLocaleString()} km</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3 flex flex-col justify-between">
              <span className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" /> Solar Arrays
              </span>
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="font-mono text-xs font-bold text-amber-400">
                  {Math.round(90 + Math.sin(solarPanelAngle * Math.PI / 180) * 8)}% Align
                </div>
                {/* Rotating solar panel visual representation */}
                <div className="w-10 h-6 border border-white/10 rounded flex items-center justify-center relative bg-black/40 overflow-hidden">
                  <div 
                    style={{ transform: `rotate(${solarPanelAngle}deg)` }} 
                    className="w-8 h-1 bg-amber-400 rounded transition-transform duration-1000 ease-linear shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pass Prediction Countdown */}
          <div className="bg-[#05050d]/80 border border-[#00f3ff]/20 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
              <span className="flex items-center gap-1 text-[#00f3ff]">
                <Clock className="w-3 h-3" /> Next Horizon Flyover
              </span>
              <span className={isPassActive ? "text-emerald-400 font-bold animate-pulse" : "text-[#ededed]/50"}>
                {isPassActive ? "TRANSIT IN PROGRESS" : "LOCKED ON APOGEE"}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-xl md:text-2xl font-black tracking-widest text-[#ededed]">
                {formatCountdown(timeToPass)}
              </span>
              <span className="font-mono text-[10px] text-[#ededed]/60">
                Peak: <strong className="text-white">{nextPass?.maxEl}° EL</strong>
              </span>
            </div>

            {/* Pass path visualization graph */}
            <div className="relative h-12 border border-white/5 rounded bg-black/40 mt-1.5 flex flex-col justify-end p-1.5 overflow-hidden">
              <div className="absolute top-1 left-2 font-mono text-[7px] text-[#ededed]/40 uppercase tracking-widest">Horizon transit path profile</div>
              {/* Plot path arc */}
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                {/* Horizon line */}
                <line x1="0" y1="18" x2="100" y2="18" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                {/* Arc path */}
                <path
                  d="M 5 18 Q 50 2 95 18"
                  fill="none"
                  stroke={isPassActive ? "rgba(0, 243, 255, 0.4)" : "rgba(124, 58, 237, 0.2)"}
                  strokeWidth="1"
                  strokeDasharray={isPassActive ? "" : "2,2"}
                />
                {/* Blip dot on arc */}
                {isPassActive ? (
                  <circle cx="50" cy="10" r="1.5" fill="#00f3ff" className="animate-ping" />
                ) : null}
              </svg>
            </div>
          </div>

          {/* Expedition Details (ISS Specific) or Instrument Specs (Hubble Specific) */}
          <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3 flex-1 flex flex-col gap-2 min-h-[110px]">
            <div className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 flex items-center gap-1">
              {activeObj.id === "iss" ? (
                <>
                  <Users className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Expedition Crew Index (Active)</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Scientific Instruments Status</span>
                </>
              )}
            </div>

            {activeObj.id === "iss" ? (
              <div className="overflow-y-auto max-h-[85px] pr-1 flex-1">
                <ul className="text-[10px] font-mono text-[#ededed]/80 space-y-1">
                  {crewMembers.map((member, idx) => (
                    <li key={idx} className="flex justify-between border-b border-white/5 pb-0.5 last:border-b-0">
                      <span className="truncate pr-1">{member.split(" (")[0]}</span>
                      <span className="text-[#00f3ff]/60 text-[9px] font-semibold">{member.split(" (")[1]?.replace(")", "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-[#ededed]/80 space-y-1.5">
                <div className="flex justify-between">
                  <span>Wide Field Camera 3 (WFC3):</span>
                  <span className="text-emerald-400 font-semibold">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>Cosmic Origins Spec. (COS):</span>
                  <span className="text-emerald-400 font-semibold">STANDBY</span>
                </div>
                <div className="flex justify-between">
                  <span>Solid State Data Recorder:</span>
                  <span className="text-[#00f3ff] font-semibold">94.8% BUFF</span>
                </div>
                <div className="flex justify-between text-[9px] text-[#ededed]/40 uppercase mt-1">
                  <span>Aperture: 2.4 meters</span>
                  <span>Orbit Period: 95.4m</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fallback if user selects a Planet while this component is rendered */
        <div className="flex flex-col items-center justify-center text-center p-8 flex-1 border border-dashed border-white/5 rounded-lg bg-[#0b0b14]/20">
          <Radio className="w-8 h-8 text-[#7c3aed] mb-3 animate-pulse" />
          <div className="font-mono text-xs font-semibold text-[#ededed] uppercase">Satellite Link Inactive</div>
          <div className="text-[10px] text-[#ededed]/50 font-mono mt-1 max-w-[200px]">
            Target is classified as an astronomical planet body. Refer to the Planet Telemetry Deck.
          </div>
        </div>
      )}
    </div>
  );
};
