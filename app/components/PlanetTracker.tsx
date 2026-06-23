"use client";

import React from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Eye, ShieldAlert, Sparkles, Orbit, Compass } from "lucide-react";

export const PlanetTracker: React.FC = () => {
  const {
    selectedObjectId,
    setSelectedObjectId,
    trackedObjects,
    positions,
  } = useSpaceTracker();

  // Filter planets
  const planets = trackedObjects.filter((o) => o.type === "planet");
  const activeObj = trackedObjects.find((o) => o.id === selectedObjectId);
  const position = positions[selectedObjectId];

  const handlePlanetSelect = (id: string) => {
    setSelectedObjectId(id);
  };

  const getVisibilityScore = (elevation: number) => {
    if (elevation <= 0) return { label: "Horizon Blocked", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    if (elevation < 15) return { label: "Low Elevation (Poor)", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (elevation < 40) return { label: "Moderate Visibility", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" };
    return { label: "Excellent (Direct Lock)", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
  };

  // Render SVG planet symbols
  const renderPlanetSVG = (id: string) => {
    switch (id) {
      case "mars":
        return (
          <svg className="w-16 h-16 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" viewBox="0 0 40 40">
            {/* Mars Core */}
            <circle cx="20" cy="20" r="14" fill="#f97316" />
            {/* North Ice Cap */}
            <path d="M 12 10 Q 20 14 28 10 Q 20 6 12 10" fill="#fefefe" opacity="0.8" />
            {/* Desert craters/shading */}
            <circle cx="26" cy="24" r="2.5" fill="#ea580c" opacity="0.7" />
            <circle cx="15" cy="22" r="3.5" fill="#ea580c" opacity="0.6" />
            <circle cx="21" cy="16" r="2" fill="#ea580c" opacity="0.5" />
          </svg>
        );
      case "venus":
        return (
          <svg className="w-16 h-16 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" viewBox="0 0 40 40">
            {/* Venus Core */}
            <circle cx="20" cy="20" r="14" fill="#fbbf24" />
            {/* Thick dense gas clouds */}
            <path d="M 7 16 C 14 12, 26 22, 33 16 C 26 12, 14 20, 7 16 Z" fill="#d97706" opacity="0.4" />
            <path d="M 6 24 C 15 20, 25 30, 34 24 C 25 18, 15 26, 6 24 Z" fill="#d97706" opacity="0.3" />
          </svg>
        );
      case "jupiter":
        return (
          <svg className="w-16 h-16 filter drop-shadow-[0_0_8px_rgba(232,211,167,0.3)]" viewBox="0 0 40 40">
            {/* Jupiter Core */}
            <circle cx="20" cy="20" r="14" fill="#e8d3a7" />
            {/* Gas bands */}
            <rect x="6.5" y="11" width="27" height="2.5" rx="1" fill="#78350f" opacity="0.6" />
            <rect x="6" y="17" width="28" height="3" rx="1.5" fill="#b45309" opacity="0.5" />
            <rect x="6.5" y="24" width="27" height="2" rx="1" fill="#78350f" opacity="0.6" />
            {/* Great Red Spot */}
            <ellipse cx="26" cy="18.5" rx="3.5" ry="2" fill="#ea580c" />
          </svg>
        );
      case "saturn":
        return (
          <svg className="w-20 h-16 filter drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]" viewBox="0 0 50 40">
            {/* Saturn Rings Back */}
            <ellipse cx="25" cy="20" rx="21" ry="4" fill="none" stroke="#a78bfa" strokeWidth="2.5" opacity="0.5" transform="rotate(-15, 25, 20)" />
            {/* Saturn Core */}
            <circle cx="25" cy="20" r="10" fill="#c084fc" />
            {/* Saturn Rings Front */}
            <path d="M 4.5 20 A 21 4 0 0 0 45.5 20" fill="none" stroke="#c084fc" strokeWidth="2" opacity="0.9" transform="rotate(-15, 25, 20)" />
          </svg>
        );
      default:
        return null;
    }
  };

  const isPlanetSelected = activeObj && activeObj.type === "planet";

  return (
    <div className="glass-panel glow-border-pink rounded-xl p-5 flex flex-col gap-5 w-full shrink-0">
      {/* Component Title */}
      <div className="flex items-center justify-between border-b border-[#ff007f]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Eye className="w-5 h-5 text-[#ff007f]" />
          <h2 className="font-mono text-sm font-semibold tracking-wider text-[#ff007f] uppercase">
            Planetary Tracking Array
          </h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#ff007f]/80">
          <span>HUD INDX:</span>
          <span className="font-bold text-white uppercase">SOLAR_DECK</span>
        </div>
      </div>

      {/* Planet Buttons selector */}
      <div className="grid grid-cols-4 gap-2">
        {planets.map((p) => {
          const pPos = positions[p.id];
          const isSelected = p.id === selectedObjectId;
          const isAbove = pPos && pPos.elevation > 0;
          
          let btnBorder = "border-white/5";
          let btnText = "text-[#ededed]/70";
          if (isSelected) {
            btnBorder = "border-[#ff007f] bg-[#ff007f]/5";
            btnText = "text-[#ff007f] font-bold";
          } else if (isAbove) {
            btnBorder = "hover:border-[#7c3aed]/40";
            btnText = "text-white hover:text-white";
          }

          return (
            <button
              key={p.id}
              onClick={() => handlePlanetSelect(p.id)}
              className={`py-2.5 px-1.5 rounded-lg border font-mono text-[10px] text-center flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${btnBorder} ${btnText}`}
            >
              <span className="uppercase text-[9px] font-semibold">{p.name}</span>
              {/* Above/below horizon indicator indicator dots */}
              <span className={`w-1.5 h-1.5 rounded-full ${isAbove ? "bg-emerald-400 animate-pulse" : "bg-[#ededed]/20"}`} />
            </button>
          );
        })}
      </div>

      {isPlanetSelected && activeObj && position ? (
        <div className="flex flex-col gap-4 flex-1 justify-between">
          
          {/* Planet Icon & Basic stats */}
          <div className="flex items-center gap-4 bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3.5">
            <div className="shrink-0 flex items-center justify-center bg-black/30 rounded-full w-20 h-20 border border-white/5">
              {renderPlanetSVG(activeObj.id)}
            </div>
            <div className="flex flex-col gap-1.5 font-mono">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                {activeObj.name} <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[9px] text-[#ededed]/50 uppercase tracking-widest">
                RA: {activeObj.ra}h // DEC: {activeObj.dec}°
              </p>
              <div className="text-[10px] text-[#ededed]/70 leading-relaxed font-sans max-h-[50px] overflow-y-auto">
                {activeObj.description}
              </div>
            </div>
          </div>

          {/* Visibility Index */}
          {(() => {
            const score = getVisibilityScore(position.elevation);
            return (
              <div className={`border ${score.border} ${score.bg} rounded-lg p-3 flex items-center justify-between font-mono`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] uppercase tracking-wider text-[#ededed]/60">Atmospheric Sight Rating</span>
                  <span className={`text-xs font-bold ${score.color}`}>{score.label.toUpperCase()}</span>
                </div>
                {position.elevation > 0 ? (
                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-wider text-[#ededed]/60 block">Target elevation</span>
                    <span className="text-xs font-black text-white">{position.elevation.toFixed(1)}°</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold uppercase tracking-wider animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" /> Below Horizon
                  </div>
                )}
              </div>
            );
          })()}

          {/* Coordinate Vectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 mb-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#7c3aed]" /> Dome Vectors
              </div>
              <div className="space-y-0.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span>Elevation:</span>
                  <span className={position.isAboveHorizon ? "text-emerald-400" : "text-[#ededed]/70"}>
                    {position.elevation.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Azimuth:</span>
                  <span className="text-white">{position.azimuth.toFixed(0)}° (Clockwise)</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-lg p-3 flex flex-col justify-between">
              <div className="font-mono text-[8px] uppercase tracking-wider text-[#ededed]/50 flex items-center gap-1">
                <Orbit className="w-3 h-3 text-[#ff007f]" /> Distance
              </div>
              <div className="font-mono text-[10px] text-white mt-1 space-y-0.5">
                <div>AU: <span className="text-[#ff007f] font-bold">{(position.range / 149597870.7).toFixed(3)} AU</span></div>
                <div className="text-[8.5px] opacity-60 text-white font-semibold">
                  {(position.range / 1e6).toFixed(1)}M km
                </div>
              </div>
            </div>
          </div>

          {/* Visual elevation path profile indicator */}
          <div className="bg-black/30 border border-white/5 p-3 rounded-lg flex flex-col gap-1.5">
            <div className="flex justify-between font-mono text-[7px] text-[#ededed]/50 uppercase tracking-widest">
              <span>Horizon Transit Path</span>
              <span>Observed Sidereal Arc</span>
            </div>
            
            {/* Visual indicator bar representing the planet crossing from East to West */}
            <div className="relative h-2 bg-[#020206] rounded-full border border-white/5 overflow-hidden">
              {/* Highlight showing active elevation */}
              {position.isAboveHorizon ? (
                <div 
                  style={{
                    left: `${(position.azimuth / 360) * 100}%`,
                  }}
                  className="absolute w-2 h-2 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f] -translate-x-1/2"
                />
              ) : null}
              {/* Orbit guide line */}
              <div className="absolute inset-x-0 h-[1px] bg-white/10 top-1/2" />
            </div>
            <div className="flex justify-between font-mono text-[7px] text-[#ededed]/40">
              <span>EAST RISE</span>
              <span>WEST SET</span>
            </div>
          </div>

        </div>
      ) : (
        /* Fallback if user selects a Satellite while this component is rendered */
        <div className="flex flex-col items-center justify-center text-center p-8 flex-1 border border-dashed border-white/5 rounded-lg bg-[#0b0b14]/20">
          <Orbit className="w-8 h-8 text-[#ff007f] mb-3 animate-pulse" />
          <div className="font-mono text-xs font-semibold text-[#ededed] uppercase">Planet Link Inactive</div>
          <div className="text-[10px] text-[#ededed]/50 font-mono mt-1 max-w-[200px]">
            Target is classified as an active artificial satellite. Refer to the Satellite Telemetry Deck.
          </div>
        </div>
      )}
    </div>
  );
};
