"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export const HeroTitle: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const ctx = gsap.context(() => {
      if (!alive) return;

      // Phase 1 — Overline fade in (t=0)
      gsap.fromTo(
        ".overline-text",
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      // Phase 2 — Split letters burst
      gsap.fromTo(
        ".char",
        { opacity: 0, scale: 0, y: 40, rotationX: 90 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationX: 0,
          stagger: 0.03,
          duration: 1.2,
          ease: "back.out(1.5)",
          delay: 0.3
        }
      );

      // Phase 3 — Subtitle and CTA fade in
      gsap.fromTo(
        [".hero-sub", ".cta-btn"],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          delay: 1.2
        }
      );
    }, containerRef);

    return () => {
      alive = false;
      ctx.revert();
    };
  }, []);

  // Helper to split text into words and chars for GSAP
  const renderSplitText = (text: string, className: string = "") => {
    return text.split(" ").map((word, wIdx) => (
      <span key={wIdx} className={`word inline-block ${className}`} style={{ whiteSpace: "nowrap" }}>
        {word.split("").map((char, cIdx) => (
          <span key={cIdx} className="char inline-block">{char}</span>
        ))}
        <span className="inline-block">&nbsp;</span>
      </span>
    ));
  };

  return (
    <div ref={containerRef} className="hero-title-wrapper relative z-10 text-center select-none flex flex-col items-center">
      <p className="overline-text text-[11px] tracking-[0.35em] text-cyan-400 uppercase mb-6 opacity-0 font-mono">
        // live sky tracking
      </p>
      
      <h1 className="hero-heading text-[clamp(2.5rem,6vw,6rem)] font-bold leading-none tracking-tight text-white mb-2" style={{ perspective: "400px" }}>
        <div className="line-1 overflow-hidden">
          {renderSplitText("Track the")}
        </div>
        <div className="line-2 accent-line text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 my-1 overflow-hidden py-2">
          {renderSplitText("Cosmos")}
        </div>
        <div className="line-3 overflow-hidden">
          {renderSplitText("in real time")}
        </div>
      </h1>
      
      <p className="hero-sub mt-6 text-[1.1rem] text-white/50 tracking-wide opacity-0 max-w-lg mx-auto">
        ISS · Satellites · Planets · Stars — rendered live for your location
      </p>
      
      <div className="cta-btn mt-10 px-8 py-3 rounded-full border border-cyan-500/40 text-cyan-300 text-[11px] font-mono tracking-widest uppercase opacity-0 mx-auto inline-flex items-center bg-cyan-500/5 backdrop-blur-sm">
        Select target on orbital array
        <span className="cta-arrow ml-2 mt-0.5 animate-bounce">↓</span>
      </div>
    </div>
  );
};

export default HeroTitle;
