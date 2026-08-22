import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; z: number; size: number; brightness: number };
type DiskParticle = { angle: number; radius: number; speed: number; size: number; brightness: number };

export function Ton618Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let rotation = 0;
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pointer = (event: PointerEvent) => {
      mouseX = (event.clientX - width / 2) / width;
      mouseY = (event.clientY - height / 2) / height;
    };

    const stars: Star[] = Array.from({ length: 260 }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 2000 + 1,
      size: Math.random() * 1.8 + 0.2,
      brightness: Math.random() * 0.8 + 0.2,
    }));

    const disk: DiskParticle[] = Array.from({ length: 900 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 55 + Math.random() * 330,
      speed: 0.018 + Math.random() * 0.04,
      size: Math.random() * 2.4 + 0.5,
      brightness: Math.random() * 0.55 + 0.45,
    }));

    const resetStar = (star: Star) => {
      star.x = (Math.random() - 0.5) * width * 2;
      star.y = (Math.random() - 0.5) * height * 2;
      star.z = 2000;
      star.size = Math.random() * 1.8 + 0.2;
      star.brightness = Math.random() * 0.8 + 0.2;
    };

    const drawStars = () => {
      for (const star of stars) {
        star.z -= 1.7;
        if (star.z <= 1) resetStar(star);
        const x = star.x / star.z * 100 + width / 2 + mouseX * 35;
        const y = star.y / star.z * 100 + height / 2 + mouseY * 24;
        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;
        const size = Math.max(0.3, star.size * (1000 / star.z));
        const alpha = Math.min(0.95, star.brightness * (1000 / star.z));
        ctx.fillStyle = `rgba(225,245,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawJets = (cx: number, cy: number) => {
      const length = Math.min(520, height * 0.72);
      const widthPx = Math.max(18, Math.min(42, width * 0.025));
      for (const direction of [-1, 1]) {
        const gradient = ctx.createLinearGradient(cx, cy, cx, cy + direction * length);
        gradient.addColorStop(0, 'rgba(210,248,255,0.72)');
        gradient.addColorStop(0.18, 'rgba(90,190,255,0.32)');
        gradient.addColorStop(0.55, 'rgba(70,130,255,0.10)');
        gradient.addColorStop(1, 'rgba(70,130,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx - widthPx, cy);
        ctx.lineTo(cx + widthPx, cy);
        ctx.lineTo(cx + widthPx * 0.18, cy + direction * length);
        ctx.lineTo(cx - widthPx * 0.18, cy + direction * length);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawDisk = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);
      for (const particle of disk) {
        particle.angle += particle.speed / Math.max(particle.radius, 1) * 7;
        const x = cx + Math.cos(particle.angle) * particle.radius;
        const y = cy + Math.sin(particle.angle) * particle.radius * 0.28;
        const radius = particle.size * 4.5;
        const t = Math.min(1, Math.max(0, (particle.radius - 55) / 330));
        const hue = 42 - t * 20;
        const lightness = 92 - t * 42;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${hue},100%,${lightness}%,${particle.brightness})`);
        gradient.addColorStop(0.2, `hsla(${hue},100%,60%,${particle.brightness * 0.7})`);
        gradient.addColorStop(1, `hsla(${hue},100%,50%,0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawGlow = (cx: number, cy: number) => {
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.42);
      g.addColorStop(0, 'rgba(255,245,220,0.20)');
      g.addColorStop(0.16, 'rgba(255,165,80,0.12)');
      g.addColorStop(0.36, 'rgba(75,205,255,0.09)');
      g.addColorStop(0.72, 'rgba(35,100,180,0.025)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    };

    const drawLensing = (cx: number, cy: number) => {
      for (let i = 0; i < 7; i++) {
        const radius = 76 + i * 24;
        ctx.strokeStyle = `rgba(255,205,130,${0.10 - i * 0.011})`;
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.30, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawBlackHole = (cx: number, cy: number) => {
      const ring = ctx.createRadialGradient(cx, cy, 44, cx, cy, 64);
      ring.addColorStop(0, 'rgba(0,0,0,0)');
      ring.addColorStop(0.55, 'rgba(255,235,180,0.95)');
      ring.addColorStop(0.72, 'rgba(130,235,255,0.35)');
      ring.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(cx, cy, 64, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.fill();

      const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, 48);
      inner.addColorStop(0, '#000');
      inner.addColorStop(0.82, '#000');
      inner.addColorStop(1, 'rgba(20,15,10,0.98)');
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2 + mouseX * 38;
      const cy = height / 2 + mouseY * 28;
      rotation += 0.0018;
      drawStars();
      drawJets(cx, cy);
      drawGlow(cx, cy);
      drawDisk(cx, cy);
      drawLensing(cx, cy);
      drawBlackHole(cx, cy);
      frame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointer, { passive: true });
    animate();

    return () => {
      cancelAnimationFrame(frame || raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="ton618-canvas" aria-hidden="true" />;
}
