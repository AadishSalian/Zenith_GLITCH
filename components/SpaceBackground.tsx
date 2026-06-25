"use client";

import React, { useEffect, useRef } from "react";

interface SpaceBackgroundProps {
  starCount?: number;
  streakCount?: number;
  blobCount?: number;
}

const COLORS = ["#00f5ff", "#ff00cc", "#00ffcc"];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

class Star {
  x: number;
  y: number;
  baseRadius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.baseRadius = 0.3 + Math.random() * 1.2; // 0.3 - 1.5px
    this.baseOpacity = 0.2 + Math.random() * 0.8; // 0.2 - 1.0
    this.twinkleSpeed = 0.02 + Math.random() * 0.03;
    this.twinkleOffset = Math.random() * Math.PI * 2;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const opacity =
      this.baseOpacity +
      Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, opacity))})`;
    ctx.fill();
  }
}

class MeteorStreak {
  x: number = 0;
  y: number = 0;
  length: number = 0;
  speed: number = 0;
  color: string = "";
  lineWidth: number = 0;
  dx: number = 0;
  dy: number = 0;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.reset(true);
  }

  reset(initial = false) {
    // Increased length significantly to match the long glowing beams in the screenshot
    this.length = 400 + Math.random() * 500; 
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.lineWidth = 4 + Math.random() * 3; // 4 - 7px for a very strong core

    const angle = 40 * (Math.PI / 180); // ~40°
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);

    const diagonal = Math.sqrt(
      this.width * this.width + this.height * this.height
    );
    // Slowed down slightly so the long beams are graceful
    const durationFrames = 120 + Math.random() * 120; 
    this.speed = (diagonal / durationFrames) * 1.5;

    const spawnMargin = this.length;
    if (Math.random() > 0.5) {
      this.x = Math.random() * (this.width + spawnMargin);
      this.y = -spawnMargin;
    } else {
      this.x = -spawnMargin;
      this.y = Math.random() * (this.height + spawnMargin);
    }

    if (initial) {
      const advanceFrames = Math.random() * durationFrames;
      this.x += this.dx * this.speed * advanceFrames;
      this.y += this.dy * this.speed * advanceFrames;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;

    const tailX = this.x - this.dx * this.length;
    const tailY = this.y - this.dy * this.length;

    const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    const transparentColor = hexToRgba(this.color, 0);
    gradient.addColorStop(0, transparentColor);
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, transparentColor);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.lineWidth;
    
    // Add strong glowing effect
    ctx.shadowBlur = 25;
    ctx.shadowColor = this.color;
    
    ctx.stroke();
    ctx.restore();

    if (this.x > this.width + this.length || this.y > this.height + this.length) {
      this.reset();
    }
  }
}

export default function SpaceBackground({
  starCount = 180,
  streakCount = 8,
  blobCount = 6,
}: SpaceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [blobs, setBlobs] = React.useState<any[]>([]);

  useEffect(() => {
    setBlobs(
      Array.from({ length: blobCount }).map(() => ({
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 200 + Math.random() * 300,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        endX: Math.random() * 100,
        endY: Math.random() * 100,
        duration: 15 + Math.random() * 15,
        opacity: 0.15 + Math.random() * 0.15, // much higher opacity so they show up
      }))
    );
  }, [blobCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let stars: Star[] = [];
    let streaks: MeteorStreak[] = [];

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      stars = Array.from({ length: starCount }).map(
        () => new Star(width, height)
      );
      streaks = Array.from({ length: streakCount }).map(
        () => new MeteorStreak(width, height)
      );
    };

    init();

    const resizeObserver = new ResizeObserver(() => {
      if (window.innerWidth !== width || window.innerHeight !== height) {
        init();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => star.draw(ctx, time));
      streaks.forEach((streak) => streak.draw(ctx, width, height));

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, streakCount]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "#020205",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
      {blobs.map((blob, i) => (
        <React.Fragment key={i}>
          <style>{`
            @keyframes floatBlob${i} {
              0% { transform: translate(${blob.startX}vw, ${blob.startY}vh) scale(1); }
              33% { transform: translate(${blob.endX}vw, ${blob.startY}vh) scale(1.1); }
              66% { transform: translate(${blob.endX}vw, ${blob.endY}vh) scale(0.9); }
              100% { transform: translate(${blob.startX}vw, ${blob.startY}vh) scale(1); }
            }
          `}</style>
          <div
            style={{
              position: "absolute",
              top: "-150px",
              left: "-150px",
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              borderRadius: "50%",
              backgroundColor: blob.color,
              filter: "blur(80px)",
              opacity: blob.opacity,
              animation: `floatBlob${i} ${blob.duration}s infinite ease-in-out`,
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
