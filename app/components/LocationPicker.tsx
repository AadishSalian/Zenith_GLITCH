"use client";

import React, { useState } from "react";
import { useSpaceTracker, Location } from "./SpaceTrackerContext";
import { MapPin, Navigation, Compass, Globe, Check, AlertCircle } from "lucide-react";

export const LocationPicker: React.FC = () => {
  const { activeLocation, setActiveLocation, locationPresets } = useSpaceTracker();
  
  const [latInput, setLatInput] = useState<string>(activeLocation.lat.toString());
  const [lngInput, setLngInput] = useState<string>(activeLocation.lng.toString());
  const [labelInput, setLabelInput] = useState<string>(activeLocation.label);
  
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Manual Coordinates Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(false);

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

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
      label: labelInput.trim() || "Custom Coordinates Array",
    });

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
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

  // Select a preset spaceport
  const handlePresetSelect = (preset: Location) => {
    setActiveLocation(preset);
    setLatInput(preset.lat.toString());
    setLngInput(preset.lng.toString());
    setLabelInput(preset.label);
    setErrorMsg(null);
  };

  return (
    <div className="glass-panel glow-border-cyan rounded-xl p-5 flex flex-col gap-5 h-full">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-[#00f3ff]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[#00f3ff] animate-pulse" />
          <h2 className="font-mono text-sm font-semibold tracking-wider text-[#00f3ff] uppercase">
            Observer Node Coordinates
          </h2>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span>SYS_SYNCED</span>
        </div>
      </div>

      {/* Preset List */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[10px] uppercase text-[#ededed]/60 tracking-wider flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-[#7c3aed]" /> Quick Select Arrays
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {locationPresets.map((preset) => {
            const isSelected = preset.label === activeLocation.label;
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className={`py-2 px-2.5 rounded-lg border font-mono text-[10px] text-left transition-all duration-300 flex flex-col justify-between truncate cursor-pointer ${
                  isSelected
                    ? "bg-[#00f3ff]/5 border-[#00f3ff] text-[#00f3ff]"
                    : "bg-[#0b0b14]/50 border-white/5 hover:border-[#7c3aed]/40 text-[#ededed]/80 hover:text-white"
                }`}
              >
                <span className="font-bold truncate w-full mb-1">{preset.label.split(",")[0]}</span>
                <span className="opacity-60 text-[9px]">
                  {preset.lat.toFixed(2)}°, {preset.lng.toFixed(2)}°
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Calibration */}
      <div className="flex gap-2">
        <button
          onClick={handleGPSDetect}
          disabled={gpsDetecting}
          className="w-full py-2.5 px-4 font-mono text-[10px] font-semibold tracking-widest rounded-lg bg-[#7c3aed]/25 hover:bg-[#7c3aed]/40 border border-[#7c3aed]/40 text-[#ededed] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? "animate-spin" : ""}`} />
          {gpsDetecting ? "CALIBRATING FROM SENSORS..." : "GPS SENSOR CALIBRATION"}
        </button>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-3 font-mono text-[9px] text-[#ededed]/30 uppercase tracking-widest">or manual align</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Manual Coord Form */}
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-wider text-[#ededed]/60">Latitude</label>
            <input
              type="text"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="py-2 px-3 rounded-lg bg-[#0b0b14]/70 border border-white/5 focus:border-[#00f3ff] text-xs font-mono text-[#ededed] outline-none transition-all duration-300"
              placeholder="e.g. 28.5729"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-wider text-[#ededed]/60">Longitude</label>
            <input
              type="text"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              className="py-2 px-3 rounded-lg bg-[#0b0b14]/70 border border-white/5 focus:border-[#00f3ff] text-xs font-mono text-[#ededed] outline-none transition-all duration-300"
              placeholder="e.g. -80.6490"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-wider text-[#ededed]/60">Location Label</label>
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            className="py-2 px-3 rounded-lg bg-[#0b0b14]/70 border border-white/5 focus:border-[#00f3ff] text-xs font-mono text-[#ededed] outline-none transition-all duration-300"
            placeholder="Custom Coordinates Array"
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-rose-500 font-mono text-[10px] border border-rose-500/10 bg-rose-500/5 px-2.5 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-1.5 rounded-lg animate-pulse">
            <Check className="w-4 h-4 shrink-0" />
            <span>Telemetry point updated.</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 font-mono text-[10px] font-bold tracking-widest rounded-lg bg-[#00f3ff]/10 hover:bg-[#00f3ff] border border-[#00f3ff]/30 hover:border-transparent text-[#00f3ff] hover:text-[#020206] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.02)] hover:shadow-[0_0_20px_rgba(0,243,255,0.25)] active:scale-[0.98]"
        >
          <MapPin className="w-3.5 h-3.5" />
          APPLY TARGET LOCK
        </button>
      </form>
    </div>
  );
};
