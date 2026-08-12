"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "triangle";
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function BirthdayCelebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return; // Skip animation entirely
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = [
      "#f43f5e", // Rose
      "#ec4899", // Pink
      "#d946ef", // Fuchsia
      "#8b5cf6", // Violet
      "#3b82f6", // Blue
      "#06b6d4", // Cyan
      "#10b981", // Emerald
      "#eab308", // Yellow
      "#f97316"  // Orange
    ];

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // 2. Initialize particles
    const createParticle = (x: number, y: number): Particle => {
      return {
        x,
        y,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as any,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: -Math.random() * 10 - 5, // Shoot upwards initially
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      };
    };

    // Initial burst
    const burstCount = 150;
    for (let i = 0; i < burstCount; i++) {
      const side = Math.random() > 0.5;
      const startX = side ? 0 : window.innerWidth;
      const startY = window.innerHeight * 0.85;
      const p = createParticle(startX, startY);
      p.velocityX = side ? Math.random() * 12 + 4 : -Math.random() * 12 - 4;
      p.velocityY = -Math.random() * 15 - 10;
      particles.push(p);
    }

    // 3. Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.velocityY += 0.25; // Gravity
        p.velocityX *= 0.99; // Air resistance
        p.rotation += p.rotationSpeed;
        
        if (p.y > canvas.height * 0.5) {
          p.opacity -= 0.015;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        if (p.opacity <= 0 || p.y > canvas.height) {
          particles.splice(i, 1);
        }
      }

      if (particles.length < 30 && Math.random() < 0.2) {
        particles.push(createParticle(Math.random() * canvas.width, -20));
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    const cleanupTimeout = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
    }, 5500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(cleanupTimeout);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 bg-transparent"
    />
  );
}
