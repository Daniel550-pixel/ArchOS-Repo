import React, { useEffect, useRef } from "react";

export type UltronSystemStatus =
  | "IDLE"
  | "ANALYZING"
  | "EXECUTING"
  | "RISK"
  | "HALT"
  | "PROFIT"
  | "LOSS";

interface Props {
  status?: UltronSystemStatus;
  particleCount?: number;
}

/**
 * ArchOS-native ULTRON neural field.
 *
 * Promoted from FGSE's NeuralVisualizer, but deliberately decoupled from
 * FGSE's trading/SystemStatus model. The component is a presentation layer;
 * it has no command, network, execution, or financial authority.
 */
export const UltronNeuralField: React.FC<Props> = ({
  status = "IDLE",
  particleCount = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
    }> = [];

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 500,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
      }));
    };

    const accent = () => {
      switch (status) {
        case "ANALYZING": return "142,45,226";
        case "EXECUTING": return "255,255,255";
        case "RISK":
        case "HALT":
        case "LOSS": return "255,51,68";
        case "PROFIT": return "255,204,0";
        default: return "0,242,255";
      }
    };

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      const speed = status === "ANALYZING" || status === "EXECUTING" ? 2.5 : 1;
      const rgb = accent();

      for (const particle of particles) {
        particle.x += particle.vx * speed;
        particle.y += particle.vy * speed;
        particle.z += particle.vz * speed;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        if (particle.z < 0 || particle.z > 500) particle.vz *= -1;

        const perspective = 500 / (500 + particle.z);
        context.beginPath();
        context.arc(particle.x, particle.y, 2 * perspective, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb}, ${0.35 + perspective * 0.35})`;
        context.fill();
      }

      context.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 100) {
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle = `rgba(${rgb}, ${0.12 * (1 - distance / 100)})`;
            context.stroke();
          }
        }
      }

      frame = requestAnimationFrame(render);
    };

    init();
    render();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", init);
    };
  }, [particleCount, status]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-black"
      style={{
        filter: status === "RISK" || status === "HALT" ? "contrast(1.15) brightness(.8)" : undefined,
      }}
    />
  );
};

export default UltronNeuralField;
