"use client";

import React, { useRef, useEffect } from "react";
import { arc, easeElasticOut, select } from "d3";
import gsap from "gsap";
import { RadarObject, polarToCartesian } from "../lib/radar-utils";
import { useSpaceTracker } from "./SpaceTrackerContext";

interface SkyRadarProps {
  className?: string;
}

export const SkyRadar: React.FC<SkyRadarProps> = ({ className = "" }) => {
  // We map the requested store pattern to the existing project's context logic
  const { trackedObjects, positions, activeFilter, selectedObjectId, setSelectedObjectId } = useSpaceTracker();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Ref to hold animation progress for the sweep arc
  const sweepProgressRef = useRef({ angle: 0 });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Use ResizeObserver for responsive SVG dimensions
    const observer = new ResizeObserver((entries) => {
      if (!entries[0] || !svgRef.current) return;
      // Force square aspect ratio constraint from container
      const { width, height } = entries[0].contentRect;
      const size = Math.min(width, height);
      svgRef.current.style.width = `${size}px`;
      svgRef.current.style.height = `${size}px`;
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove(); // Re-render clean

    const R = 220;
    
    // Create translation group matching viewBox 0 0 500 500
    const g = svg.append("g")
      .attr("transform", "translate(250,250)");

    // Layer 1: Grids
    const grids = g.append("g").attr("class", "layer-grids");
    
    // Concentric elevation rings
    [R, R * 0.66, R * 0.33].forEach(r => {
      grids.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "rgba(0, 243, 255, 0.15)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");
    });

    // Crosshairs
    grids.append("line").attr("x1", -R).attr("y1", 0).attr("x2", R).attr("y2", 0).attr("stroke", "rgba(0, 243, 255, 0.2)");
    grids.append("line").attr("x1", 0).attr("y1", -R).attr("x2", 0).attr("y2", R).attr("stroke", "rgba(0, 243, 255, 0.2)");

    // Layer 2: Labels
    const labels = g.append("g").attr("class", "layer-labels");
    const cardinals = [
      { t: "N", a: 0 }, { t: "E", a: 90 }, { t: "S", a: 180 }, { t: "W", a: 270 }
    ];
    cardinals.forEach(c => {
      const pos = polarToCartesian(c.a, 0, R + 15);
      labels.append("text")
        .attr("x", pos.x)
        .attr("y", pos.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "rgba(0, 243, 255, 0.5)")
        .style("font-family", "monospace")
        .style("font-size", "11px")
        .text(c.t);
    });

    // Layer 3: Radar Sweep Arc Reveal
    const arcGroup = g.append("g").attr("class", "layer-sweep");
    const arcGen = arc()
      .innerRadius(0)
      .outerRadius(R)
      .startAngle(0);
      
    const sweepPath = arcGroup.append("path")
      .attr("fill", "rgba(0, 243, 255, 0.1)");

    // Only animate from 0 on the first mount, else just maintain position
    if (sweepProgressRef.current.angle === 0) {
      gsap.to(sweepProgressRef.current, {
        angle: Math.PI * 2,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (!alive) return;
          sweepPath.attr("d", arcGen({ innerRadius: 0, outerRadius: R, startAngle: 0, endAngle: sweepProgressRef.current.angle } as any) as string);
        },
        onComplete: () => {
          if (!alive) return;
          gsap.to(sweepPath.node(), { opacity: 0, duration: 1.0 });
        }
      });
    } else {
      sweepPath.attr("d", arcGen({ innerRadius: 0, outerRadius: R, startAngle: 0, endAngle: Math.PI * 2 } as any) as string).style("opacity", 0);
    }

    // Filter Logic
    const visibleObjects = trackedObjects.filter(obj => {
      if (activeFilter === "all") return true;
      if (activeFilter === "iss") return obj.id === "iss";
      return obj.type === activeFilter;
    });

    // Map to RadarObject
    const mappedObjects: RadarObject[] = visibleObjects.map(obj => {
      const pos = positions[obj.id] || { azimuth: Math.random() * 360, elevation: Math.random() * 90 };
      let color = "#fff";
      if (obj.id === "iss") color = "#00f3ff";
      else if (obj.type === "satellite") color = "#c084fc";
      else if (obj.type === "planet") color = "#f97316";

      return {
        id: obj.id,
        type: obj.type as "iss" | "satellite" | "planet" | "star",
        label: obj.name,
        azimuth: pos.azimuth,
        elevation: pos.elevation,
        color,
        size: obj.id === "iss" ? 5 : 3
      };
    });

    // Layer 4: Data Dots
    const dotsGroup = g.append("g").attr("class", "layer-dots");
    const dots = dotsGroup.selectAll(".radar-dot")
      .data(mappedObjects, (d: any) => d.id);

    const dotsEnter = dots.enter()
      .append("g")
      .attr("class", "radar-dot")
      .style("cursor", "pointer")
      .on("click", (e, d) => setSelectedObjectId(d.id));

    dotsEnter.append("circle")
      .attr("class", "dot-circle")
      .attr("r", 0)
      .attr("fill", d => d.color);

    dotsEnter.append("text")
      .attr("class", "dot-label")
      .attr("x", 10)
      .attr("y", 3)
      .attr("fill", d => d.id === selectedObjectId ? d.color : "rgba(255,255,255,0.4)")
      .style("font-family", "monospace")
      .style("font-size", "9px")
      .text(d => d.label.substring(0, 12));

    const dotsMerge = dotsEnter.merge(dots as any);

    // Update positions with a nice bounce transition
    dotsMerge.transition().duration(1000).ease(easeElasticOut)
      .attr("transform", (d: RadarObject) => {
        const p = polarToCartesian(d.azimuth, d.elevation, R);
        return `translate(${p.x},${p.y})`;
      });

    dotsMerge.select(".dot-circle")
      .attr("r", (d: RadarObject) => d.id === selectedObjectId ? (d.size || 3) * 1.5 : (d.size || 3));

    dotsMerge.select(".dot-label")
      .attr("fill", (d: RadarObject) => d.id === selectedObjectId ? d.color : "rgba(255,255,255,0.4)")
      .style("font-weight", (d: RadarObject) => d.id === selectedObjectId ? "bold" : "normal");

    dots.exit().transition().duration(300).style("opacity", 0).remove();

    // Layer 5: Target Reticle
    const reticleGroup = g.append("g").attr("class", "layer-reticle");
    const selectedObj = mappedObjects.find(o => o.id === selectedObjectId);
    
    if (selectedObj) {
      const pos = polarToCartesian(selectedObj.azimuth, selectedObj.elevation, R);
      
      const reticle = reticleGroup.append("circle")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", 14)
        .attr("fill", "none")
        .attr("stroke", selectedObj.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "3 3");

      gsap.to(reticle.node(), {
        rotation: 360,
        transformOrigin: `${pos.x}px ${pos.y}px`,
        repeat: -1,
        duration: 6,
        ease: "linear"
      });
      
      const pulse = reticleGroup.append("circle")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", 16)
        .attr("fill", "none")
        .attr("stroke", selectedObj.color)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 2);

      gsap.to(pulse.node(), {
        scale: 1.5,
        opacity: 0,
        transformOrigin: `${pos.x}px ${pos.y}px`,
        repeat: -1,
        duration: 1.5,
        ease: "power2.out"
      });
    }

    return () => {
      alive = false;
      // Kill GSAP tweens when component unmounts
      gsap.killTweensOf(sweepProgressRef.current);
    };

  }, [trackedObjects, positions, activeFilter, selectedObjectId, setSelectedObjectId]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-[#030816]/30 backdrop-blur-md rounded-xl border border-cyan-500/10 ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full max-h-full"
      />
    </div>
  );
};

export default SkyRadar;

