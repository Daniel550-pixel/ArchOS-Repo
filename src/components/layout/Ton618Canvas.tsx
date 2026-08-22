import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; z: number; size: number; brightness: number; tint: number };
type DiskParticle = { angle: number; radius: number; speed: number; size: number; brightness: number; phase: number };
type JetParticle = { t: number; side: number; spread: number; speed: number; size: number; brightness: number };

const BASE_STARS = 520;
const BASE_DISK = 2800;
const BASE_JETS = 700;

export function Ton618Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let renderScale = 1;
    let mouseX = 0;
    let mouseY = 0;
    let rotation = 0;
    let frame = 0;
    let lastTime = performance.now();
    let fpsEstimate = 60;
    let quality = 1;
    let qualityTimer = 0;

    const stars: Star[] = Array.from({ length: BASE_STARS }, () => ({ x: 0, y: 0, z: 1, size: 1, brightness: 1, tint: 0 }));
    const disk: DiskParticle[] = Array.from({ length: BASE_DISK }, () => ({ angle: 0, radius: 100, speed: 0.02, size: 1, brightness: 1, phase: 0 }));
    const jetParticles: JetParticle[] = Array.from({ length: BASE_JETS }, () => ({ t: 0, side: 1, spread: 0.5, speed: 0.04, size: 1, brightness: 1 }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // Keep 4K-class output crisp while preventing extreme high-DPI backing stores
      // from exhausting GPU memory. CSS pixels remain native viewport resolution.
      const nativeDpr = window.devicePixelRatio || 1;
      const cap = width >= 3000 || height >= 1800 ? 2 : 2.5;
      renderScale = Math.min(nativeDpr, cap);
      canvas.width = Math.floor(width * renderScale);
      canvas.height = Math.floor(height * renderScale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };

    const pointer = (event: PointerEvent) => {
      const targetX = (event.clientX - width / 2) / width;
      const targetY = (event.clientY - height / 2) / height;
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;
    };

    const resetStar = (star: Star) => {
      star.x = (Math.random() - 0.5) * 2;
      star.y = (Math.random() - 0.5) * 2;
      star.z = 2200;
      star.size = Math.random() * 1.8 + 0.15;
      star.brightness = Math.random() * 0.75 + 0.2;
      star.tint = Math.random();
    };

    stars.forEach(resetStar);
    disk.forEach((p) => {
      p.angle = Math.random() * Math.PI * 2;
      p.radius = 58 + Math.pow(Math.random(), 0.72) * 390;
      p.speed = 0.014 + Math.random() * 0.036;
      p.size = Math.random() * 1.8 + 0.35;
      p.brightness = Math.random() * 0.55 + 0.45;
      p.phase = Math.random() * Math.PI * 2;
    });
    jetParticles.forEach((p) => {
      p.t = Math.random();
      p.side = Math.random() > 0.5 ? 1 : -1;
      p.spread = Math.random();
      p.speed = 0.025 + Math.random() * 0.065;
      p.size = Math.random() * 1.8 + 0.35;
      p.brightness = Math.random() * 0.65 + 0.35;
    });

    const clearScene = () => {
      const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.72);
      g.addColorStop(0, 'rgb(4,6,10)');
      g.addColorStop(0.52, 'rgb(1,2,5)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    };

    const drawStars = (dt: number) => {
      const count = Math.floor(BASE_STARS * quality);
      for (let i = 0; i < count; i++) {
        const star = stars[i];
        star.z -= 18 * dt;
        if (star.z <= 12) resetStar(star);
        const perspective = 980 / star.z;
        const x = star.x * width * perspective + width / 2 + mouseX * 42 * perspective;
        const y = star.y * height * perspective + height / 2 + mouseY * 30 * perspective;
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        const size = Math.max(0.22, star.size * perspective);
        const alpha = Math.min(0.9, star.brightness * Math.min(1, perspective * 0.95));
        ctx.fillStyle = star.tint > 0.78 ? `rgba(150,205,255,${alpha})` : `rgba(225,242,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        if (size > 1.35 && quality > 0.7) {
          ctx.strokeStyle = `rgba(205,235,255,${alpha * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - size * 3, y); ctx.lineTo(x + size * 3, y);
          ctx.moveTo(x, y - size * 3); ctx.lineTo(x, y + size * 3);
          ctx.stroke();
        }
      }
    };

    const drawAmbientHalo = (cx: number, cy: number) => {
      const halo = ctx.createRadialGradient(cx, cy, 55, cx, cy, Math.min(width, height) * 0.56);
      halo.addColorStop(0, 'rgba(255,242,218,0.17)');
      halo.addColorStop(0.11, 'rgba(255,188,96,0.12)');
      halo.addColorStop(0.26, 'rgba(91,211,255,0.075)');
      halo.addColorStop(0.58, 'rgba(45,105,190,0.022)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);
    };

    const drawJets = (cx: number, cy: number) => {
      const length = Math.min(720, height * 0.9);
      const core = Math.max(5, Math.min(12, width * 0.007));
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const side of [-1, 1]) {
        const outer = ctx.createLinearGradient(cx, cy, cx, cy + side * length);
        outer.addColorStop(0, 'rgba(220,250,255,0.36)');
        outer.addColorStop(0.18, 'rgba(105,205,255,0.17)');
        outer.addColorStop(0.55, 'rgba(58,126,255,0.055)');
        outer.addColorStop(1, 'rgba(40,100,255,0)');
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(cx - core * 4.5, cy); ctx.lineTo(cx + core * 4.5, cy);
        ctx.lineTo(cx + core * 0.8, cy + side * length); ctx.lineTo(cx - core * 0.8, cy + side * length);
        ctx.closePath(); ctx.fill();
        const inner = ctx.createLinearGradient(cx, cy, cx, cy + side * length * 0.7);
        inner.addColorStop(0, 'rgba(255,255,255,0.82)');
        inner.addColorStop(0.25, 'rgba(150,225,255,0.32)');
        inner.addColorStop(1, 'rgba(70,150,255,0)');
        ctx.strokeStyle = inner;
        ctx.lineWidth = core;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + side * length * 0.7); ctx.stroke();
      }
      const count = Math.floor(BASE_JETS * quality);
      for (let i = 0; i < count; i++) {
        const particle = jetParticles[i];
        particle.t += particle.speed * 0.55;
        if (particle.t > 1) particle.t -= 1;
        const t = particle.t;
        const y = cy + particle.side * t * length;
        const spread = (2 + t * 26) * particle.spread * (0.5 + Math.sin(t * 18 + particle.spread * 5) * 0.18);
        const x = cx + (particle.spread - 0.5) * spread;
        const r = particle.size * (1 - t * 0.45);
        ctx.fillStyle = `rgba(170,225,255,${particle.brightness * (1 - t) * 0.55})`;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.3, r), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    const drawDisk = (cx: number, cy: number, time: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);
      ctx.globalCompositeOperation = 'screen';
      const count = Math.floor(BASE_DISK * quality);
      for (let i = 0; i < count; i++) {
        const p = disk[i];
        p.angle += p.speed / Math.max(p.radius, 1) * 7.5;
        const radiusNorm = (p.radius - 58) / 390;
        const yScale = 0.24 + radiusNorm * 0.09;
        const turbulence = Math.sin(p.angle * 7 + p.phase + time * 0.0007) * 3.5 + Math.sin(p.angle * 13 - p.phase) * 1.4;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * yScale + turbulence;
        const doppler = 0.72 + 0.28 * Math.sin(p.angle);
        const radius = p.size * (3.5 + (1 - radiusNorm) * 3.2);
        const hue = 48 - radiusNorm * 30;
        const light = 96 - radiusNorm * 52;
        const alpha = Math.min(0.95, p.brightness * doppler);
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
        g.addColorStop(0, `hsla(${hue},100%,${light}%,${alpha})`);
        g.addColorStop(0.16, `hsla(${hue},100%,${Math.max(58, light - 20)}%,${alpha * 0.72})`);
        g.addColorStop(0.58, `hsla(${hue - 4},100%,52%,${alpha * 0.16})`);
        g.addColorStop(1, `hsla(${hue - 8},100%,45%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2); ctx.fill();
      }
      if (quality > 0.72) {
        for (let band = 0; band < 12; band++) {
          const r = 72 + band * 14;
          ctx.strokeStyle = `rgba(255,190,90,${0.035 + (11 - band) * 0.003})`;
          ctx.lineWidth = 1 + (11 - band) * 0.08;
          ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.255, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawLensing = (cx: number, cy: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rings = quality > 0.72 ? 10 : 7;
      for (let i = 0; i < rings; i++) {
        const r = 78 + i * 25;
        ctx.strokeStyle = `rgba(255,205,145,${Math.max(0.012, 0.085 - i * 0.007)})`;
        ctx.lineWidth = i === 0 ? 2.4 : 0.7;
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.285, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    };

    const drawBlackHole = (cx: number, cy: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const ring = ctx.createRadialGradient(cx, cy, 43, cx, cy, 72);
      ring.addColorStop(0, 'rgba(0,0,0,0)');
      ring.addColorStop(0.42, 'rgba(255,242,190,0.96)');
      ring.addColorStop(0.56, 'rgba(255,188,82,0.72)');
      ring.addColorStop(0.68, 'rgba(100,225,255,0.25)');
      ring.addColorStop(1, 'rgba(255,125,45,0)');
      ctx.fillStyle = ring;
      ctx.beginPath(); ctx.arc(cx, cy, 72, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      const shadow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 58);
      shadow.addColorStop(0, '#000'); shadow.addColorStop(0.84, '#000'); shadow.addColorStop(1, 'rgba(2,3,5,0.98)');
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.fill();
    };

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const instantFps = dt > 0 ? 1 / dt : 60;
      fpsEstimate += (instantFps - fpsEstimate) * 0.04;
      qualityTimer += dt;

      // Adaptive 60 FPS governor. The renderer starts at maximum quality and only
      // sheds particle work when sustained frame time exceeds the 16.7ms target.
      if (qualityTimer > 0.75) {
        if (fpsEstimate < 50) quality = Math.max(0.55, quality - 0.08);
        else if (fpsEstimate > 57) quality = Math.min(1, quality + 0.04);
        qualityTimer = 0;
      }

      clearScene();
      const cx = width / 2 + mouseX * 42;
      const cy = height / 2 + mouseY * 30;
      rotation += dt * 0.11;
      drawStars(dt);
      drawJets(cx, cy);
      drawAmbientHalo(cx, cy);
      drawDisk(cx, cy, now);
      drawLensing(cx, cy);
      drawBlackHole(cx, cy);
      frame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', pointer, { passive: true });
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="ton618-canvas" aria-hidden="true" />;
}
