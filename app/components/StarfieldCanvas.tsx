"use client";

/* 
 * GSAP Starfield Canvas Particle System
 * Includes center explosion entry, mouse parallax, and idle twinkling.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Star {
  // final resting position (post-animation)
  finalX: number;
  finalY: number;
  // entry start position (clustered near center)
  startX: number;
  startY: number;
  radius: number;
  finalOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  layer: 1 | 2 | 3;
}

const LAYER_CONFIG = {
  1: { count: 160, minR: 0.5, maxR: 1, minOp: 0.2, maxOp: 0.45, speed: 0.08, parallax: 0.008 },
  2: { count: 90, minR: 1, maxR: 1.6, minOp: 0.45, maxOp: 0.7, speed: 0.22, parallax: 0.018 },
  3: { count: 40, minR: 1.6, maxR: 2.4, minOp: 0.7, maxOp: 1.0, speed: 0.4, parallax: 0.032 }
};

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

interface StarfieldCanvasProps {
  hoveringBackground?: boolean;
}

export const StarfieldCanvas: React.FC<StarfieldCanvasProps> = ({ hoveringBackground }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animProgressRef = useRef({ progress: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const rafRef = useRef<number>(0);

  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    const cx = width / 2;
    const cy = height / 2;

    ([1, 2, 3] as const).forEach(layer => {
      const config = LAYER_CONFIG[layer];
      for (let i = 0; i < config.count; i++) {
        stars.push({
          finalX: Math.random() * width,
          finalY: Math.random() * height,
          startX: cx + (Math.random() * 120 - 60),
          startY: cy + (Math.random() * 120 - 60),
          radius: config.minR + Math.random() * (config.maxR - config.minR),
          finalOpacity: config.minOp + Math.random() * (config.maxOp - config.minOp),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.012 + Math.random() * (0.035 - 0.012),
          layer
        });
      }
    });
    starsRef.current = stars;
  };

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setDimensions = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      initStars(width, height);
    };

    setDimensions();

    const startEntryAnimation = () => {
      if (tweenRef.current) tweenRef.current.kill();
      animProgressRef.current.progress = 0;
      tweenRef.current = gsap.to(animProgressRef.current, {
        progress: 1,
        duration: 2.4,
        ease: "power3.out"
      });
    };

    const handleResize = () => {
      setDimensions();
      if (animProgressRef.current.progress < 1) {
        startEntryAnimation();
      }
    };
    
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    startEntryAnimation();

    const render = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      
      const { progress } = animProgressRef.current;
      const mx = mouseRef.current.x - width / 2;
      const my = mouseRef.current.y - height / 2;

      // --- GOD-TIER VOLUMETRIC NEBULA EFFECT ---
      if (progress > 0.5) { // Fade in nebula as stars explode outward
        const nebulaOpacity = (progress - 0.5) * 2;
        ctx.globalCompositeOperation = 'screen';
        
        const drawNebula = (cx: number, cy: number, r: number, color1: string, color2: string) => {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, color1);
          grad.addColorStop(1, color2);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };

        const t = Date.now() / 2000; // Slow time scale
        
        // Nebula 1: Deep Cyan Core
        const n1x = width * 0.35 + Math.sin(t * 0.5) * 200 - mx * 0.04;
        const n1y = height * 0.4 + Math.cos(t * 0.4) * 150 - my * 0.04;
        drawNebula(n1x, n1y, width * 0.5, `rgba(0, 243, 255, ${0.12 * nebulaOpacity})`, 'rgba(0, 243, 255, 0)');

        // Nebula 2: Cyber Pink / Magenta Cloud
        const n2x = width * 0.65 + Math.cos(t * 0.3) * 250 - mx * 0.02;
        const n2y = height * 0.6 + Math.sin(t * 0.6) * 200 - my * 0.02;
        drawNebula(n2x, n2y, width * 0.6, `rgba(255, 0, 127, ${0.08 * nebulaOpacity})`, 'rgba(255, 0, 127, 0)');

        // Nebula 3: Deep Space Purple
        const n3x = width * 0.5 + Math.sin(t * 0.2) * 300 - mx * 0.01;
        const n3y = height * 0.5 + Math.cos(t * 0.3) * 300 - my * 0.01;
        drawNebula(n3x, n3y, width * 0.8, `rgba(120, 0, 255, ${0.05 * nebulaOpacity})`, 'rgba(120, 0, 255, 0)');
      }

      ctx.globalCompositeOperation = 'source-over'; // Reset for stars

      starsRef.current.forEach(star => {
        const config = LAYER_CONFIG[star.layer];
        
        // Idle drift
        if (progress === 1) {
          star.finalY += config.speed;
          if (star.finalY > height) {
            star.finalY = 0;
            star.finalX = Math.random() * width;
          }
        }

        const currentX = lerp(star.startX, star.finalX, progress);
        const currentY = lerp(star.startY, star.finalY, progress);
        const currentRadius = lerp(0, star.radius, progress);
        
        star.twinklePhase += star.twinkleSpeed;
        const currentOpacity = lerp(0, star.finalOpacity * (0.55 + 0.45 * Math.sin(star.twinklePhase)), progress);

        // Parallax
        let pOffsetX = mx * config.parallax;
        let pOffsetY = my * config.parallax;
        
        // Clamp parallax
        pOffsetX = Math.max(-40, Math.min(40, pOffsetX));
        pOffsetY = Math.max(-40, Math.min(40, pOffsetY));

        ctx.beginPath();
        ctx.arc(currentX + pOffsetX, currentY + pOffsetY, currentRadius, 0, Math.PI * 2);
        
        // Draw Stars with slight glowing tint based on layer
        const starColor = star.layer === 1 ? '200, 255, 255' : star.layer === 2 ? '255, 220, 255' : '220, 220, 255';
        ctx.fillStyle = `rgba(${starColor}, ${currentOpacity})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (tweenRef.current) tweenRef.current.kill();
      cancelAnimationFrame(rafRef.current);
    };
  }, { scope: canvasRef });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default StarfieldCanvas;
