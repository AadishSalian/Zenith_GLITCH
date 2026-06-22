"use client";

import React, { useState } from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Radio, Orbit, Target, Globe, Clock } from "lucide-react";

export const FilterBar: React.FC = () => {
  const { activeFilter, setActiveFilter, simulationTime, setSimulationTime } = useSpaceTracker();
  const [timeTravelActive, setTimeTravelActive] = useState(false);

  const filters = [
    { id: "all", label: "ALL", icon: Globe, color: "text-white" },
    { id: "satellite", label: "SATS", icon: Target, color: "text-[#c084fc]" },
    { id: "planet", label: "PLANETS", icon: Orbit, color: "text-[#f97316]" },
    { id: "iss", label: "ISS ONLY", icon: Radio, color: "text-[#00f3ff]" },
  ] as const;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationTime(new Date(e.target.value).getTime());
  };

  return (
    <div className="bg-[#030816]/75 backdrop-blur-md border border-[#101b33] rounded-xl p-2 flex items-center justify-between w-full max-w-sm mx-auto shadow-lg relative overflow-hidden z-20">
      <div className="flex w-full gap-2 relative z-20">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg cursor-pointer transition-all duration-300 relative ${
              activeFilter === f.id
                ? "bg-[#0b1b36] shadow-[0_0_15px_rgba(0,243,255,0.1)] border border-[#00f3ff]/20"
                : "hover:bg-slate-900/50 border border-transparent"
            }`}
          >
            <f.icon className={`w-4 h-4 ${activeFilter === f.id ? f.color : "text-slate-500"}`} />
            <span
              className={`font-mono text-[9px] font-bold tracking-widest ${
                activeFilter === f.id ? f.color : "text-slate-500"
              }`}
            >
              {f.label}
            </span>
          </button>
        ))}
        
        <button
          onClick={() => setTimeTravelActive(!timeTravelActive)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg cursor-pointer transition-all duration-300 border ${
            timeTravelActive
              ? "bg-[#250b36] shadow-[0_0_15px_rgba(243,0,255,0.1)] border-fuchsia-500/50 text-fuchsia-400"
              : "hover:bg-slate-900/50 border-transparent text-slate-500"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono text-[9px] font-bold tracking-widest">
            TIME TRAVEL
          </span>
        </button>
      </div>

      {timeTravelActive && (
        <div className="w-full mt-3 p-3 bg-black/40 border border-[#101b33] rounded-lg flex flex-col gap-2 relative z-20 animate-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] text-[#f472b6] font-bold tracking-widest uppercase">Select Temporal Coordinates</label>
          <input 
            type="datetime-local" 
            value={new Date(simulationTime).toISOString().slice(0, 16)}
            onChange={handleTimeChange}
            className="w-full bg-[#030816] border border-[#101b33] rounded p-2 text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-colors"
          />
          <button 
            onClick={() => setSimulationTime(Date.now())}
            className="mt-1 text-[9px] text-slate-400 hover:text-white font-mono tracking-widest uppercase text-left transition-colors"
          >
            Reset to Present
          </button>
        </div>
      )}
    </div>
  );
};
