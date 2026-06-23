"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

interface CoordinateDisplayProps {
  lat: number;
  lon: number;
}

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ lat, lon }) => {
  const [displayLat, setDisplayLat] = useState<string>("00.0000° N");
  const [displayLon, setDisplayLon] = useState<string>("000.0000° W");

  useEffect(() => {
    // Simple fast scramble animation on mount
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayLat(
        `${(Math.random() * 90).toFixed(4)}° ${Math.random() > 0.5 ? 'N' : 'S'}`
      );
      setDisplayLon(
        `${(Math.random() * 180).toFixed(4)}° ${Math.random() > 0.5 ? 'E' : 'W'}`
      );
      iterations++;
      
      if (iterations >= 10) {
        clearInterval(interval);
        const latDir = lat >= 0 ? "N" : "S";
        const lonDir = lon >= 0 ? "E" : "W";
        setDisplayLat(`${Math.abs(lat).toFixed(4)}° ${latDir}`);
        setDisplayLon(`${Math.abs(lon).toFixed(4)}° ${lonDir}`);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [lat, lon]);

  return (
    <div className="bg-[#050b18]/60 border border-cyan-500/10 rounded-lg p-4 mb-4 flex items-center gap-4">
      <div className="shrink-0 flex items-center justify-center bg-cyan-500/10 rounded-full w-10 h-10 border border-cyan-500/20">
        <Target className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="flex flex-col gap-1 font-mono">
        <span className="text-[10px] text-cyan-500/60 uppercase tracking-widest font-bold">
          Target Coordinates
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-200">
            LAT: <span className="text-cyan-400">{displayLat}</span>
          </span>
          <span className="text-sm font-bold text-slate-200">
            LNG: <span className="text-cyan-400">{displayLon}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
