"use client";

import React from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Radio, Orbit, Target, Globe } from "lucide-react";

export const FilterBar: React.FC = () => {
  const { activeFilter, setActiveFilter } = useSpaceTracker();

  const filters = [
    { id: "all", label: "ALL", icon: Globe, color: "text-white" },
    { id: "satellite", label: "SATS", icon: Target, color: "text-[#c084fc]" },
    { id: "planet", label: "PLANETS", icon: Orbit, color: "text-[#f97316]" },
    { id: "iss", label: "ISS ONLY", icon: Radio, color: "text-[#00f3ff]" },
  ] as const;

  return (
    <div className="bg-[#030816]/75 backdrop-blur-md border border-[#101b33] rounded-xl p-2 flex items-center justify-between w-full max-w-sm mx-auto shadow-lg relative overflow-hidden z-20">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f3ff]/5 to-transparent pointer-events-none" />
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
    </div>
  );
};
