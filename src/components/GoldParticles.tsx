import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDir: number;
  hueShift: number;
}

export function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animId = 0;
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999 };

    const particles: Particle[] = [];
    const particleCount = prefersReducedMotion ? 28 : 68;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * (width || 1200),
          y: Math.random() * (height || 700),
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.15 - Math.random() * 0.4,
          radius: 1.1 + Math.random() * 2.4,
          alpha: 0.2 + Math.random() * 0.65,
          alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.005),
          hueShift: Math.random() * 14,
        });
      }
    };

    resize();
    initParticles();

    const handleResize = () => {
      resize();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += p.alphaDir;
          if (p.alpha >= 0.85 || p.alpha <= 0.15) {
            p.alphaDir *= -1;
          }

          // Subtle mouse repulsion/swirl
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && dist > 1) {
            const force = (130 - dist) / 130;
            p.x += (dx / dist) * force * 0.85;
            p.y += (dy / dist) * force * 0.85;
          }

          if (p.y < -12) {
            p.y = height + 12;
            p.x = Math.random() * width;
          }
          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;
        }

        // Outer soft gold glow
        const grad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius * 4.5
        );
        const r = 212 + p.hueShift;
        const g = 175 + p.hueShift * 1.2;
        const b = 55;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha})`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.32})`);
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp core spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 240, 185, ${Math.min(1, p.alpha + 0.15)})`;
        ctx.fill();

        // Subtle constellation threads between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cx = p.x - q.x;
          const cy = p.y - q.y;
          const cdist = cx * cx + cy * cy;
          if (cdist < 11000) {
            const lineAlpha = (1 - cdist / 11000) * 0.14;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
