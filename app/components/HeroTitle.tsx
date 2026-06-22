"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText, ScrollTrigger);

export const HeroTitle: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let split: SplitText | null = null;

    const ctx = gsap.context(() => {
      if (!alive) return;

      // Phase 1 — Overline fade in (t=0)
      gsap.fromTo(
        ".overline-text",
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      // Phase 2 — SplitText letter burst (t=0.3s delay)
      split = new SplitText(".hero-heading", { type: "chars,words,lines" });
      
      gsap.fromTo(
        split.chars,
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

      // Phase 3 — Subtitle and CTA fade in (after heading completes)
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
      if (split) split.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-title-wrapper relative z-10 text-center select-none">
      <p className="overline-text text-[11px] tracking-[0.35em] text-cyan-400 uppercase mb-6 opacity-0">
        // live sky tracking
      </p>
      
      <h1 className="hero-heading text-[clamp(3rem,8vw,7rem)] font-bold leading-none tracking-tight text-white">
        <span className="line-1">Track the</span>{" "}
        <span className="line-2 accent-line block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500">
          <span className="word-cosmos">Cosmos</span>
        </span>{" "}
        <span className="line-3">in real time</span>
      </h1>
      
      <p className="hero-sub mt-6 text-[1.1rem] text-white/50 tracking-wide opacity-0">
        ISS · Satellites · Planets · Stars — rendered live for your location
      </p>
      
      <button className="cta-btn mt-10 px-8 py-3 rounded-full border border-cyan-500/40 text-cyan-300 text-sm tracking-widest hover:bg-cyan-500/10 transition-all duration-300 opacity-0">
        Pick your location
        <span className="cta-arrow ml-2">→</span>
      </button>
    </div>
  );
};

export default HeroTitle;
