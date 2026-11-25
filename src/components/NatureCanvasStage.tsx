import { useEffect, useRef } from 'react';

export type NatureSceneId =
  | 'mountain-river'
  | 'sunset-lake'
  | 'rainy-pine'
  | 'aurora-peaks'
  | 'sakura-breeze'
  | 'starlit-meadow'
  | 'ocean-moonrise'
  | 'golden-wheat'
  | 'bamboo-rain'
  | 'bioluminescent-cove';

export const NATURE_LOOP_SECONDS = 75;

interface NatureCanvasStageProps {
  scene: NatureSceneId;
  onTickSecond?: (sec: number) => void;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

interface Bird {
  xOffset: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface Ripple {
  x: number;
  y: number;
  phase: number;
  maxR: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  phase: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}

export function NatureCanvasStage({
  scene,
  onTickSecond,
}: NatureCanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<NatureSceneId>(scene);
  sceneRef.current = scene;
  const onTickRef = useRef(onTickSecond);
  onTickRef.current = onTickSecond;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clouds: Cloud[] = Array.from({ length: 9 }, (_, i) => ({
      x: i / 9,
      y: 0.08 + (i % 4) * 0.055,
      scale: 0.7 + (i % 3) * 0.38,
      speed: 0.0045 + (i % 4) * 0.0022,
      alpha: 0.16 + (i % 3) * 0.07,
    }));

    const birds: Bird[] = Array.from({ length: 7 }, (_, i) => ({
      xOffset: (i * 0.14) % 1,
      y: 0.14 + (i % 4) * 0.045,
      size: 4 + (i % 3) * 2,
      speed: 0.015 + (i % 3) * 0.006,
      phase: i * 1.1,
    }));

    const particles: Particle[] = Array.from({ length: 72 }, (_, i) => ({
      x: (i * 0.037) % 1,
      y: (i * 0.073) % 1,
      vx: -0.008 + (i % 5) * 0.003,
      vy: 0.004 + (i % 6) * 0.002,
      size: 1.4 + (i % 3) * 1.1,
      phase: i * 0.75,
    }));

    const ripples: Ripple[] = Array.from({ length: 14 }, (_, i) => ({
      x: 0.15 + ((i * 0.19) % 0.7),
      y: 0.66 + ((i * 0.13) % 0.28),
      phase: (i / 14) % 1,
      maxR: 16 + (i % 4) * 8,
    }));

    const stars: Star[] = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 0.6180339887) % 1),
      y: ((i * 0.381966) % 0.58),
      size: 0.6 + (i % 4) * 0.45,
      twinkleSpeed: 1.2 + (i % 5) * 0.6,
      phase: i * 0.9,
    }));

    const startTime = performance.now();
    let lastReportedSecond = -1;
    let rafId = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const drawMountainLayer = (
      w: number,
      h: number,
      baseY: number,
      amp: number,
      freq: number,
      seed: number,
      fillStyle: string | CanvasGradient,
      snowCapColor?: string
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      const steps = 48;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const px = (i / steps) * w;
        const t = i / steps;
        const ridge =
          Math.sin(t * Math.PI * freq + seed) * amp +
          Math.sin(t * Math.PI * freq * 2.3 + seed * 1.7) * (amp * 0.42) +
          Math.cos(t * Math.PI * freq * 4.1 + seed * 0.6) * (amp * 0.16);
        const py = baseY - Math.abs(ridge);
        pts.push({ x: px, y: py });
        ctx.lineTo(px, py);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();

      if (snowCapColor) {
        ctx.save();
        ctx.beginPath();
        for (let i = 1; i < pts.length - 1; i++) {
          if (pts[i].y < pts[i - 1].y && pts[i].y <= pts[i + 1].y) {
            const peak = pts[i];
            const snowDepth = amp * 0.36;
            ctx.moveTo(peak.x, peak.y);
            ctx.lineTo(peak.x - w * 0.036, peak.y + snowDepth);
            ctx.lineTo(peak.x - w * 0.01, peak.y + snowDepth * 0.72);
            ctx.lineTo(peak.x + w * 0.012, peak.y + snowDepth * 0.9);
            ctx.lineTo(peak.x + w * 0.038, peak.y + snowDepth * 1.05);
            ctx.closePath();
          }
        }
        ctx.fillStyle = snowCapColor;
        ctx.fill();
        ctx.restore();
      }
    };

    const drawPineTree = (
      x: number,
      y: number,
      treeH: number,
      sway: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      const tiers = 4;
      for (let i = 0; i < tiers; i++) {
        const ratio = i / tiers;
        const tierY = -treeH * (0.28 + ratio * 0.56);
        const halfW = treeH * (0.26 - ratio * 0.048);
        const tipX = sway * (0.35 + ratio * 0.75);
        ctx.beginPath();
        ctx.moveTo(tipX, tierY - treeH * 0.28);
        ctx.lineTo(-halfW + sway * ratio * 0.4, tierY);
        ctx.lineTo(halfW + sway * ratio * 0.4, tierY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawStars = (
      w: number,
      h: number,
      elapsedSec: number,
      maxAlpha: number
    ) => {
      stars.forEach((s) => {
        const twinkle =
          (Math.sin(elapsedSec * s.twinkleSpeed + s.phase) + 1) * 0.5;
        ctx.fillStyle = `rgba(235, 244, 255, ${(0.25 + twinkle * 0.75) * maxAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const renderFrame = (now: number) => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 900;
      const h = parent ? parent.clientHeight : 600;
      if (w <= 0 || h <= 0) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const elapsedSec = ((now - startTime) / 1000) % NATURE_LOOP_SECONDS;
      const wholeSec = Math.floor(elapsedSec);
      if (wholeSec !== lastReportedSecond) {
        lastReportedSecond = wholeSec;
        onTickRef.current?.(wholeSec);
      }

      const cyclePhase = (elapsedSec / NATURE_LOOP_SECONDS) * Math.PI * 2;
      const warmWave = (Math.sin(cyclePhase - Math.PI / 2) + 1) / 2;
      const activeScene = sceneRef.current;

      // 1. SKY GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
      if (activeScene === 'mountain-river') {
        skyGrad.addColorStop(0, lerpColor([24, 56, 98], [46, 84, 128], warmWave));
        skyGrad.addColorStop(
          0.55,
          lerpColor([82, 134, 174], [154, 176, 182], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([196, 214, 210], [244, 210, 158], warmWave)
        );
      } else if (activeScene === 'sunset-lake') {
        skyGrad.addColorStop(0, lerpColor([25, 22, 58], [44, 28, 72], warmWave));
        skyGrad.addColorStop(
          0.5,
          lerpColor([118, 56, 88], [164, 72, 92], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([236, 138, 86], [248, 178, 108], warmWave)
        );
      } else if (activeScene === 'rainy-pine') {
        skyGrad.addColorStop(0, lerpColor([8, 14, 30], [14, 24, 48], warmWave));
        skyGrad.addColorStop(0.6, lerpColor([18, 34, 58], [26, 48, 74], warmWave));
        skyGrad.addColorStop(1, lerpColor([34, 62, 82], [44, 76, 96], warmWave));
      } else if (activeScene === 'aurora-peaks') {
        skyGrad.addColorStop(0, lerpColor([5, 10, 26], [8, 16, 38], warmWave));
        skyGrad.addColorStop(0.6, lerpColor([10, 28, 46], [16, 40, 62], warmWave));
        skyGrad.addColorStop(1, lerpColor([18, 52, 66], [26, 66, 78], warmWave));
      } else if (activeScene === 'sakura-breeze') {
        skyGrad.addColorStop(
          0,
          lerpColor([72, 88, 134], [98, 104, 148], warmWave)
        );
        skyGrad.addColorStop(
          0.55,
          lerpColor([204, 152, 172], [226, 166, 176], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([252, 214, 206], [255, 228, 202], warmWave)
        );
      } else if (activeScene === 'starlit-meadow') {
        skyGrad.addColorStop(0, lerpColor([4, 7, 20], [8, 12, 32], warmWave));
        skyGrad.addColorStop(0.6, lerpColor([12, 20, 48], [18, 28, 62], warmWave));
        skyGrad.addColorStop(1, lerpColor([22, 38, 72], [30, 48, 84], warmWave));
      } else if (activeScene === 'golden-wheat') {
        skyGrad.addColorStop(0, lerpColor([58, 42, 68], [88, 56, 74], warmWave));
        skyGrad.addColorStop(
          0.52,
          lerpColor([178, 108, 66], [212, 134, 72], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([248, 198, 114], [255, 222, 148], warmWave)
        );
      } else if (activeScene === 'bamboo-rain') {
        skyGrad.addColorStop(0, lerpColor([10, 28, 26], [16, 42, 38], warmWave));
        skyGrad.addColorStop(
          0.55,
          lerpColor([28, 66, 56], [42, 86, 72], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([72, 122, 104], [96, 146, 124], warmWave)
        );
      } else if (activeScene === 'bioluminescent-cove') {
        skyGrad.addColorStop(0, lerpColor([3, 10, 24], [6, 16, 36], warmWave));
        skyGrad.addColorStop(
          0.58,
          lerpColor([8, 28, 52], [14, 42, 70], warmWave)
        );
        skyGrad.addColorStop(
          1,
          lerpColor([16, 62, 82], [24, 80, 98], warmWave)
        );
      } else {
        // ocean-moonrise
        skyGrad.addColorStop(0, lerpColor([9, 16, 36], [14, 24, 52], warmWave));
        skyGrad.addColorStop(0.55, lerpColor([22, 42, 74], [32, 56, 92], warmWave));
        skyGrad.addColorStop(1, lerpColor([58, 88, 118], [78, 108, 136], warmWave));
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars & Milky Way / Shooting stars for night skies
      if (
        activeScene === 'aurora-peaks' ||
        activeScene === 'starlit-meadow' ||
        activeScene === 'ocean-moonrise' ||
        activeScene === 'bioluminescent-cove'
      ) {
        drawStars(
          w,
          h,
          elapsedSec,
          activeScene === 'starlit-meadow' ? 0.95 : 0.72
        );
      }

      if (activeScene === 'starlit-meadow') {
        // Soft Milky Way glow ribbon
        ctx.save();
        ctx.translate(w * 0.5, h * 0.28);
        ctx.rotate(-0.32);
        const mwGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.55);
        mwGrad.addColorStop(0, 'rgba(162, 186, 255, 0.14)');
        mwGrad.addColorStop(0.5, 'rgba(130, 152, 230, 0.06)');
        mwGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.scale(1.8, 0.42);
        ctx.fillStyle = mwGrad;
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Occasional gentle shooting star
        const meteorCycle = elapsedSec % 9;
        if (meteorCycle < 1.2) {
          const mp = meteorCycle / 1.2;
          const sx = lerp(w * 0.22, w * 0.58, mp);
          const sy = lerp(h * 0.1, h * 0.34, mp);
          const tailGrad = ctx.createLinearGradient(sx, sy, sx - 70, sy - 38);
          tailGrad.addColorStop(0, `rgba(255, 252, 230, ${(1 - mp) * 0.9})`);
          tailGrad.addColorStop(1, 'rgba(255, 252, 230, 0)');
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 70, sy - 38);
          ctx.stroke();
        }
      }

      // Northern Lights aurora ribbons
      if (activeScene === 'aurora-peaks') {
        for (let band = 0; band < 3; band++) {
          ctx.save();
          ctx.beginPath();
          const baseY = h * (0.2 + band * 0.065);
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= w; x += 24) {
            const nx = x / w;
            const wave =
              Math.sin(nx * 5.2 + elapsedSec * 0.35 + band * 1.4) * 28 +
              Math.cos(nx * 9.1 - elapsedSec * 0.22 + band) * 14;
            ctx.lineTo(x, baseY + wave);
          }
          ctx.lineTo(w, baseY - h * 0.22);
          ctx.lineTo(0, baseY - h * 0.22);
          ctx.closePath();
          const aurGrad = ctx.createLinearGradient(0, baseY - h * 0.22, 0, baseY + 36);
          if (band % 2 === 0) {
            aurGrad.addColorStop(0, 'rgba(45, 212, 191, 0)');
            aurGrad.addColorStop(0.55, 'rgba(52, 211, 153, 0.24)');
            aurGrad.addColorStop(1, 'rgba(110, 231, 183, 0.04)');
          } else {
            aurGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
            aurGrad.addColorStop(0.55, 'rgba(139, 92, 246, 0.20)');
            aurGrad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
          }
          ctx.fillStyle = aurGrad;
          ctx.fill();
          ctx.restore();
        }
      }

      // 2. SUN OR MOON + GLOW
      const celestialX =
        activeScene === 'sunset-lake' ||
        activeScene === 'ocean-moonrise' ||
        activeScene === 'golden-wheat'
          ? w * (0.5 + Math.sin(cyclePhase) * 0.04)
          : activeScene === 'sakura-breeze'
            ? w * 0.28
            : w * (0.74 - Math.sin(cyclePhase * 0.5) * 0.08);
      const celestialY =
        activeScene === 'sunset-lake' || activeScene === 'golden-wheat'
          ? h * (0.42 + warmWave * 0.05)
          : activeScene === 'ocean-moonrise' ||
              activeScene === 'bioluminescent-cove'
            ? h * (0.31 - warmWave * 0.03)
            : activeScene === 'sakura-breeze'
              ? h * 0.24
              : activeScene === 'mountain-river'
                ? h * (0.2 + warmWave * 0.04)
                : h * 0.18;

      if (activeScene !== 'aurora-peaks' && activeScene !== 'bamboo-rain') {
        const glowR =
          activeScene === 'sunset-lake' || activeScene === 'golden-wheat'
            ? w * 0.28
            : activeScene === 'ocean-moonrise'
              ? w * 0.22
              : w * 0.2;
        const sunGlow = ctx.createRadialGradient(
          celestialX,
          celestialY,
          4,
          celestialX,
          celestialY,
          glowR
        );
        if (activeScene === 'mountain-river') {
          sunGlow.addColorStop(0, 'rgba(255, 244, 204, 0.92)');
          sunGlow.addColorStop(0.25, 'rgba(255, 224, 152, 0.35)');
          sunGlow.addColorStop(1, 'rgba(255, 210, 140, 0)');
        } else if (activeScene === 'sunset-lake' || activeScene === 'golden-wheat') {
          sunGlow.addColorStop(0, 'rgba(255, 232, 168, 0.95)');
          sunGlow.addColorStop(0.28, 'rgba(249, 146, 92, 0.42)');
          sunGlow.addColorStop(1, 'rgba(240, 110, 80, 0)');
        } else if (activeScene === 'sakura-breeze') {
          sunGlow.addColorStop(0, 'rgba(255, 244, 234, 0.94)');
          sunGlow.addColorStop(0.28, 'rgba(255, 198, 198, 0.42)');
          sunGlow.addColorStop(1, 'rgba(255, 180, 190, 0)');
        } else if (
          activeScene === 'ocean-moonrise' ||
          activeScene === 'bioluminescent-cove'
        ) {
          sunGlow.addColorStop(0, 'rgba(235, 250, 255, 0.94)');
          sunGlow.addColorStop(0.22, 'rgba(130, 224, 240, 0.32)');
          sunGlow.addColorStop(1, 'rgba(60, 165, 210, 0)');
        } else {
          sunGlow.addColorStop(0, 'rgba(226, 238, 255, 0.85)');
          sunGlow.addColorStop(0.25, 'rgba(150, 190, 235, 0.22)');
          sunGlow.addColorStop(1, 'rgba(100, 145, 200, 0)');
        }
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, glowR, 0, Math.PI * 2);
        ctx.fill();

        if (activeScene === 'ocean-moonrise') {
          ctx.fillStyle = 'rgba(246, 250, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(celestialX, celestialY, Math.min(w, h) * 0.048, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Volumetric sunbeams in Mountain River
      if (activeScene === 'mountain-river') {
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const angle = 0.55 + i * 0.22 + Math.sin(elapsedSec * 0.15 + i) * 0.03;
          ctx.beginPath();
          ctx.moveTo(celestialX, celestialY);
          ctx.lineTo(
            celestialX - Math.cos(angle) * w * 0.75,
            celestialY + Math.sin(angle) * h * 0.85
          );
          ctx.lineTo(
            celestialX - Math.cos(angle + 0.09) * w * 0.75,
            celestialY + Math.sin(angle + 0.09) * h * 0.85
          );
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 240, 195, 0.05)';
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. DRIFTING CLOUDS (not in aurora/starlit)
      if (activeScene !== 'aurora-peaks' && activeScene !== 'starlit-meadow') {
        clouds.forEach((c) => {
          const cx = ((c.x + elapsedSec * c.speed) % 1.25 - 0.12) * w;
          const cy = c.y * h;
          const cw = 90 * c.scale;
          const ch = 26 * c.scale;
          ctx.fillStyle =
            activeScene === 'sunset-lake'
              ? `rgba(255, 208, 182, ${c.alpha * 0.9})`
              : activeScene === 'sakura-breeze'
                ? `rgba(255, 232, 236, ${c.alpha * 0.95})`
                : activeScene === 'rainy-pine' || activeScene === 'ocean-moonrise'
                  ? `rgba(110, 138, 175, ${c.alpha * 0.65})`
                  : `rgba(255, 255, 255, ${c.alpha})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, cw * 0.52, ch * 0.5, 0, 0, Math.PI * 2);
          ctx.ellipse(
            cx - cw * 0.28,
            cy + ch * 0.12,
            cw * 0.34,
            ch * 0.38,
            0,
            0,
            Math.PI * 2
          );
          ctx.ellipse(
            cx + cw * 0.28,
            cy + ch * 0.1,
            cw * 0.38,
            ch * 0.4,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      // 4. SOARING BIRDS (Day/Dusk/Sakura scenes)
      if (
        activeScene === 'mountain-river' ||
        activeScene === 'sunset-lake' ||
        activeScene === 'sakura-breeze'
      ) {
        ctx.strokeStyle =
          activeScene === 'sunset-lake'
            ? 'rgba(42, 22, 48, 0.65)'
            : activeScene === 'sakura-breeze'
              ? 'rgba(72, 42, 58, 0.48)'
              : 'rgba(24, 42, 66, 0.55)';
        ctx.lineWidth = 1.5;
        birds.forEach((b) => {
          const bx = ((b.xOffset + elapsedSec * b.speed) % 1.15 - 0.07) * w;
          const by = b.y * h + Math.sin(elapsedSec * 0.8 + b.phase) * 8;
          const flap = Math.sin(elapsedSec * 5.2 + b.phase) * b.size * 0.55;
          ctx.beginPath();
          ctx.moveTo(bx - b.size, by + flap);
          ctx.quadraticCurveTo(bx - b.size * 0.4, by - b.size * 0.4, bx, by);
          ctx.quadraticCurveTo(
            bx + b.size * 0.4,
            by - b.size * 0.4,
            bx + b.size,
            by + flap
          );
          ctx.stroke();
        });
      }

      // 5. LAYERED MOUNTAINS + VALLEY MIST
      if (activeScene === 'mountain-river') {
        drawMountainLayer(
          w,
          h,
          h * 0.54,
          h * 0.19,
          2.2,
          0.7,
          '#4a6b86',
          'rgba(242, 248, 255, 0.72)'
        );
        drawMountainLayer(
          w,
          h,
          h * 0.58,
          h * 0.15,
          2.6,
          2.1,
          '#2f5464',
          'rgba(235, 245, 250, 0.32)'
        );
        const mistGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.64);
        mistGrad.addColorStop(0, 'rgba(225, 240, 244, 0)');
        mistGrad.addColorStop(
          0.5,
          `rgba(225, 242, 245, ${0.22 + Math.sin(cyclePhase) * 0.06})`
        );
        mistGrad.addColorStop(1, 'rgba(225, 240, 244, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, h * 0.45, w, h * 0.19);

        drawMountainLayer(w, h, h * 0.63, h * 0.11, 2.9, 4.3, '#1f4442');
        drawMountainLayer(w, h, h * 0.68, h * 0.08, 3.1, 1.4, '#163532');
      } else if (activeScene === 'sunset-lake') {
        drawMountainLayer(w, h, h * 0.56, h * 0.17, 2.3, 1.2, '#473059');
        drawMountainLayer(w, h, h * 0.6, h * 0.12, 2.8, 3.4, '#322042');
        drawMountainLayer(w, h, h * 0.63, h * 0.08, 3.4, 5.1, '#1e152c');
      } else if (activeScene === 'aurora-peaks') {
        drawMountainLayer(
          w,
          h,
          h * 0.56,
          h * 0.19,
          2.1,
          0.9,
          '#1b2d44',
          'rgba(186, 246, 234, 0.48)'
        );
        drawMountainLayer(w, h, h * 0.61, h * 0.13, 2.7, 2.8, '#112133');
        drawMountainLayer(w, h, h * 0.66, h * 0.08, 3.3, 4.5, '#091522');
      } else if (activeScene === 'sakura-breeze') {
        drawMountainLayer(w, h, h * 0.57, h * 0.15, 2.1, 1.1, '#8c6f89');
        drawMountainLayer(w, h, h * 0.61, h * 0.11, 2.7, 3.2, '#624d66');
        drawMountainLayer(w, h, h * 0.66, h * 0.07, 3.4, 0.7, '#3f3247');
      } else if (activeScene === 'starlit-meadow') {
        drawMountainLayer(w, h, h * 0.64, h * 0.08, 1.6, 1.5, '#121d38');
        drawMountainLayer(w, h, h * 0.69, h * 0.06, 2.1, 3.7, '#0c162b');
      } else if (activeScene === 'ocean-moonrise') {
        // Distant headland silhouette on horizon
        drawMountainLayer(w, h, h * 0.6, h * 0.05, 1.4, 0.3, '#101d32');
      } else if (activeScene === 'golden-wheat') {
        drawMountainLayer(w, h, h * 0.59, h * 0.09, 1.7, 0.8, '#694649');
        drawMountainLayer(w, h, h * 0.64, h * 0.06, 2.2, 2.5, '#4b312d');
      } else if (activeScene === 'bamboo-rain') {
        drawMountainLayer(w, h, h * 0.61, h * 0.12, 1.9, 1.4, '#1b453a');
        drawMountainLayer(w, h, h * 0.67, h * 0.07, 2.4, 3.8, '#102e26');
        // Swaying Bamboo stalks across misty backdrop
        for (let b = 0; b < 18; b++) {
          const bx = (b / 17) * w + Math.sin(b * 2.1) * 14;
          const sway = Math.sin(elapsedSec * 0.85 + b * 0.6) * (7 + (b % 3) * 3);
          const thickness = b % 3 === 0 ? 5.5 : 3.2;
          ctx.strokeStyle =
            b % 2 === 0
              ? 'rgba(19, 64, 52, 0.72)'
              : 'rgba(34, 92, 74, 0.56)';
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(bx, h);
          ctx.quadraticCurveTo(bx + sway * 0.45, h * 0.52, bx + sway, h * 0.04);
          ctx.stroke();
        }
      } else if (activeScene === 'bioluminescent-cove') {
        drawMountainLayer(w, h, h * 0.58, h * 0.13, 1.8, 0.6, '#0c2036');
        drawMountainLayer(w, h, h * 0.63, h * 0.08, 2.5, 2.9, '#071526');
      } else {
        drawMountainLayer(w, h, h * 0.57, h * 0.16, 2.4, 1.8, '#17293f');
        drawMountainLayer(w, h, h * 0.62, h * 0.12, 2.9, 3.9, '#102033');
        drawMountainLayer(w, h, h * 0.66, h * 0.08, 3.5, 0.5, '#0b1826');
      }

      // 6. FOREGROUND WATER / MEADOW / OCEAN
      if (activeScene === 'mountain-river') {
        const meadowGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
        meadowGrad.addColorStop(0, '#183c34');
        meadowGrad.addColorStop(0.5, '#122e28');
        meadowGrad.addColorStop(1, '#0b1e1a');
        ctx.fillStyle = meadowGrad;
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        ctx.save();
        ctx.beginPath();
        const riverTopX = w * 0.44;
        const riverTopY = h * 0.61;
        ctx.moveTo(riverTopX - w * 0.014, riverTopY);
        ctx.bezierCurveTo(w * 0.36, h * 0.69, w * 0.62, h * 0.77, w * 0.24, h);
        ctx.lineTo(w * 0.72, h);
        ctx.bezierCurveTo(
          w * 0.78,
          h * 0.77,
          w * 0.46,
          h * 0.69,
          riverTopX + w * 0.018,
          riverTopY
        );
        ctx.closePath();

        const riverGrad = ctx.createLinearGradient(0, riverTopY, 0, h);
        riverGrad.addColorStop(0, '#5ea5b8');
        riverGrad.addColorStop(0.45, '#2b788e');
        riverGrad.addColorStop(1, '#124658');
        ctx.fillStyle = riverGrad;
        ctx.fill();
        ctx.clip();

        for (let r = 0; r < 26; r++) {
          const progress = (r / 26 + elapsedSec * 0.075) % 1;
          const ry = lerp(riverTopY, h, progress);
          const centerCurve =
            lerp(w * 0.44, w * 0.48, progress) +
            Math.sin(progress * Math.PI * 2.2) * w * 0.09;
          const halfSpan = lerp(w * 0.014, w * 0.23, progress);
          const shimmerW = halfSpan * (0.28 + (r % 4) * 0.14);
          const offset = Math.sin(r * 2.3 + elapsedSec * 1.4) * halfSpan * 0.48;

          ctx.strokeStyle =
            r % 3 === 0
              ? `rgba(255, 240, 198, ${0.28 + progress * 0.22})`
              : `rgba(186, 236, 248, ${0.22 + progress * 0.24})`;
          ctx.lineWidth = 1.2 + progress * 2.4;
          ctx.beginPath();
          ctx.moveTo(centerCurve + offset - shimmerW * 0.5, ry);
          ctx.quadraticCurveTo(
            centerCurve + offset,
            ry - 2.5,
            centerCurve + offset + shimmerW * 0.5,
            ry + 1.5
          );
          ctx.stroke();
        }
        ctx.restore();
      } else if (activeScene === 'sunset-lake') {
        const lakeGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
        lakeGrad.addColorStop(0, '#c86f68');
        lakeGrad.addColorStop(0.45, '#59335c');
        lakeGrad.addColorStop(1, '#1a122b');
        ctx.fillStyle = lakeGrad;
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        for (let i = 0; i < 28; i++) {
          const p = i / 28;
          const ry = lerp(h * 0.635, h * 0.98, p);
          const halfW =
            lerp(w * 0.03, w * 0.16, p) *
            (0.75 + Math.sin(elapsedSec * 1.9 + i * 0.8) * 0.25);
          const xShift = Math.sin(elapsedSec * 1.2 + i) * (4 + p * 12);
          ctx.strokeStyle = `rgba(255, 206, 128, ${0.42 - p * 0.22})`;
          ctx.lineWidth = 1.5 + p * 2.5;
          ctx.beginPath();
          ctx.moveTo(celestialX + xShift - halfW, ry);
          ctx.lineTo(celestialX + xShift + halfW, ry);
          ctx.stroke();
        }
      } else if (activeScene === 'aurora-peaks') {
        // Arctic fjord reflecting Northern Lights
        const fjordGrad = ctx.createLinearGradient(0, h * 0.64, 0, h);
        fjordGrad.addColorStop(0, '#0c2635');
        fjordGrad.addColorStop(0.5, '#071b27');
        fjordGrad.addColorStop(1, '#040e16');
        ctx.fillStyle = fjordGrad;
        ctx.fillRect(0, h * 0.64, w, h * 0.36);

        for (let i = 0; i < 24; i++) {
          const p = i / 24;
          const ry = lerp(h * 0.655, h * 0.98, p);
          const shimmerX =
            w * 0.5 + Math.sin(elapsedSec * 0.9 + i * 0.7) * w * 0.22;
          const halfW = lerp(w * 0.06, w * 0.24, p);
          ctx.strokeStyle =
            i % 2 === 0
              ? `rgba(52, 211, 153, ${0.24 - p * 0.12})`
              : `rgba(139, 92, 246, ${0.18 - p * 0.08})`;
          ctx.lineWidth = 1.4 + p * 2.1;
          ctx.beginPath();
          ctx.moveTo(shimmerX - halfW, ry);
          ctx.lineTo(shimmerX + halfW, ry);
          ctx.stroke();
        }
      } else if (activeScene === 'sakura-breeze') {
        // Spring river & blossom banks
        const bankGrad = ctx.createLinearGradient(0, h * 0.64, 0, h);
        bankGrad.addColorStop(0, '#362d3d');
        bankGrad.addColorStop(1, '#1e1726');
        ctx.fillStyle = bankGrad;
        ctx.fillRect(0, h * 0.64, w, h * 0.36);

        const streamGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
        streamGrad.addColorStop(0, 'rgba(235, 178, 190, 0.42)');
        streamGrad.addColorStop(0.5, 'rgba(132, 128, 168, 0.45)');
        streamGrad.addColorStop(1, 'rgba(62, 58, 92, 0.7)');
        ctx.fillStyle = streamGrad;
        ctx.fillRect(0, h * 0.66, w, h * 0.34);

        for (let r = 0; r < 18; r++) {
          const prog = (r / 18 + elapsedSec * 0.04) % 1;
          const ry = lerp(h * 0.67, h * 0.98, prog);
          const rx = ((r * 0.17 + Math.sin(elapsedSec * 0.5 + r) * 0.05) % 1) * w;
          ctx.strokeStyle = `rgba(255, 224, 232, ${0.22 + prog * 0.18})`;
          ctx.lineWidth = 1.2 + prog * 1.4;
          ctx.beginPath();
          ctx.moveTo(rx - 28, ry);
          ctx.lineTo(rx + 28, ry);
          ctx.stroke();
        }
      } else if (activeScene === 'starlit-meadow') {
        const meadowGrad = ctx.createLinearGradient(0, h * 0.66, 0, h);
        meadowGrad.addColorStop(0, '#0a1824');
        meadowGrad.addColorStop(1, '#040a11');
        ctx.fillStyle = meadowGrad;
        ctx.fillRect(0, h * 0.66, w, h * 0.34);

        // Swaying meadow grass blades along foreground
        ctx.strokeStyle = '#0e242c';
        ctx.lineWidth = 2;
        for (let g = 0; g < 60; g++) {
          const gx = (g / 59) * w;
          const gh = 18 + (g % 5) * 9;
          const sway = Math.sin(elapsedSec * 1.6 + g * 0.4) * 6;
          ctx.beginPath();
          ctx.moveTo(gx, h);
          ctx.quadraticCurveTo(gx + sway * 0.5, h - gh * 0.6, gx + sway, h - gh);
          ctx.stroke();
        }
      } else if (activeScene === 'ocean-moonrise') {
        // Moonlit Ocean Swells
        const seaGrad = ctx.createLinearGradient(0, h * 0.59, 0, h);
        seaGrad.addColorStop(0, '#183454');
        seaGrad.addColorStop(0.5, '#0e223a');
        seaGrad.addColorStop(1, '#061120');
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, h * 0.59, w, h * 0.41);

        // Silver moon reflection path
        for (let i = 0; i < 30; i++) {
          const p = i / 30;
          const ry = lerp(h * 0.61, h * 0.96, p);
          const halfW =
            lerp(w * 0.025, w * 0.14, p) *
            (0.7 + Math.sin(elapsedSec * 1.8 + i * 0.9) * 0.3);
          const xShift = Math.sin(elapsedSec * 1.1 + i * 0.6) * (4 + p * 10);
          ctx.strokeStyle = `rgba(220, 236, 255, ${0.46 - p * 0.24})`;
          ctx.lineWidth = 1.4 + p * 2.2;
          ctx.beginPath();
          ctx.moveTo(celestialX + xShift - halfW, ry);
          ctx.lineTo(celestialX + xShift + halfW, ry);
          ctx.stroke();
        }

        // Rolling horizontal ocean waves
        for (let wv = 0; wv < 5; wv++) {
          const waveProg = (wv / 5 + elapsedSec * 0.08) % 1;
          const wy = lerp(h * 0.66, h * 0.98, waveProg);
          ctx.strokeStyle = `rgba(180, 214, 248, ${(1 - waveProg) * 0.28})`;
          ctx.lineWidth = 1.5 + waveProg * 2;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 24) {
            const dy = Math.sin((x / w) * 8 + elapsedSec * 1.2 + wv) * 4;
            if (x === 0) ctx.moveTo(x, wy + dy);
            else ctx.lineTo(x, wy + dy);
          }
          ctx.stroke();
        }
      } else if (activeScene === 'golden-wheat') {
        // Rolling amber wheat plains swaying in warm wind
        const fieldGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
        fieldGrad.addColorStop(0, '#966326');
        fieldGrad.addColorStop(0.45, '#684116');
        fieldGrad.addColorStop(1, '#2d1a08');
        ctx.fillStyle = fieldGrad;
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        for (let row = 0; row < 4; row++) {
          const baseRowY = lerp(h * 0.72, h * 1.02, row / 3);
          const count = 42;
          ctx.strokeStyle =
            row % 2 === 0
              ? 'rgba(244, 196, 94, 0.68)'
              : 'rgba(218, 152, 54, 0.62)';
          ctx.lineWidth = 1.6 + row * 0.35;
          for (let i = 0; i <= count; i++) {
            const gx = (i / count) * w;
            const bladeH = 26 + row * 12 + (i % 4) * 6;
            const sway =
              Math.sin(elapsedSec * 1.5 + i * 0.32 + row) * (9 + row * 3);
            ctx.beginPath();
            ctx.moveTo(gx, baseRowY);
            ctx.quadraticCurveTo(
              gx + sway * 0.4,
              baseRowY - bladeH * 0.55,
              gx + sway,
              baseRowY - bladeH
            );
            ctx.stroke();
          }
        }
      } else if (activeScene === 'bamboo-rain') {
        const mossGrad = ctx.createLinearGradient(0, h * 0.66, 0, h);
        mossGrad.addColorStop(0, '#123328');
        mossGrad.addColorStop(1, '#071712');
        ctx.fillStyle = mossGrad;
        ctx.fillRect(0, h * 0.66, w, h * 0.34);

        const mistPool = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.78);
        mistPool.addColorStop(0, 'rgba(182, 234, 212, 0)');
        mistPool.addColorStop(0.5, 'rgba(176, 228, 206, 0.16)');
        mistPool.addColorStop(1, 'rgba(182, 234, 212, 0)');
        ctx.fillStyle = mistPool;
        ctx.fillRect(0, h * 0.58, w, h * 0.2);
      } else if (activeScene === 'bioluminescent-cove') {
        const coveGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
        coveGrad.addColorStop(0, '#0a2b3f');
        coveGrad.addColorStop(0.5, '#071d2f');
        coveGrad.addColorStop(1, '#030d18');
        ctx.fillStyle = coveGrad;
        ctx.fillRect(0, h * 0.6, w, h * 0.4);

        // Glowing cyan bioluminescent tide ribbons
        for (let wv = 0; wv < 6; wv++) {
          const waveProg = (wv / 6 + elapsedSec * 0.065) % 1;
          const wy = lerp(h * 0.64, h * 0.97, waveProg);
          const glowAlpha = (0.35 + Math.sin(elapsedSec * 2 + wv) * 0.18) * (0.4 + waveProg * 0.6);
          ctx.strokeStyle = `rgba(56, 242, 232, ${glowAlpha})`;
          ctx.lineWidth = 1.8 + waveProg * 2.4;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 20) {
            const dy = Math.sin((x / w) * 9 + elapsedSec * 1.4 + wv) * 5;
            if (x === 0) ctx.moveTo(x, wy + dy);
            else ctx.lineTo(x, wy + dy);
          }
          ctx.stroke();
        }
      } else {
        // Rainy Pine Forest Stream
        const nightGround = ctx.createLinearGradient(0, h * 0.62, 0, h);
        nightGround.addColorStop(0, '#0a1824');
        nightGround.addColorStop(1, '#050b12');
        ctx.fillStyle = nightGround;
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        const streamGrad = ctx.createLinearGradient(0, h * 0.64, 0, h);
        streamGrad.addColorStop(0, 'rgba(62, 108, 146, 0.45)');
        streamGrad.addColorStop(1, 'rgba(18, 42, 64, 0.72)');
        ctx.fillStyle = streamGrad;
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        ripples.forEach((rp) => {
          const p = (rp.phase + elapsedSec * 0.35) % 1;
          const radius = p * rp.maxR;
          ctx.strokeStyle = `rgba(168, 214, 245, ${(1 - p) * 0.32})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            w * rp.x,
            h * rp.y,
            radius * 1.9,
            radius * 0.55,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        });
      }

      // 7. FOREGROUND PINE SILHOUETTES ON EDGES (for wooded scenes)
      if (
        activeScene !== 'ocean-moonrise' &&
        activeScene !== 'starlit-meadow' &&
        activeScene !== 'golden-wheat' &&
        activeScene !== 'bamboo-rain' &&
        activeScene !== 'bioluminescent-cove'
      ) {
        const treeSpecs = [
          { x: 0.04, y: 0.72, h: 0.24 },
          { x: 0.09, y: 0.78, h: 0.28 },
          { x: 0.15, y: 0.71, h: 0.2 },
          { x: 0.21, y: 0.76, h: 0.17 },
          { x: 0.79, y: 0.75, h: 0.18 },
          { x: 0.86, y: 0.71, h: 0.23 },
          { x: 0.92, y: 0.79, h: 0.29 },
          { x: 0.97, y: 0.74, h: 0.22 },
        ];
        const treeColor =
          activeScene === 'mountain-river'
            ? '#0c2620'
            : activeScene === 'sunset-lake'
              ? '#130c1e'
              : activeScene === 'aurora-peaks'
                ? '#05101a'
                : activeScene === 'sakura-breeze'
                  ? '#2b1e2e'
                  : '#06111a';
        treeSpecs.forEach((t, idx) => {
          const sway = Math.sin(elapsedSec * 1.1 + idx * 0.9) * 5;
          drawPineTree(w * t.x, h * t.y, h * t.h, sway, treeColor);
        });
      }

      // 8. RAIN STREAKS, DRIFTING SAKURA PETALS, OR FLOATING FIREFLIES
      if (activeScene === 'rainy-pine' || activeScene === 'bamboo-rain') {
        ctx.strokeStyle =
          activeScene === 'bamboo-rain'
            ? 'rgba(190, 236, 220, 0.26)'
            : 'rgba(176, 212, 245, 0.28)';
        ctx.lineWidth = 1.1;
        particles.forEach((p, idx) => {
          const rx = ((p.x + elapsedSec * 0.16) % 1) * w;
          const ry = ((p.y + elapsedSec * (0.62 + (idx % 3) * 0.16)) % 1) * h;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 14);
          ctx.stroke();
        });
      }

      if (activeScene === 'sakura-breeze') {
        // Drifting pink cherry blossom petals
        particles.forEach((p, idx) => {
          const px =
            ((p.x + elapsedSec * (0.025 + (idx % 4) * 0.008) +
              Math.sin(elapsedSec * 0.9 + p.phase) * 0.03) %
              1) *
            w;
          const py = ((p.y + elapsedSec * (0.045 + (idx % 3) * 0.014)) % 1) * h;
          const rot = elapsedSec * 1.4 + p.phase;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(rot);
          ctx.fillStyle =
            idx % 2 === 0
              ? 'rgba(255, 198, 214, 0.78)'
              : 'rgba(255, 224, 232, 0.85)';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2.2, p.size * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      } else {
        // Fireflies / gentle glowing motes
        particles.slice(0, 34).forEach((p, idx) => {
          const px =
            ((p.x +
              elapsedSec * p.vx +
              Math.sin(elapsedSec * 0.6 + p.phase) * 0.025 +
              1) %
              1) *
            w;
          const py =
            ((p.y + Math.sin(elapsedSec * 0.45 + p.phase) * 0.04 + 1) % 1) *
              (h * 0.55) +
            h * 0.36;
          const pulse = (Math.sin(elapsedSec * 2.2 + idx) + 1) / 2;
          const alpha =
            activeScene === 'mountain-river' || activeScene === 'ocean-moonrise'
              ? 0.2 + pulse * 0.25
              : 0.28 + pulse * 0.65;
          ctx.fillStyle =
            activeScene === 'aurora-peaks'
              ? `rgba(110, 245, 200, ${alpha})`
              : activeScene === 'mountain-river'
                ? `rgba(255, 242, 188, ${alpha})`
                : `rgba(250, 214, 118, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (0.7 + pulse * 0.5), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Animated natural scenery"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
