"use client";

import React, { useEffect, useRef } from "react";

interface StarfieldCanvasProps {
  hoveringBackground: boolean;
}

class ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  thickness: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.length = Math.random() * 80 + 80; // 80 to 160 length
    this.speed = Math.random() * 10 + 15; // 15 to 25 speed
    this.angle = (Math.PI / 180) * 45; // 45 degrees
    this.life = 1.0;
    this.maxLife = Math.random() * 30 + 40; // frames
    this.color = color;
    this.thickness = Math.random() * 1.5 + 2.0; // 2.0 to 3.5 thickness
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.life -= 1 / this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glowing tail using gradient
    const grad = ctx.createLinearGradient(0, 0, -this.length, 0);
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    
    // Add neon glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    ctx.globalAlpha = Math.max(0, this.life);

    ctx.fillRect(-this.length, -this.thickness / 2, this.length, this.thickness);
    ctx.restore();
  }
}

class AmbientStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  alphaChange: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 1.2 + 0.3;
    this.alpha = Math.random();
    this.alphaChange = (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1);
  }

  update() {
    this.alpha += this.alphaChange;
    if (this.alpha <= 0) {
      this.alpha = 0;
      this.alphaChange *= -1;
    } else if (this.alpha >= 1) {
      this.alpha = 1;
      this.alphaChange *= -1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7; // max opacity
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const StarfieldCanvas: React.FC<StarfieldCanvasProps> = ({ hoveringBackground }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveringRef = useRef(hoveringBackground);

  useEffect(() => {
    hoveringRef.current = hoveringBackground;
  }, [hoveringBackground]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);

    const ambientStars: AmbientStar[] = [];
    const numAmbientStars = Math.floor((width * height) / 8000); // Responsive count
    for (let i = 0; i < numAmbientStars; i++) {
      ambientStars.push(new AmbientStar(width, height));
    }

    const shootingStars: ShootingStar[] = [];
    const colors = ["#00f3ff", "#ff007f", "#a78bfa"];

    // Spawn ambient shooting stars occasionally
    const spawnAmbientShootingStar = () => {
      if (Math.random() < 0.015) { // 1.5% chance per frame
        const x = Math.random() * width;
        const y = Math.random() * height * 0.7; // spawn mostly upper 70%
        const color = colors[Math.floor(Math.random() * colors.length)];
        shootingStars.push(new ShootingStar(x, y, color));
      }
    };

    let lastSpawnTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      // Only spawn when mouse is over the empty outer background
      if (!hoveringRef.current) return;
      const now = Date.now();
      if (now - lastSpawnTime > 30) { // Highly responsive generation
        lastSpawnTime = now;
        const color = colors[Math.floor(Math.random() * colors.length)];
        shootingStars.push(new ShootingStar(e.clientX, e.clientY, color));
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      // Fading background clear for trailing effects (using destination-out preserves CSS backgrounds beneath)
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      ambientStars.forEach((star) => {
        star.update();
        star.draw(ctx);
      });

      spawnAmbientShootingStar();

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.update();
        star.draw(ctx);
        if (star.life <= 0 || star.x > width + 200 || star.y > height + 200) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};
