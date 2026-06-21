"use client";

import React from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { ISSTracker } from "./ISSTracker";
import { PlanetTracker } from "./PlanetTracker";
import { X, ChevronLeft, Target } from "lucide-react";

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({ isOpen, onClose }) => {
  const { selectedObjectId, trackedObjects } = useSpaceTracker();
  const activeObj = trackedObjects.find((o) => o.id === selectedObjectId);

  if (!activeObj) return null;

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden"
        />
      )}

      {/* Slide-out drawer panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-[#030816]/98 border-l border-[#101b33] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 flex flex-col gap-6 transition-transform duration-500 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#101b33] pb-4">
          <div className="flex items-center gap-2 font-sans">
            <Target className="w-5 h-5 text-[#00f3ff] animate-pulse" />
            <div>
              <h2 className="text-white font-bold text-sm leading-none uppercase">
                Target Telemetry Lock
              </h2>
              <span className="text-slate-500 text-[9px] font-mono tracking-widest mt-1 block">
                ID: {activeObj.id.toUpperCase()} ‖ CLASS: {activeObj.type.toUpperCase()}
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-800 hover:border-rose-500 hover:bg-rose-500/10 text-[#ededed]/60 hover:text-rose-500 transition-all cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Telemetry Component Rendering */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeObj.type === "satellite" ? (
            <ISSTracker />
          ) : (
            <PlanetTracker />
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[#101b33] pt-4 font-mono text-[8px] text-slate-500 text-center tracking-widest uppercase">
          {"Zenith Array Connection // Downlink Secured"}
        </div>
      </div>

      {/* Floating pull tab when drawer is closed and object is locked */}
      {!isOpen && (
        <button
          onClick={onClose}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#00f3ff] hover:bg-[#00e0eb] text-[#020206] py-3.5 px-2 rounded-l-xl shadow-2xl transition-all duration-300 flex flex-col items-center gap-1.5 font-sans font-bold text-[9px] tracking-wider uppercase cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 animate-bounce" />
          <span className="[writing-mode:vertical-lr] text-center tracking-[0.2em] font-black">
            Lock details
          </span>
        </button>
      )}
    </>
  );
};
