"use client";

import React, { useEffect, useState } from "react";
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
  const [wikiSummary, setWikiSummary] = useState<string | null>(null);
  const [isLoadingWiki, setIsLoadingWiki] = useState(false);

  useEffect(() => {
    if (!activeObj) return;
    async function fetchWiki() {
      setIsLoadingWiki(true);
      setWikiSummary(null);
      try {
        let query = activeObj?.name || "";
        if (activeObj?.id === "iss") query = "International Space Station";
        if (activeObj?.id === "hst") query = "Hubble Space Telescope";
        
        // For general satellites that might just be "STARLINK-..."
        if (activeObj?.type === "satellite" && activeObj?.id !== "iss" && activeObj?.id !== "hst") {
          query = "Artificial_satellite"; // Default back to satellite if no specific page expected for random objects, or we can try their name
        }

        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setWikiSummary(data.extract);
        } else {
          setWikiSummary("No detailed database record found for this specific tracking target.");
        }
      } catch (e) {
        setWikiSummary("Downlink failed. Database inaccessible.");
      }
      setIsLoadingWiki(false);
    }
    fetchWiki();
  }, [activeObj]);

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

      {/* Slide-out drawer panel (Full screen on mobile, right drawer on md+) */}
      <div
        className={`fixed top-0 right-0 bottom-0 left-0 md:left-auto z-[60] w-full md:w-[440px] bg-[#030816]/98 border-t md:border-t-0 md:border-l border-[#101b33] shadow-[0_-10px_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 flex flex-col gap-6 transition-transform duration-500 ease-in-out transform ${
          isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#101b33] pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#00f3ff] font-bold text-lg tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse" />
              Detail Drawer — {activeObj.id.toUpperCase()}
            </h2>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
              <span>{activeObj.type.toUpperCase()} CLASS</span>
              <span>•</span>
              <span className="text-emerald-400">DATA STREAM ACTIVE</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-[#101b33]"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Dynamic Telemetry Component Rendering */}
        <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4">
          {activeObj.type === "satellite" ? (
            <ISSTracker />
          ) : (
            <PlanetTracker />
          )}

          {/* Wikipedia Summary Panel */}
          <div className="bg-black/30 border border-[#101b33] rounded-lg p-4 mt-2">
            <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-[#101b33] pb-1">Database Uplink</h3>
            {isLoadingWiki ? (
              <p className="text-[#c084fc] animate-pulse text-xs font-mono">Fetching archives...</p>
            ) : (
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                {wikiSummary}
              </p>
            )}
          </div>

          {/* Pass Alert Button */}
          {activeObj.id === "iss" && (
             <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button 
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  if ("Notification" in window) {
                    Notification.requestPermission().then(p => {
                      if (p === "granted") {
                        new Notification("Pass Alert Set", { body: "You will be notified when ISS is above 10 deg." });
                        btn.innerText = "ALERT SET!";
                        btn.classList.add("text-emerald-400", "border-emerald-500");
                      } else {
                        btn.innerText = "PERMISSION DENIED";
                        btn.classList.add("text-rose-400", "border-rose-500");
                      }
                      setTimeout(() => {
                        btn.innerText = originalText;
                        btn.classList.remove("text-emerald-400", "border-emerald-500", "text-rose-400", "border-rose-500");
                      }, 3000);
                    });
                  } else {
                    btn.innerText = "NOT SUPPORTED";
                    btn.classList.add("text-rose-400", "border-rose-500");
                    setTimeout(() => {
                      btn.innerText = originalText;
                      btn.classList.remove("text-rose-400", "border-rose-500");
                    }, 3000);
                  }
                }}
                className="flex-1 bg-slate-900/50 hover:bg-emerald-900/30 border border-[#101b33] hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all rounded-lg p-3 text-xs font-bold tracking-widest uppercase text-center cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0)] hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                Set Pass Alert
              </button>
              <button 
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  navigator.clipboard.writeText(window.location.href);
                  btn.innerText = "COPIED!";
                  btn.classList.add("text-blue-400", "border-blue-500");
                  setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove("text-blue-400", "border-blue-500");
                  }, 2000);
                }}
                className="flex-1 bg-slate-900/50 hover:bg-blue-900/30 border border-[#101b33] hover:border-blue-500/50 text-slate-300 hover:text-blue-400 transition-all rounded-lg p-3 text-xs font-bold tracking-widest uppercase text-center cursor-pointer"
              >
                Share View
              </button>
            </div>
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


