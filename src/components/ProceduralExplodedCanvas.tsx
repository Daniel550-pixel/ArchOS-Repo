import React, { useRef, useEffect } from 'react';
import { ExperienceCard } from '../types';

interface ProceduralExplodedCanvasProps {
  experience: ExperienceCard;
  progress: number; // 0.0 (Assembled) to 1.0 (Exploded)
  className?: string;
  showLabels?: boolean;
}

export const ProceduralExplodedCanvas: React.FC<ProceduralExplodedCanvasProps> = ({
  experience,
  progress,
  className = '',
  showLabels = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    let angle = 0;

    const render = () => {
      const p = progressRef.current; // 0.0 to 1.0
      ctx.clearRect(0, 0, width, height);

      // Dark Slate / Charcoal Studio Background with subtle radial rim light
      const cx = width / 2;
      const cy = height / 2;

      const bgGrad = ctx.createRadialGradient(cx, cy - 40, 50, cx, cy, Math.max(width, height) * 0.75);
      bgGrad.addColorStop(0, '#15151c');
      bgGrad.addColorStop(0.6, '#0d0d10');
      bgGrad.addColorStop(1, '#060608');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Isometric / 3D Projection Grid Floor
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 244, 240, 0.03)';
      ctx.lineWidth = 1;
      const gridY = cy + 220;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 80 - 300, gridY + 120);
        ctx.lineTo(cx + i * 25, gridY - 100);
        ctx.stroke();
      }
      for (let j = 0; j <= 5; j++) {
        const yOffset = j * 35;
        const xSpread = 160 + j * 45;
        ctx.beginPath();
        ctx.moveTo(cx - xSpread, gridY - 60 + yOffset);
        ctx.lineTo(cx + xSpread, gridY - 60 + yOffset);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Specific 3D Exploded Layer System according to experience.id
      ctx.save();
      ctx.translate(cx, cy);

      const layers = experience.layers;
      const totalLayers = layers.length;

      // Draw Center Axis Laser Guide
      if (p > 0.02) {
        ctx.strokeStyle = `rgba(212, 255, 0, ${0.15 * p})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, -280 * p);
        ctx.lineTo(0, 280 * p);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      layers.forEach((layer, idx) => {
        // Calculate separated displacement
        // idx 0 is highest layer (top / outer), idx 4 is base layer
        const spreadFactor = (idx - (totalLayers - 1) / 2) * -110 * p;
        const layerY = spreadFactor;
        const layerX = (idx % 2 === 0 ? 1 : -1) * (idx === 0 || idx === 4 ? 0 : 25) * p;

        ctx.save();
        ctx.translate(layerX, layerY);

        // Shadow / Projection onto lower strata
        if (p > 0.05) {
          ctx.beginPath();
          ctx.ellipse(0, 40 + p * 20, 100 - idx * 10, 24 - idx * 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * p})`;
          ctx.fill();
        }

        // Render Layer Silhouette & Geometric Detailing based on Experience ID
        renderCardLayerObject(ctx, experience.id, idx, p, angle);

        // Technical Callout Leader Line & Monospaced Tag
        if (showLabels && p > 0.15) {
          const isRight = idx % 2 === 0;
          const lineLength = 140 + idx * 20;
          const targetX = isRight ? lineLength : -lineLength;
          const targetY = (idx - 2) * 12;

          ctx.strokeStyle = `rgba(212, 255, 0, ${Math.min(0.7, (p - 0.15) * 1.5)})`;
          ctx.lineWidth = 1;

          // Anchor point circle
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#d4ff00';
          ctx.fill();

          // Angled leader line
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(targetX * 0.35, targetY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Monospaced text box
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = `rgba(245, 244, 240, ${Math.min(0.9, (p - 0.15) * 1.6)})`;
          ctx.textAlign = isRight ? 'left' : 'right';
          const textX = targetX + (isRight ? 8 : -8);
          ctx.fillText(`L-${layer.index} // ${layer.name.toUpperCase()}`, textX, targetY - 4);
          ctx.fillStyle = `rgba(142, 141, 136, ${Math.min(0.75, (p - 0.15) * 1.5)})`;
          ctx.font = '9px "Space Grotesk", sans-serif';
          ctx.fillText(layer.material, textX, targetY + 8);
        }

        ctx.restore();
      });

      ctx.restore();

      angle += 0.005;
      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [experience, showLabels]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// Procedural 3D Geometry Renderer for Each Experience Layer
function renderCardLayerObject(
  ctx: CanvasRenderingContext2D,
  id: string,
  layerIdx: number,
  progress: number,
  _angle: number
) {
  ctx.save();

  if (id === 'kinetic-gt') {
    // 0: Carbon Monocoque Shell, 1: Titanium Wishbones/Brakes, 2: Axial Flux Motors, 3: Battery Floor, 4: Wheels
    if (layerIdx === 0) {
      // Sleek Monocoque & Active Wing
      ctx.fillStyle = '#18181f';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-160, 20);
      ctx.bezierCurveTo(-140, -40, -40, -55, 60, -45);
      ctx.bezierCurveTo(120, -35, 170, -10, 190, 15);
      ctx.bezierCurveTo(140, 25, -80, 30, -160, 20);
      ctx.fill();
      ctx.stroke();

      // Cabin Canopy Window
      ctx.fillStyle = '#0a0a0e';
      ctx.beginPath();
      ctx.moveTo(-40, -35);
      ctx.bezierCurveTo(-10, -50, 40, -45, 70, -30);
      ctx.lineTo(50, -10);
      ctx.lineTo(-30, -10);
      ctx.closePath();
      ctx.fill();

      // Rear Active Wing
      ctx.fillStyle = '#22222a';
      ctx.fillRect(-175, -25, 45, 6);
    } else if (layerIdx === 1) {
      // Titanium Pushrod & Carbon Rotors
      ctx.strokeStyle = '#b0b5be';
      ctx.lineWidth = 2.5;
      // Wishbones
      ctx.beginPath();
      ctx.moveTo(-120, -15); ctx.lineTo(-90, 10); ctx.lineTo(-60, -15);
      ctx.moveTo(90, -15); ctx.lineTo(120, 10); ctx.lineTo(150, -15);
      ctx.stroke();
      // Brakes
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-125, 5, 12, 22);
      ctx.fillRect(140, 5, 12, 22);
    } else if (layerIdx === 2) {
      // Twin Axial Flux Motors & Inverter
      ctx.fillStyle = '#2d2d38';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-45, -15, 90, 30, 6);
      ctx.fill();
      ctx.stroke();
      // Copper coils
      ctx.fillStyle = '#e07a28';
      for (let i = -30; i <= 30; i += 15) {
        ctx.fillRect(i - 4, -10, 8, 20);
      }
    } else if (layerIdx === 3) {
      // Solid State Battery Tray
      ctx.fillStyle = '#121217';
      ctx.strokeStyle = '#3a3a46';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-140, -18, 280, 36, 4);
      ctx.fill();
      ctx.stroke();
      // Matrix cell grid
      ctx.fillStyle = '#1f1f28';
      for (let x = -120; x <= 100; x += 30) {
        ctx.fillRect(x, -10, 22, 20);
      }
    } else if (layerIdx === 4) {
      // Magnesium Wheels & Slicks
      ctx.fillStyle = '#08080a';
      ctx.strokeStyle = '#b8c0cc';
      ctx.lineWidth = 2;
      // Left / Right Wheel Hubs
      [-120, 120].forEach(pos => {
        ctx.beginPath();
        ctx.ellipse(pos, 0, 24, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Spoke details
        ctx.strokeStyle = '#d4ff00';
        ctx.beginPath();
        ctx.arc(pos, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  } else if (id === 'orbital-habitat') {
    // Space Habitat Torus
    if (layerIdx === 0) {
      // Photovoltaic Solar Wings
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      [-160, 100].forEach(x => {
        ctx.fillRect(x, -25, 60, 50);
        ctx.strokeRect(x, -25, 60, 50);
      });
    } else if (layerIdx === 1) {
      // Outer Torus Ring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Windows
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (layerIdx === 2) {
      // ECLSS Fluid Conduits & Spokes
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 120, Math.sin(a) * 38);
        ctx.stroke();
      }
    } else if (layerIdx === 3) {
      // Momentum Wheel Core
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (layerIdx === 4) {
      // Androgynous Docking Port
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (id === 'botanical-clock') {
    // Horology & Terrarium
    if (layerIdx === 0) {
      // Patinated Brass Bezel & Glass Dome
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
    } else if (layerIdx === 1) {
      // Frosted Dial & Hands
      ctx.strokeStyle = '#fefae0';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * 75, Math.sin(rad) * 75);
        ctx.lineTo(Math.cos(rad) * 88, Math.sin(rad) * 88);
        ctx.stroke();
      }
      // Blued Steel Hands
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(25, -45);
      ctx.moveTo(0, 0); ctx.lineTo(-40, 10);
      ctx.stroke();
    } else if (layerIdx === 2) {
      // Tourbillon Escapement Cage
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -15, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(-8, -25, 16, 20);
    } else if (layerIdx === 3) {
      // Living Terrarium Moss
      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#65a30d';
      for (let m = 0; m < 14; m++) {
        const mx = Math.sin(m * 1.7) * 45;
        const my = Math.cos(m * 2.3) * 45;
        ctx.beginPath();
        ctx.arc(mx, my, 8 + (m % 4), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (layerIdx === 4) {
      // Decorated Mainplate with Jewels
      ctx.fillStyle = '#404040';
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.fill();
      // Ruby Jewels
      ctx.fillStyle = '#e11d48';
      for (let r = 0; r < 8; r++) {
        const rad = (r * Math.PI) / 4;
        ctx.beginPath();
        ctx.arc(Math.cos(rad) * 55, Math.sin(rad) * 55, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'analogue-sound-machine') {
    // Vacuum Tube Synthesizer
    if (layerIdx === 0) {
      // 300B Vacuum Triode Valves
      [-40, 40].forEach(vx => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeStyle = '#d4ff00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(vx - 14, -45, 28, 50, 10);
        ctx.fill();
        ctx.stroke();
        // Glowing Filament
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx - 5, -20); ctx.lineTo(vx, -35); ctx.lineTo(vx + 5, -20);
        ctx.stroke();
      });
    } else if (layerIdx === 1) {
      // Gimbal Tonearm & Cartridge
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(100, 30);
      ctx.lineTo(85, -25);
      ctx.lineTo(15, -15);
      ctx.stroke();
      // Headshell
      ctx.fillStyle = '#d4ff00';
      ctx.fillRect(8, -20, 14, 10);
    } else if (layerIdx === 2) {
      // Brass Heavy Platter
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-30, 0, 75, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (layerIdx === 3) {
      // Valve Preamp PCB
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-120, -20, 240, 40, 4);
      ctx.fill();
      ctx.stroke();
    } else if (layerIdx === 4) {
      // Granite Isolation Base
      ctx.fillStyle = '#171717';
      ctx.strokeStyle = '#525252';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-140, -15, 280, 30, 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (id === 'future-city-block') {
    // Vertical Forest City Skyscraper
    if (layerIdx === 0) {
      // Photovoltaic Canopy
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-70, -20);
      ctx.lineTo(0, -45);
      ctx.lineTo(70, -20);
      ctx.lineTo(0, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (layerIdx === 1) {
      // Stepped Skygardens
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(-60, -22, 120, 44, 6);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      for (let g = -45; g <= 45; g += 18) {
        ctx.fillRect(g, -15, 12, 30);
      }
    } else if (layerIdx === 2) {
      // Modular Timber Apartments
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-75, -25, 150, 50, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef3c7';
      for (let w = -60; w <= 50; w += 25) {
        ctx.fillRect(w, -15, 15, 12);
        ctx.fillRect(w, 5, 15, 12);
      }
    } else if (layerIdx === 3) {
      // Mega Structural Steel Core
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(-40, -30, 80, 60);
      // X-bracing
      ctx.beginPath();
      ctx.moveTo(-40, -30); ctx.lineTo(40, 30);
      ctx.moveTo(40, -30); ctx.lineTo(-40, 30);
      ctx.stroke();
    } else if (layerIdx === 4) {
      // Subterranean Maglev Transit
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#d4ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-110, -20, 220, 40, 4);
      ctx.fill();
      ctx.stroke();
      // High-speed rail tube
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-90, -5, 180, 10);
    }
  }

  ctx.restore();
}
