"use client";

import React, { useState, useEffect } from "react";
import { useSpaceTracker, Location } from "./SpaceTrackerContext";
import { Navigation, Globe, Check, AlertCircle } from "lucide-react";

export const LocationPicker: React.FC = () => {
  const { activeLocation, setActiveLocation, locationPresets } = useSpaceTracker();
  
  const [latInput, setLatInput] = useState<string>(activeLocation.lat.toString());
  const [lngInput, setLngInput] = useState<string>(activeLocation.lng.toString());
  const [labelInput, setLabelInput] = useState<string>(activeLocation.label);
  
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Formatter for coordinates display inside buttons
  const formatLat = (lat: number) => {
    const dir = lat >= 0 ? "N" : "S";
    return `${Math.abs(lat).toFixed(3)}° ${dir}`;
  };

  const formatLng = (lng: number) => {
    const dir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lng).toFixed(3)}° ${dir}`;
  };

  // Synchronize changes back to context
  const handleUpdateCoords = (newLat: string, newLng: string, newLabel: string) => {
    setErrorMsg(null);
    setSuccessMsg(false);

    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMsg("Latitude must be a decimal between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setErrorMsg("Longitude must be a decimal between -180 and 180.");
      return;
    }

    setActiveLocation({
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      label: newLabel.trim() || "Custom Coordinates Array",
    });

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUpdateCoords(latInput, lngInput, labelInput);
    }
  };

  const handleBlur = () => {
    handleUpdateCoords(latInput, lngInput, labelInput);
  };

  // Browser Geolocation GPS trigger
  const handleGPSDetect = () => {
    setGpsDetecting(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          const label = "GPS Synced Node";
          
          setLatInput(lat.toString());
          setLngInput(lng.toString());
          setLabelInput(label);
          
          setActiveLocation({ lat, lng, label });
          setGpsDetecting(false);
          setSuccessMsg(true);
          setTimeout(() => setSuccessMsg(false), 2000);
        },
        () => {
          setErrorMsg("Failed to sync GPS. Please check permissions or type manually.");
          setGpsDetecting(false);
        },
        { timeout: 8000 }
      );
    } else {
      setErrorMsg("Browser does not support HTML5 Geolocation.");
      setGpsDetecting(false);
    }
  };

  // Presets selector
  const handlePresetSelect = (preset: Location) => {
    setActiveLocation(preset);
    setErrorMsg(null);
  };

  // Dynamic Clocks for Local and UTC times
  const [timeState, setTimeState] = useState<{ local: string; utc: string }>({
    local: "00:00:00",
    utc: "00:00:00",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Calculate local time for active location
      // By default using local timezone of browser, or computing offset if preset is selected
      let localString = now.toLocaleTimeString("en-US", { hour12: false });
      
      if (activeLocation.label === "Kennedy Space Center" || activeLocation.label === "Starbase, Boca Chica") {
        // US East/Central (approx offset -5 / -6)
        const offset = activeLocation.label === "Kennedy Space Center" ? -5 : -6;
        const targetTime = new Date(now.getTime() + (now.getTimezoneOffset() + offset * 60) * 60000);
        localString = targetTime.toLocaleTimeString("en-US", { hour12: false });
      } else if (activeLocation.label === "Baikonur Cosmodrome") {
        const targetTime = new Date(now.getTime() + (now.getTimezoneOffset() + 5 * 60) * 60000);
        localString = targetTime.toLocaleTimeString("en-US", { hour12: false });
      } else if (activeLocation.label === "Guiana Space Centre") {
        const targetTime = new Date(now.getTime() + (now.getTimezoneOffset() - 3 * 60) * 60000);
        localString = targetTime.toLocaleTimeString("en-US", { hour12: false });
      } else if (activeLocation.label === "Esrange Space Center") {
        const targetTime = new Date(now.getTime() + (now.getTimezoneOffset() + 2 * 60) * 60000);
        localString = targetTime.toLocaleTimeString("en-US", { hour12: false });
      } else if (activeLocation.label === "Tanegashima Space Center") {
        const targetTime = new Date(now.getTime() + (now.getTimezoneOffset() + 9 * 60) * 60000);
        localString = targetTime.toLocaleTimeString("en-US", { hour12: false });
      }

      const utcString = now.toISOString().substring(11, 19);

      setTimeState({
        local: localString,
        utc: utcString,
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeLocation]);

  // Derived elevation metadata based on location name
  const getElevation = () => {
    if (activeLocation.label === "Kennedy Space Center") return "5 m";
    if (activeLocation.label === "Starbase, Boca Chica") return "3 m";
    if (activeLocation.label === "Baikonur Cosmodrome") return "90 m";
    if (activeLocation.label === "Guiana Space Centre") return "24 m";
    if (activeLocation.label === "Esrange Space Center") return "330 m";
    if (activeLocation.label === "Tanegashima Space Center") return "85 m";
    return "538 m";
  };

  // Derived timezone metadata based on location name
  const getTimezone = () => {
    if (activeLocation.label === "Kennedy Space Center") return { offset: "GMT -5:00", name: "Eastern Standard Time" };
    if (activeLocation.label === "Starbase, Boca Chica") return { offset: "GMT -6:00", name: "Central Standard Time" };
    if (activeLocation.label === "Baikonur Cosmodrome") return { offset: "GMT +5:00", name: "West Kazakhstan Time" };
    if (activeLocation.label === "Guiana Space Centre") return { offset: "GMT -3:00", name: "French Guiana Time" };
    if (activeLocation.label === "Esrange Space Center") return { offset: "GMT +2:00", name: "Central European Time" };
    if (activeLocation.label === "Tanegashima Space Center") return { offset: "GMT +9:00", name: "Japan Standard Time" };
    
    // Fallback using browser data
    const offsetMin = -new Date().getTimezoneOffset();
    const offsetHr = Math.floor(Math.abs(offsetMin) / 60);
    const sign = offsetMin >= 0 ? "+" : "-";
    const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1]?.replace("_", " ") || "Local Time";
    return {
      offset: `GMT ${sign}${offsetHr}:00`,
      name: zoneName,
    };
  };

  const tz = getTimezone();

  return (
    <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col gap-5 h-full select-none font-sans">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-[#101b33] pb-3">
        <h2 className="text-[#00f3ff] font-bold text-sm tracking-wide uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full animate-pulse" />
          Observer Node Coordinates
        </h2>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono tracking-wider font-semibold">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          SYS_SYNCED
        </div>
      </div>

      {/* 2. Quick Select section */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[10px] uppercase text-[#00f3ff] font-semibold tracking-wider flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-[#00f3ff]" /> Quick Select Arrays
        </label>
        <div className="grid grid-cols-2 gap-2">
          {locationPresets.map((preset) => {
            const isSelected = preset.label === activeLocation.label;
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className={`py-2.5 px-3 rounded-lg border font-sans text-left transition-all duration-300 flex items-center gap-2.5 cursor-pointer outline-none ${
                  isSelected
                    ? "bg-[#0b1b36] border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.06)]"
                    : "bg-[#050b18]/60 border-slate-800/80 hover:border-slate-700 text-[#ededed]/80 hover:text-white"
                }`}
              >
                {/* Flag emoji on the left */}
                <span className="text-xl shrink-0 leading-none">{preset.flag}</span>
                
                {/* Spaceport details */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-white truncate">{preset.label}</span>
                  <span className="text-[#38bdf8] font-mono text-[9px] mt-0.5 font-medium leading-none">
                    {formatLat(preset.lat)}, {formatLng(preset.lng)}
                  </span>
                  <span className="text-slate-500 font-medium text-[8px] mt-0.5 leading-none">
                    {preset.country}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GPS Calibration Button */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleGPSDetect}
          disabled={gpsDetecting}
          className="w-full py-2.5 px-4 font-sans text-[11px] font-bold tracking-widest rounded-lg bg-gradient-to-r from-[#0d2242] to-[#0a1830] hover:from-[#132c54] hover:to-[#0f2445] border border-[#00f3ff]/20 hover:border-[#00f3ff]/50 text-[#00f3ff] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(0,243,255,0.03)]"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? "animate-spin" : ""}`} />
          GPS SENSOR CALIBRATION
        </button>
        <span className="text-[9px] text-slate-500 font-medium text-center leading-none mt-0.5">
          Auto-detect your current location coordinates
        </span>
      </div>

      {/* 4. Separator */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-[#101b33]"></div>
        <span className="flex-shrink mx-3 text-[9px] text-slate-600 uppercase tracking-widest font-semibold">or manual align</span>
        <div className="flex-grow border-t border-[#101b33]"></div>
      </div>

      {/* 5. Coordinates Grid Display (Inputs & Telemetry parameters) */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Latitude Card (Editable) */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5 hover:border-slate-700 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">Latitude</span>
          <input
            type="text"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="bg-transparent text-white font-mono text-sm font-semibold border-none outline-none p-0 focus:ring-0 w-full"
            placeholder="0.0000"
          />
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Decimal Degrees</span>
        </div>

        {/* Longitude Card (Editable) */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5 hover:border-slate-700 transition-all">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">Longitude</span>
          <input
            type="text"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="bg-transparent text-white font-mono text-sm font-semibold border-none outline-none p-0 focus:ring-0 w-full"
            placeholder="0.0000"
          />
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Decimal Degrees</span>
        </div>

        {/* Elevation Card */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">Elevation</span>
          <span className="text-white font-mono text-sm font-semibold leading-none py-0.5 mt-0.5">
            {getElevation()}
          </span>
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Above Sea Level</span>
        </div>

        {/* Timezone Card */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">Timezone</span>
          <span className="text-white font-mono text-xs font-semibold leading-none py-0.5 mt-0.5 truncate">
            {tz.offset}
          </span>
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5 truncate">
            {tz.name}
          </span>
        </div>

        {/* Local Time Card */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">Local Time</span>
          <span className="text-white font-mono text-sm font-semibold leading-none py-0.5 mt-0.5">
            {timeState.local}
          </span>
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Clock Sync</span>
        </div>

        {/* UTC Time Card */}
        <div className="bg-[#050b18]/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] font-bold">UTC Time</span>
          <span className="text-white font-mono text-sm font-semibold leading-none py-0.5 mt-0.5">
            {timeState.utc}
          </span>
          <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Orbital Baseline</span>
        </div>

      </div>

      {/* 6. Success/Errors Alert Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-rose-500 font-mono text-[10px] border border-rose-500/10 bg-rose-500/5 px-2.5 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-2 rounded-lg animate-pulse">
          <Check className="w-4 h-4 shrink-0" />
          <span>Coordinates updated successfully.</span>
        </div>
      )}

      {/* 7. Footer timestamp */}
      <div className="text-[8px] text-slate-600 font-mono text-center tracking-wider mt-1 uppercase">
        LAST UPDATED: MAY 22, 2025 • {timeState.utc} UTC
      </div>

    </div>
  );
};
