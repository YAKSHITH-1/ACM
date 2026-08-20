"use client";
import React, { useEffect, useRef } from "react";

export interface AnimatedDotsProps {
  dotRadius?: number;
  dotSpacing?: number;
  speedRange?: [number, number];
  backgroundColor?: string;
  opacity?: number;
  fullScreen?: boolean;
  className?: string;
  colors?: [string, number, number, number][];
}

export const RICH_PALETTE: [string, number, number, number][] = [
  ["blue", 2, 132, 199],      // Ocean Blue (#0284c7)
  ["emerald", 16, 185, 129],  // Emerald Green (#10b981)
  ["crimson", 225, 29, 72],   // Crimson Rose (#e11d48)
  ["orange", 234, 88, 12],    // Vivid Orange (#ea580c)
  ["violet", 124, 58, 237],   // Royal Violet (#7c3aed)
  ["teal", 13, 148, 136],     // Deep Teal (#0d9488)
  ["amber", 217, 119, 6],     // Amber Gold (#d97706)
  ["indigo", 79, 70, 229],    // Electric Indigo (#4f46e5)
  ["pink", 219, 39, 119],     // Deep Pink (#db2777)
  ["lime", 101, 163, 13],     // Lime Green (#65a30d)
  ["cyan", 6, 182, 212],      // Bright Cyan (#06b6d4)
  ["darkamber", 180, 83, 9],  // Dark Amber (#b45309)
  ["cobalt", 37, 99, 235],    // Cobalt Blue (#2563eb)
  ["purple", 147, 51, 234],   // Purple (#9333ea)
  ["goldenrod", 202, 138, 4], // Goldenrod (#ca8a04)
  ["flamingo", 236, 72, 153], // Flamingo Pink (#ec4899)
];

export const AnimatedDots: React.FC<AnimatedDotsProps> = ({
  dotRadius = 7.5,
  dotSpacing = 1.5,
  speedRange = [0.6, 2.0],
  backgroundColor = "transparent",
  opacity = 0.72,
  fullScreen = true,
  className = "",
  colors = RICH_PALETTE,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const stripesRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = fullScreen ? window.innerWidth : canvas.offsetWidth;
    let height = fullScreen ? window.innerHeight : canvas.offsetHeight;

    class Stripe {
      i: number;
      radius: number;
      colWidth: number;
      x: number;
      minReach: number;
      maxReach: number;
      speed: number;
      colorIdx: number;
      currentLength: number;
      state: "growing" | "retracting";
      pauseTicks: number;
      alpha: number;

      constructor(i: number, totalCols: number) {
        this.i = i;
        this.radius = dotRadius;
        this.colWidth = this.radius * 2 + dotSpacing;
        this.x = (i + 0.5) * this.colWidth;
        this.minReach =
          110 + Math.sin(i * 0.35) * 55 + (i % 3) * 30 + Math.random() * 40;
        this.maxReach = Math.min(
          height * 0.96,
          height * (0.62 + Math.random() * 0.34)
        );
        this.speed =
          Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];
        this.colorIdx = Math.floor(Math.random() * colors.length);
        this.currentLength =
          this.minReach + Math.random() * (this.maxReach - this.minReach);
        this.state = Math.random() > 0.5 ? "growing" : "retracting";
        this.pauseTicks = Math.floor(Math.random() * 80 + 20);
        this.alpha = opacity * (0.85 + Math.random() * 0.25);
      }

      update() {
        if (this.state === "growing") {
          this.currentLength += this.speed;
          if (this.currentLength >= this.maxReach) {
            this.currentLength = this.maxReach;
            if (this.pauseTicks > 0) {
              this.pauseTicks--;
            } else {
              this.state = "retracting";
              this.pauseTicks = Math.floor(Math.random() * 60 + 20);
            }
          }
        } else if (this.state === "retracting") {
          this.currentLength -= this.speed * 0.75;
          if (this.currentLength <= this.minReach) {
            this.currentLength = this.minReach;
            if (this.pauseTicks > 0) {
              this.pauseTicks--;
            } else {
              this.colorIdx = Math.floor(Math.random() * colors.length);
              this.maxReach = Math.min(
                height * 0.96,
                height * (0.58 + Math.random() * 0.38)
              );
              this.speed =
                Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];
              this.state = "growing";
              this.pauseTicks = Math.floor(Math.random() * 80 + 20);
            }
          }
        }
      }

      draw(renderCtx: CanvasRenderingContext2D) {
        const tipY = Math.max(
          this.radius,
          Math.min(this.currentLength, height + this.radius)
        );
        const [name, r, g, b] = colors[this.colorIdx];

        renderCtx.save();
        renderCtx.globalAlpha = this.alpha;

        const grad = renderCtx.createLinearGradient(this.x, 0, this.x, tipY);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.98)`);
        grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.90)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.80)`);
        renderCtx.fillStyle = grad;

        renderCtx.beginPath();
        renderCtx.moveTo(this.x - this.radius, 0);
        renderCtx.lineTo(this.x - this.radius, tipY);
        renderCtx.arc(this.x, tipY, this.radius, Math.PI, 0, true);
        renderCtx.lineTo(this.x + this.radius, 0);
        renderCtx.closePath();
        renderCtx.fill();

        renderCtx.restore();
      }
    }

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = fullScreen ? window.innerWidth : canvas.offsetWidth;
      height = fullScreen ? window.innerHeight : canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      createStripes();
    };

    const createStripes = () => {
      stripesRef.current = [];
      const colWidth = dotRadius * 2 + dotSpacing;
      const cols = Math.ceil(width / colWidth);
      for (let i = 0; i < cols; i++) {
        stripesRef.current.push(new Stripe(i, cols));
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (backgroundColor && backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      for (const stripe of stripesRef.current) {
        stripe.update();
        stripe.draw(ctx);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    dotRadius,
    dotSpacing,
    speedRange,
    backgroundColor,
    opacity,
    fullScreen,
    colors,
  ]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${
        fullScreen ? "w-screen h-screen" : "w-full h-full"
      } ${className}`}
      style={{
        background:
          "linear-gradient(180deg, #e4e9f0 0%, #edf2f7 45%, #dfe6ee 100%)",
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default AnimatedDots;
