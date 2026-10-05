import React, { useEffect, useRef, useState } from 'react';
import { RiskLevel } from '../types';
import { playClickSound } from '../utils/cyberAudio';

interface Firewall3DProps {
  riskLevel: RiskLevel;
  riskScore: number;
  entityCount: number;
  latencyMs: number;
  isScanning: boolean;
  charCount: number;
}

export const Firewall3D: React.FC<Firewall3DProps> = ({
  riskLevel,
  riskScore,
  entityCount,
  latencyMs,
  isScanning,
  charCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rotAngleRef = useRef(0);
  const pulseRef = useRef(0);
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Generate orbiting shell particles
    const numParticles = 85;
    interface Particle {
      x: number;
      y: number;
      z: number;
      size: number;
      isThreat: boolean;
      speed: number;
      colorOffset: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 60 + Math.random() * 55;
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 2.2 + 1,
        isThreat: i < Math.min(entityCount * 5, 32),
        speed: 0.009 + Math.random() * 0.016,
        colorOffset: Math.random() * 0.4,
      });
    }

    // Packet streams (flowing down through firewall)
    const packets: { x: number; y: number; speed: number; size: number; isSanitized: boolean }[] = [];
    for (let i = 0; i < 18; i++) {
      packets.push({
        x: (Math.random() - 0.5) * 140,
        y: -110 + Math.random() * 220,
        speed: 1.2 + Math.random() * 1.8,
        size: Math.random() * 2 + 1.5,
        isSanitized: false,
      });
    }

    let scanBeamY = 0;
    let scanDirection = 1;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.08;
      mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.08;

      // Color palette based on Risk
      let primaryColor = '#06b6d4'; // Cyan
      let secondaryColor = '#3b82f6'; // Blue
      let glowRgba = 'rgba(6, 182, 212, 0.28)';

      if (riskLevel === 'CRITICAL' || riskScore >= 80) {
        primaryColor = '#f43f5e'; // Rose Red
        secondaryColor = '#fb923c'; // Orange
        glowRgba = 'rgba(244, 63, 94, 0.35)';
      } else if (riskLevel === 'HIGH' || riskScore >= 60) {
        primaryColor = '#f97316'; // Orange
        secondaryColor = '#facc15'; // Amber
        glowRgba = 'rgba(249, 115, 22, 0.3)';
      } else if (riskLevel === 'MEDIUM') {
        primaryColor = '#eab308'; // Amber
        secondaryColor = '#06b6d4';
        glowRgba = 'rgba(234, 179, 8, 0.25)';
      } else if (riskLevel === 'SAFE' && entityCount === 0) {
        primaryColor = '#10b981'; // Emerald
        secondaryColor = '#06b6d4';
        glowRgba = 'rgba(16, 185, 129, 0.28)';
      }

      // Backdrop deep radial volumetric glow
      pulseRef.current += 0.03;
      const pulseScale = 1 + Math.sin(pulseRef.current) * 0.08;
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        8,
        centerX,
        centerY,
        155 * pulseScale
      );
      bgGrad.addColorStop(0, glowRgba);
      bgGrad.addColorStop(0.65, 'rgba(10, 14, 23, 0.5)');
      bgGrad.addColorStop(1, 'rgba(7, 10, 16, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Rotation angles with gyro mouse influence
      rotAngleRef.current += isScanning ? 0.04 : 0.012;
      const angleY = rotAngleRef.current + mouseRef.current.currentX * 0.0018;
      const angleX = 0.28 + mouseRef.current.currentY * 0.0015;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Render Packet Streams (Data entering from top, emerging sanitized from bottom)
      packets.forEach(pkt => {
        pkt.y += pkt.speed * (isScanning ? 2 : 1);
        if (pkt.y > 105) {
          pkt.y = -105;
          pkt.x = (Math.random() - 0.5) * 140;
        }
        pkt.isSanitized = pkt.y > 0;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, pkt.size, 0, Math.PI * 2);
        if (pkt.isSanitized) {
          ctx.fillStyle = primaryColor === '#f43f5e' ? 'rgba(244, 63, 94, 0.7)' : 'rgba(52, 211, 153, 0.75)';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        }
        ctx.fill();
        ctx.restore();
      });

      // 3D Hexagonal Defense Ring 1
      ctx.save();
      ctx.translate(centerX, centerY);

      const hexRadius = 112 * pulseScale;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hAngle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = hexRadius * Math.cos(hAngle);
        const hy = hexRadius * Math.sin(hAngle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Dashed Secondary Outer Ring with Counter-Rotation
      ctx.save();
      ctx.rotate(-rotAngleRef.current * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 126, 0, Math.PI * 2);
      ctx.setLineDash([5, 12]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tick markers on outer ring
      for (let t = 0; t < 12; t++) {
        const tAngle = (Math.PI * 2 * t) / 12;
        const tx1 = 120 * Math.cos(tAngle);
        const ty1 = 120 * Math.sin(tAngle);
        const tx2 = 127 * Math.cos(tAngle);
        const ty2 = 127 * Math.sin(tAngle);
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.strokeStyle = t % 3 === 0 ? primaryColor : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = t % 3 === 0 ? 1.5 : 1;
        ctx.stroke();
      }
      ctx.restore();

      // Laser Scanner line
      scanBeamY += scanDirection * (isScanning ? 2.8 : 1.2);
      if (scanBeamY > 85) scanDirection = -1;
      if (scanBeamY < -85) scanDirection = 1;

      ctx.save();
      ctx.translate(0, scanBeamY);
      const laserGrad = ctx.createLinearGradient(-105, 0, 105, 0);
      laserGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      laserGrad.addColorStop(0.5, primaryColor);
      laserGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.strokeStyle = laserGrad;
      ctx.lineWidth = isScanning ? 2.5 : 1.2;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-100, 0);
      ctx.lineTo(100, 0);
      ctx.stroke();
      ctx.restore();

      // Render 3D Wireframe Core Sphere
      const sphereRadius = 40;
      const numLatitude = 7;

      // Latitudinal wireframe
      for (let lat = 1; lat < numLatitude; lat++) {
        const latAngle = (Math.PI * lat) / numLatitude - Math.PI / 2;
        const rLat = sphereRadius * Math.cos(latAngle);
        const yLat = sphereRadius * Math.sin(latAngle);

        ctx.beginPath();
        for (let lon = 0; lon <= 24; lon++) {
          const lonAngle = (Math.PI * 2 * lon) / 24 + angleY;
          const px = rLat * Math.cos(lonAngle);
          const pz = rLat * Math.sin(lonAngle);

          const rx = px;
          const ry = yLat * cosX - pz * sinX;
          const rz = yLat * sinX + pz * cosX;

          const fov = 320 / (320 + rz);
          const screenX = rx * fov;
          const screenY = ry * fov;

          if (lon === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.strokeStyle = `rgba(${primaryColor === '#f43f5e' ? '244, 63, 94' : '6, 182, 212'}, ${
          0.18 + (lat / numLatitude) * 0.22
        })`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Central glowing orb
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, primaryColor);
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Particles with depth-based shadows
      particles.forEach((p, idx) => {
        const pAngle = p.speed;
        const nx = p.x * Math.cos(pAngle) - p.z * Math.sin(pAngle);
        const nz = p.x * Math.sin(pAngle) + p.z * Math.cos(pAngle);
        p.x = nx;
        p.z = nz;

        const px1 = p.x * cosY - p.z * sinY;
        const pz1 = p.x * sinY + p.z * cosY;
        const py2 = p.y * cosX - pz1 * sinX;
        const pz2 = p.y * sinX + pz1 * cosX;

        const fov = 330 / (330 + pz2);
        const sx = px1 * fov;
        const sy = py2 * fov;

        const alpha = Math.max(0.18, (pz2 + 130) / 260);
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * fov, 0, Math.PI * 2);

        if (p.isThreat || idx < entityCount * 3) {
          ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(${primaryColor === '#f43f5e' ? '251, 146, 60' : '56, 189, 248'}, ${
            alpha * 0.85
          })`;
          ctx.shadowColor = secondaryColor;
          ctx.shadowBlur = 4;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left - rect.width / 2;
      mouseRef.current.targetY = e.clientY - rect.top - rect.height / 2;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.targetX = e.touches[0].clientX - rect.left - rect.width / 2;
        mouseRef.current.targetY = e.touches[0].clientY - rect.top - rect.height / 2;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [riskLevel, riskScore, entityCount, latencyMs, isScanning]);

  const statusLabel = isScanning
    ? 'SCANNING BUFFER'
    : riskScore >= 80
    ? 'THREAT BLOCKED'
    : riskScore >= 60
    ? 'HIGH RISK DETECTED'
    : riskScore > 0
    ? 'ARMED & FILTERING'
    : 'INSPECTOR ARMED';

  const statusColorClass =
    riskScore >= 80
      ? 'text-rose-400 border-rose-500/40 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
      : riskScore >= 60
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]';

  return (
    <div
      ref={containerRef}
      onClick={() => {
        playClickSound();
        setIsInteractive(!isInteractive);
      }}
      className="interactive-card relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0e1626]/90 via-[#0a0e17]/95 to-[#070a10] p-4 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40"
    >
      {/* Top telemetry bar */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
          </span>
          <span className="font-semibold">LATENCY: {latencyMs}ms</span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold text-[11px] transition-all ${statusColorClass}`}
        >
          <span>🛡</span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* 3D Canvas Viewport with responsive sizing */}
      <div className="relative my-1 flex h-52 w-full items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={215}
          className="max-h-full max-w-full cursor-grab active:cursor-grabbing select-none"
        />
        <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] font-mono text-slate-500 opacity-70">
          Drag / Move to orient
        </div>
      </div>

      {/* Bottom telemetry indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">RULESET:</span>
          <span className="text-cyan-400 font-semibold">v4.19-STRICT</span>
        </div>
        <div className="text-slate-400 font-medium">
          PARSED {charCount} CHARS
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              entityCount > 0 ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
            }`}
          ></span>
          <span className={entityCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {entityCount} {entityCount === 1 ? 'REDACTION' : 'REDACTIONS'}
          </span>
        </div>
      </div>
    </div>
  );
};
