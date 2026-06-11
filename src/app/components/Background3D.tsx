import { useEffect, useRef } from "react";

interface Background3DProps {
  darkMode: boolean;
}

export function Background3D({ darkMode }: Background3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!darkMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;

      // Aurora gradient layers
      const aurora1 = ctx.createRadialGradient(
        canvas.width * (0.3 + 0.2 * Math.sin(t * 0.7)), canvas.height * 0.2,
        0,
        canvas.width * (0.3 + 0.2 * Math.sin(t * 0.7)), canvas.height * 0.2,
        canvas.width * 0.5
      );
      aurora1.addColorStop(0, "rgba(99,102,241,0.06)");
      aurora1.addColorStop(1, "transparent");

      const aurora2 = ctx.createRadialGradient(
        canvas.width * (0.7 + 0.15 * Math.cos(t * 0.5)), canvas.height * 0.6,
        0,
        canvas.width * (0.7 + 0.15 * Math.cos(t * 0.5)), canvas.height * 0.6,
        canvas.width * 0.4
      );
      aurora2.addColorStop(0, "rgba(139,92,246,0.05)");
      aurora2.addColorStop(1, "transparent");

      const aurora3 = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * (0.4 + 0.1 * Math.sin(t * 0.3)),
        0,
        canvas.width * 0.5, canvas.height * (0.4 + 0.1 * Math.sin(t * 0.3)),
        canvas.width * 0.35
      );
      aurora3.addColorStop(0, "rgba(6,182,212,0.04)");
      aurora3.addColorStop(1, "transparent");

      ctx.fillStyle = aurora1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = aurora2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = aurora3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(99,102,241,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [darkMode]);

  if (!darkMode) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
