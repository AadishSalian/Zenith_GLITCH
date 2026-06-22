"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useSpaceTracker } from "./SpaceTrackerContext";
import { Orbit } from "lucide-react";

export const SkyRadar: React.FC = () => {
  const {
    activeLocation,
    selectedObjectId,
    setSelectedObjectId,
    trackedObjects,
    positions,
    hudGridEnabled,
    activeFilter,
  } = useSpaceTracker();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ x: -(y / (rect.height / 2)) * 6, y: (x / (rect.width / 2)) * 6 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = 400;
    const height = 400;
    const margin = 35;
    const center = width / 2;
    const maxRadius = center - margin;

    // Filter objects
    const visibleObjects = trackedObjects.filter((obj) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "satellite") return obj.type === "satellite";
      if (activeFilter === "planet") return obj.type === "planet";
      if (activeFilter === "iss") return obj.id === "iss";
      return true;
    });

    const projection = (azimuth: number, elevation: number) => {
      const elFactor = (90 - Math.max(0, elevation)) / 90;
      const dist = maxRadius * elFactor;
      const rad = (azimuth * Math.PI) / 180;
      const x = center + Math.sin(rad) * dist;
      const y = center - Math.cos(rad) * dist;
      return { x, y };
    };

    // Draw Grid
    if (hudGridEnabled) {
      const grid = svg.append("g").attr("class", "grid");
      
      // Elevation circles
      [30, 60].forEach((el) => {
        const r = maxRadius * ((90 - el) / 90);
        grid.append("circle")
          .attr("cx", center).attr("cy", center).attr("r", r)
          .attr("fill", "none").attr("stroke", "rgba(124, 58, 237, 0.12)").attr("stroke-width", 1);
        grid.append("text")
          .attr("x", center + 5).attr("y", center - r + 3)
          .attr("fill", "rgba(124, 58, 237, 0.4)").attr("font-size", "8px").attr("font-family", "monospace")
          .text(`${el}° EL`);
      });

      // Horizon circle
      grid.append("circle")
        .attr("cx", center).attr("cy", center).attr("r", maxRadius)
        .attr("fill", "none").attr("stroke", "rgba(0, 243, 255, 0.2)").attr("stroke-width", 1.5);

      // Crosslines
      grid.append("line").attr("x1", center).attr("y1", margin).attr("x2", center).attr("y2", height - margin).attr("stroke", "rgba(124, 58, 237, 0.08)").attr("stroke-width", 0.5);
      grid.append("line").attr("x1", margin).attr("y1", center).attr("x2", width - margin).attr("y2", center).attr("stroke", "rgba(124, 58, 237, 0.08)").attr("stroke-width", 0.5);

      // Compass Labels
      const labels = [
        { text: "N", x: center, y: margin - 15 },
        { text: "S", x: center, y: height - margin + 15 },
        { text: "E", x: width - margin + 15, y: center },
        { text: "W", x: margin - 15, y: center },
      ];
      labels.forEach(l => {
        grid.append("text")
          .attr("x", l.x).attr("y", l.y)
          .attr("fill", "rgba(0, 243, 255, 0.6)").attr("font-size", "10px").attr("font-weight", "bold").attr("font-family", "monospace")
          .attr("text-anchor", "middle").attr("alignment-baseline", "middle")
          .text(l.text);
      });
    }

    // Draw Objects
    const objectsGroup = svg.append("g").attr("class", "objects");

    visibleObjects.forEach(obj => {
      const pos = positions[obj.id];
      if (!pos || !pos.isAboveHorizon) return;

      const { x, y } = projection(pos.azimuth, pos.elevation);
      const isSelected = obj.id === selectedObjectId;
      
      let dotColor = "rgba(124, 58, 237, 0.4)";
      let ringColor = "rgba(124, 58, 237, 0.15)";
      
      if (obj.id === "iss") { dotColor = "#00f3ff"; ringColor = "rgba(0, 243, 255, 0.25)"; }
      else if (obj.id === "hst") { dotColor = "#a78bfa"; ringColor = "rgba(167, 139, 250, 0.25)"; }
      else if (obj.type === "planet") {
        if (obj.id === "mars") dotColor = "#f97316";
        else if (obj.id === "venus") dotColor = "#fbbf24";
        else if (obj.id === "jupiter") dotColor = "#e8d3a7";
        else if (obj.id === "saturn") dotColor = "#c084fc";
        ringColor = "rgba(255,255,255,0.08)";
      }

      const objNode = objectsGroup.append("g")
        .style("cursor", "pointer")
        .on("click", () => setSelectedObjectId(obj.id));

      // Outer ring
      objNode.append("circle")
        .attr("cx", x).attr("cy", y)
        .attr("r", isSelected ? 12 : 8)
        .attr("fill", "none")
        .attr("stroke", ringColor)
        .attr("stroke-width", 1);

      if (isSelected) {
        objNode.append("circle")
          .attr("cx", x).attr("cy", y)
          .attr("r", 15)
          .attr("fill", "none")
          .attr("stroke", dotColor)
          .attr("stroke-opacity", 0.25)
          .attr("stroke-width", 1.5)
          .classed("animate-pulse", true);
      }

      // Dot
      objNode.append("circle")
        .attr("cx", x).attr("cy", y)
        .attr("r", isSelected ? 4 : 3)
        .attr("fill", dotColor);

      // Label
      objNode.append("text")
        .attr("x", x + (isSelected ? 16 : 12))
        .attr("y", y)
        .attr("fill", isSelected ? dotColor : "rgba(237, 237, 237, 0.5)")
        .attr("font-size", isSelected ? "9px" : "9px")
        .attr("font-weight", isSelected ? "bold" : "normal")
        .attr("font-family", "monospace")
        .attr("alignment-baseline", "middle")
        .text(obj.name.substring(0, 15));
    });

  }, [positions, selectedObjectId, trackedObjects, hudGridEnabled, activeFilter, setSelectedObjectId]);

  return (
    <div className="bg-[#030816] border border-[#101b33] rounded-xl p-5 flex flex-col items-center justify-between relative h-full select-none font-sans">
      <div className="w-full flex flex-col gap-0.5 border-b border-[#101b33] pb-3 mb-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[#00f3ff] font-bold text-sm tracking-wide uppercase flex items-center gap-2">
            <Orbit className="w-4 h-4 text-[#00f3ff] animate-[spin_10s_linear_infinite]" />
            Sky Radar System
          </h2>
        </div>
      </div>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 0.1s ease-out" }}
        className="relative cursor-crosshair flex items-center justify-center p-4 border border-[#101b33] rounded-full bg-[#050b18]/80 overflow-hidden shadow-[0_0_20px_rgba(0,243,255,0.05)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/2 via-transparent to-[#00f3ff]/2 pointer-events-none rounded-full" />
        <svg ref={svgRef} width="400" height="400" className="relative z-10" />
      </div>
    </div>
  );
};
