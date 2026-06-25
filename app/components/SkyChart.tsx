"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Orbit } from "lucide-react";

export const SkyChart: React.FC = () => {
  const {
    activeLocation,
    selectedObjectId,
    setSelectedObjectId,
    trackedObjects,
    positions,
    hudGridEnabled,
  } = useSpaceTracker();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Tilt state for 3D holographic hover effect (Apple Vision Pro style)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Store static stars so they don't regenerate every frame
  const starsRef = useRef<Array<{ x: number; y: number; r: number; brightness: number; speed: number }>>([]);

  useEffect(() => {
    // Generate 80 random star coordinates inside the dome
    const stars = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.98; // keep within 98% of the dome circle
      stars.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        r: 0.5 + Math.random() * 1.5,
        brightness: Math.random(),
        speed: 0.005 + Math.random() * 0.015,
      });
    }
    starsRef.current = stars;
  }, []);

  // Radar sweep animation clock
  const radarSweepAngleRef = useRef<number>(0);

  // Handle 3D holographic tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Map to max tilt angle of 6 degrees
    const tiltX = -(y / (rect.height / 2)) * 6;
    const tiltY = (x / (rect.width / 2)) * 6;
    setTilt({ x: tiltX, y: tiltY });

    // Track mouse on canvas for hover targeting
    const canvas = canvasRef.current;
    if (canvas) {
      const cRect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - cRect.left,
        y: e.clientY - cRect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setMousePos(null);
    setHoveredObjectId(null);
  };

  // Convert canvas coords to check if user is hovering over an object
  const getObjectCanvasCoords = (azimuth: number, elevation: number, center: number, maxRadius: number) => {
    // Standard projection:
    // Elevation 90 is center (zenith)
    // Elevation 0 is edge (horizon)
    // Distance from center is proportional to (90 - elevation)
    const elFactor = (90 - Math.max(0, elevation)) / 90;
    const dist = maxRadius * elFactor;
    
    // Azimuth: North is 0 degrees, measured clockwise
    // Canvas: Y is downward, X is rightward
    // 0 deg -> (0, -1)
    // 90 deg -> (1, 0)
    // 180 deg -> (0, 1)
    // 270 deg -> (-1, 0)
    const rad = (azimuth * Math.PI) / 180;
    const x = center + Math.sin(rad) * dist;
    const y = center - Math.cos(rad) * dist;
    return { x, y };
  };

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      // Clear with transparency to let CSS grid gradient show through
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dpr = window.devicePixelRatio || 1;
      const size = canvas.width / dpr;
      const center = size / 2;
      const margin = 35;
      const maxRadius = center - margin;

      // Scale context for retina screens
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Starfield (with twinkling brightness)
      starsRef.current.forEach((star) => {
        star.brightness += star.speed;
        if (star.brightness > 1 || star.brightness < 0) {
          star.speed = -star.speed;
        }
        
        const sx = center + star.x * maxRadius;
        const sy = center + star.y * maxRadius;
        
        ctx.fillStyle = `rgba(237, 237, 237, ${0.1 + star.brightness * 0.75})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Compass Compass / Elevation Rings
      if (hudGridEnabled) {
        ctx.strokeStyle = "rgba(124, 58, 237, 0.12)";
        ctx.lineWidth = 1;

        // Elevation circles: 30 deg, 60 deg
        [30, 60].forEach((el) => {
          const r = maxRadius * ((90 - el) / 90);
          ctx.beginPath();
          ctx.arc(center, center, r, 0, Math.PI * 2);
          ctx.stroke();

          // Labels
          ctx.fillStyle = "rgba(124, 58, 237, 0.4)";
          ctx.font = "8px monospace";
          ctx.fillText(`${el}° EL`, center + 5, center - r + 3);
        });

        // Horizon circle (0 deg)
        ctx.strokeStyle = "rgba(0, 243, 255, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Compass crosslines (North-South, East-West)
        ctx.strokeStyle = "rgba(124, 58, 237, 0.08)";
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        ctx.moveTo(center, margin);
        ctx.lineTo(center, size - margin);
        ctx.moveTo(margin, center);
        ctx.lineTo(size - margin, center);
        ctx.stroke();

        // Compass indicators
        ctx.fillStyle = "rgba(0, 243, 255, 0.6)";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.fillText("N", center, margin - 15);
        ctx.fillText("S", center, size - margin + 15);
        ctx.fillText("E", size - margin + 15, center);
        ctx.fillText("W", margin - 15, center);

        ctx.fillStyle = "rgba(124, 58, 237, 0.35)";
        ctx.fillText("NW", center - maxRadius * 0.707, center - maxRadius * 0.707);
        ctx.fillText("NE", center + maxRadius * 0.707, center - maxRadius * 0.707);
        ctx.fillText("SW", center - maxRadius * 0.707, center + maxRadius * 0.707);
        ctx.fillText("SE", center + maxRadius * 0.707, center + maxRadius * 0.707);
      }

      // 3. Draw Radar Wedged Sweep
      radarSweepAngleRef.current = (radarSweepAngleRef.current + 0.006) % (Math.PI * 2);
      
      const sweepGradient = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
      sweepGradient.addColorStop(0, "rgba(0, 243, 255, 0.01)");
      sweepGradient.addColorStop(1, "rgba(0, 243, 255, 0.06)");

      ctx.save();
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(
        center,
        center,
        maxRadius,
        radarSweepAngleRef.current - 0.25, // sweep width in radians
        radarSweepAngleRef.current,
        false
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Draw Orbit Paths for Satellites (Dashed arcs)
      trackedObjects.forEach((obj) => {
        if (obj.type !== "satellite") return;

        // Draw a simulated transit path curve across the dome
        ctx.strokeStyle = obj.id === "iss" ? "rgba(0, 243, 255, 0.08)" : "rgba(124, 58, 237, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        ctx.beginPath();
        // Plot multiple steps across orbital passes
        for (let t = -45; t <= 45; t += 3) {
          const mockTimeOffset = t * 60000; // offset in minutes
          // Generate a smooth path arc relative to observer
          const periodMs = (obj.id === "iss" ? 92.8 : 95.4) * 60 * 1000;
          const progress = ((Date.now() + mockTimeOffset) % periodMs) / periodMs;
          const angle = progress * Math.PI * 2;
          const maxInclination = obj.id === "iss" ? 51.64 : 28.47;
          const lat = Math.sin(angle) * maxInclination;
          
          const earthDrift = ((Date.now() + mockTimeOffset) / (24 * 60 * 60 * 1000)) * 360;
          let lng = (progress * 360 - earthDrift) % 360;
          if (lng > 180) lng -= 360;
          if (lng < -180) lng += 360;

          // Convert coordinates
          const d2r = Math.PI / 180;
          const r2d = 180 / Math.PI;
          const lat1 = activeLocation.lat * d2r;
          const lng1 = activeLocation.lng * d2r;
          const lat2 = lat * d2r;
          const lng2 = lng * d2r;
          
          const R = 6371;
          const x1 = R * Math.cos(lat1) * Math.cos(lng1);
          const y1 = R * Math.cos(lat1) * Math.sin(lng1);
          const z1 = R * Math.sin(lat1);
          
          const R2 = R + (obj.altitude || 400);
          const x2 = R2 * Math.cos(lat2) * Math.cos(lng2);
          const y2 = R2 * Math.sin(lat2);
          const z2 = R2 * Math.cos(lat2) * Math.sin(lng2); // simplified 3d map

          // Topocentric projection
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dz = z2 - z1;
          const slantRange = Math.sqrt(dx*dx + dy*dy + dz*dz);
          const ux = Math.cos(lat1)*Math.cos(lng1), uy = Math.cos(lat1)*Math.sin(lng1), uz = Math.sin(lat1);
          const vUp = dx*ux + dy*uy + dz*uz;
          const elevation = Math.asin(vUp / slantRange) * r2d;
          
          const ex = -Math.sin(lng1), ey = Math.cos(lng1), ez = 0;
          const nx = -Math.sin(lat1)*Math.cos(lng1), ny = -Math.sin(lat1)*Math.sin(lng1), nz = Math.cos(lat1);
          const vEast = dx*ex + dy*ey + dz*ez;
          const vNorth = dx*nx + dy*ny + dz*nz;
          let azimuth = Math.atan2(vEast, vNorth) * r2d;
          if (azimuth < 0) azimuth += 360;

          if (elevation > 0) {
            const p = getObjectCanvasCoords(azimuth, elevation, center, maxRadius);
            if (t === -45) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]); // reset
      });

      // 5. Draw Tracked Objects
      let currentHoveredId: string | null = null;
      let minDistance = 16; // hover radius threshold

      trackedObjects.forEach((obj) => {
        const pos = positions[obj.id];
        if (!pos) return;

        const isSelected = obj.id === selectedObjectId;
        const isAboveHorizon = pos.elevation > 0;
        
        // Plotted position on Canvas
        const p = getObjectCanvasCoords(pos.azimuth, pos.elevation, center, maxRadius);

        // Check if mouse is hovering
        if (mousePos) {
          const dx = mousePos.x - p.x;
          const dy = mousePos.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            currentHoveredId = obj.id;
          }
        }

        // Color palettes based on object types and status
        let dotColor = "rgba(124, 58, 237, 0.4)"; // Default faded planet
        let ringColor = "rgba(124, 58, 237, 0.15)";
        
        if (isAboveHorizon) {
          if (obj.id === "iss") {
            dotColor = "#00f3ff"; // Cyan ISS
            ringColor = "rgba(0, 243, 255, 0.25)";
          } else if (obj.id === "hst") {
            dotColor = "#a78bfa"; // Lavender Hubble
            ringColor = "rgba(167, 139, 250, 0.25)";
          } else {
            // Planets
            if (obj.id === "mars") dotColor = "#f97316"; // Red-Orange Mars
            else if (obj.id === "venus") dotColor = "#fbbf24"; // Golden Venus
            else if (obj.id === "jupiter") dotColor = "#e8d3a7"; // Beige Jupiter
            else if (obj.id === "saturn") dotColor = "#c084fc"; // Violet Saturn
            ringColor = `rgba(255,255,255,0.08)`;
          }
        } else {
          // Below horizon: grayed out/faded
          dotColor = "rgba(237, 237, 237, 0.2)";
          ringColor = "rgba(237, 237, 237, 0.05)";
        }

        // Draw outer ring
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.stroke();

        // Draw pulsing halo if selected and above horizon
        if (isSelected && isAboveHorizon) {
          const pulseR = 12 + Math.sin(Date.now() / 150) * 4;
          ctx.strokeStyle = `${dotColor}25`; // add transparency
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw core blip dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Target Lock Reticle if Selected
        if (isSelected) {
          ctx.strokeStyle = dotColor;
          ctx.lineWidth = 1.5;
          
          // Draw target box corners
          const sizeBox = 16;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(p.x - sizeBox, p.y - sizeBox + 4);
          ctx.lineTo(p.x - sizeBox, p.y - sizeBox);
          ctx.lineTo(p.x - sizeBox + 4, p.y - sizeBox);
          // Top-right
          ctx.moveTo(p.x + sizeBox - 4, p.y - sizeBox);
          ctx.lineTo(p.x + sizeBox, p.y - sizeBox);
          ctx.lineTo(p.x + sizeBox, p.y - sizeBox + 4);
          // Bottom-left
          ctx.moveTo(p.x - sizeBox, p.y + sizeBox - 4);
          ctx.lineTo(p.x - sizeBox, p.y + sizeBox);
          ctx.lineTo(p.x - sizeBox + 4, p.y + sizeBox);
          // Bottom-right
          ctx.moveTo(p.x + sizeBox - 4, p.y + sizeBox);
          ctx.lineTo(p.x + sizeBox, p.y + sizeBox);
          ctx.lineTo(p.x + sizeBox, p.y + sizeBox - 4);
          ctx.stroke();

          // Target Locked lines pointing in
          ctx.strokeStyle = `${dotColor}20`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, margin);
          ctx.lineTo(p.x, size - margin);
          ctx.moveTo(margin, p.y);
          ctx.lineTo(size - margin, p.y);
          ctx.stroke();
        }

        // Check if this object should have a text label rendered to avoid clutter
        let isHoveredLocal = false;
        if (mousePos) {
          const dx = mousePos.x - p.x;
          const dy = mousePos.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < 16) {
            isHoveredLocal = true;
          }
        }
        
        const isProminent = obj.type === "planet" || obj.id === "iss" || obj.id === "hst";
        
        // Only draw labeling text for selected, hovered, or prominent objects
        if (isSelected || isHoveredLocal || isProminent) {
          ctx.fillStyle = isSelected ? dotColor : "rgba(237, 237, 237, 0.5)";
          ctx.font = isSelected ? "bold 9px monospace" : "9px monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(obj.name, p.x + (isSelected ? 16 : 12), p.y);

          // Subtext details if selected
          if (isSelected) {
            ctx.fillStyle = "rgba(237, 237, 237, 0.4)";
            ctx.font = "7px monospace";
            ctx.fillText(
              `${pos.elevation.toFixed(1)}° EL / ${pos.azimuth.toFixed(0)}° AZ`,
              p.x + 16,
              p.y + 9
            );
          }
        }
      });

      // Update hover state
      setHoveredObjectId(currentHoveredId);

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [positions, selectedObjectId, activeLocation, trackedObjects, hudGridEnabled, mousePos]);

  // Click on Canvas locks target
  const handleCanvasClick = () => {
    if (hoveredObjectId) {
      setSelectedObjectId(hoveredObjectId);
    }
  };

  // Adjust container scale to be responsive
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const canvasSize = 400;

  return (
    <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col items-center justify-between relative h-full select-none font-sans">
      
      {/* HUD Headers */}
      <div className="w-full flex flex-col gap-0.5 border-b border-[#101b33] pb-3 mb-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[#a78bfa] font-bold text-sm tracking-wide uppercase flex items-center gap-2">
            <Orbit className="w-4 h-4 text-[#a78bfa] animate-[spin_10s_linear_infinite]" />
            3D Dome Calibration
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] text-[#ededed]/60 uppercase tracking-widest font-mono">
            <span>ZENITH</span>
          </div>
        </div>
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider leading-none mt-1 pl-6">
          Celestial Reference Frame
        </span>
      </div>

      {/* Canvas container with 3D hover tilt effect */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.1s ease-out",
        }}
        className="relative cursor-crosshair flex items-center justify-center p-4 border border-[#101b33] rounded-full bg-[#050b18]/80 overflow-hidden group shadow-[0_0_20px_rgba(124,58,237,0.01)]"
      >
        {/* Radar rotating glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/2 via-transparent to-[#00f3ff]/2 pointer-events-none rounded-full" />
        <div className="absolute inset-2 border border-dashed border-[#7c3aed]/10 rounded-full pointer-events-none animate-[spin_40s_linear_infinite]" />

        <canvas
          ref={canvasRef}
          width={canvasSize * dpr}
          height={canvasSize * dpr}
          style={{ width: "100%", maxWidth: `${canvasSize}px`, height: "auto", aspectRatio: "1/1" }}
          className="relative z-10 transition-all duration-300"
        />

        {/* Hover Micro Tooltip on canvas */}
        {hoveredObjectId && (
          <div className="absolute z-20 bg-[#020206] border border-[#00f3ff]/30 text-[#00f3ff] font-mono text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none animate-pulse bottom-8">
            LOCK TARGET: {trackedObjects.find((o) => o.id === hoveredObjectId)?.name.toUpperCase()}
          </div>
        )}
      </div>

      {/* Stats Row from mockup */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#050b18]/65 border border-[#101b33] rounded-lg p-3 text-center my-3">
        <div className="flex flex-col gap-0.5 border-r border-[#101b33] last:border-r-0">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Dome Status</span>
          <span className="text-emerald-400 font-bold text-[10px] uppercase mt-1 leading-none">Calibrated</span>
        </div>
        <div className="flex flex-col gap-0.5 border-r border-[#101b33] last:border-r-0">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Accuracy</span>
          <span className="text-amber-400 font-bold text-[10px] uppercase mt-1 leading-none">0.32°</span>
        </div>
        <div className="flex flex-col gap-0.5 border-r border-[#101b33] last:border-r-0">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Sync</span>
          <span className="text-[#22c55e] font-bold text-[10px] uppercase mt-1 leading-none">Locked</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">Grid</span>
          <span className="text-[#00f3ff] font-bold text-[10px] uppercase mt-1 leading-none">Active</span>
        </div>
      </div>

      {/* Legend display */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-[8px] text-[#ededed]/50 pt-3 border-t border-[#101b33]">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full animate-pulse" />
          <span>ISS SPACE LAB</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 bg-[#a78bfa] rounded-full" />
          <span>HUBBLE DOME</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full" />
          <span>MARS TARGET</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full" />
          <span>OUTER GIANTS</span>
        </div>
      </div>
    </div>
  );
};


