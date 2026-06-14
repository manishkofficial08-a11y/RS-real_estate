import { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  shimmerPhase: number;
}

export default function ParticleOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx!.scale(dpr, dpr);
    }

    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    const canvasWidth = () => canvas?.parentElement?.clientWidth || window.innerWidth;
    const canvasHeight = () => canvas?.parentElement?.clientHeight || window.innerHeight;

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvasWidth(),
        y: Math.random() * canvasHeight(),
        size: Math.random() * 1 + 0.5,
        speedY: -(Math.random() * 0.2 + 0.05),
        opacity: Math.random() * 0.15 + 0.03,
        shimmerPhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    let isVisible = true;

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvasWidth();
      const h = canvasHeight();

      ctx.clearRect(0, 0, w, h);

      if (isVisible) {
        for (const p of particlesRef.current) {
          p.y += p.speedY;
          p.shimmerPhase += 0.01;
          const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.shimmerPhase));

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 237, 230, ${alpha})`;
          ctx.fill();

          if (p.y < -5) {
            p.y = h + 5;
            p.x = Math.random() * w;
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 240,
        width: 'calc(100% - 240px)',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    />
  );
}

