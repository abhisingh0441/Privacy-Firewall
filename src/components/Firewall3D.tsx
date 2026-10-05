import React, { useEffect, useRef } from 'react';
import { RiskLevel } from '../types';

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
  const rotAngleRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, isHover: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Create 3D particles in a sphere shell
    const numParticles = 70;
    interface Particle {
      x: number;
      y: number;
      z: number;
      size: number;
      isThreat: boolean;
      speed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 65 + Math.random() * 45;
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 2 + 1,
        isThreat: i < Math.min(entityCount * 5, 30),
        speed: 0.008 + Math.random() * 0.015,
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

      // Color palette based on Risk
      let primaryColor = '#06b6d4'; // Cyan
      let accentColor = '#3b82f6';  // Blue
      let glowColor = 'rgba(6, 182, 212, 0.25)';

      if (riskLevel === 'CRITICAL' || riskScore >= 80) {
        primaryColor = '#ef4444'; // Red
        accentColor = '#f97316';  // Orange
        glowColor = 'rgba(239, 68, 68, 0.35)';
      } else if (riskLevel === 'HIGH' || riskScore >= 60) {
        primaryColor = '#f97316'; // Orange
        accentColor = '#eab308';  // Amber
        glowColor = 'rgba(249, 115, 22, 0.3)';
      } else if (riskLevel === 'MEDIUM') {
        primaryColor = '#eab308'; // Amber
        accentColor = '#06b6d4';
        glowColor = 'rgba(234, 179, 8, 0.25)';
      } else if (riskLevel === 'SAFE' && entityCount === 0) {
        primaryColor = '#10b981'; // Emerald
        accentColor = '#06b6d4';
        glowColor = 'rgba(16, 185, 129, 0.25)';
      }

      // Backdrop deep radial glow
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 160);
      bgGrad.addColorStop(0, glowColor);
      bgGrad.addColorStop(0.7, 'rgba(11, 15, 23, 0.4)');
      bgGrad.addColorStop(1, 'rgba(11, 15, 23, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Rotation matrix
      rotAngleRef.current += isScanning ? 0.035 : 0.01;
      const angleY = rotAngleRef.current + mouseRef.current.x * 0.001;
      const angleX = 0.25 + mouseRef.current.y * 0.001;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Draw Outer Hexagonal Shield Frame
      ctx.save();
      ctx.translate(centerX, centerY);

      // Hexagon path
      const hexRadius = 110;
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
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Inner faint dashed shield ring
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hAngle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = (hexRadius - 16) * Math.cos(hAngle);
        const hy = (hexRadius - 16) * Math.sin(hAngle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Scan Laser line
      if (isScanning || riskScore > 0) {
        scanBeamY += scanDirection * (isScanning ? 2.5 : 1.2);
        if (scanBeamY > 90) scanDirection = -1;
        if (scanBeamY < -90) scanDirection = 1;

        ctx.save();
        ctx.translate(centerX, centerY + scanBeamY);
        const laserGrad = ctx.createLinearGradient(-100, 0, 100, 0);
        laserGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        laserGrad.addColorStop(0.5, primaryColor);
        laserGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = isScanning ? 2.5 : 1.2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-95, 0);
        ctx.lineTo(95, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Render 3D Wireframe Core Sphere
      const sphereRadius = 38;
      const numLatitude = 7;
      const numLongitude = 10;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Latitudinal circles
      for (let lat = 1; lat < numLatitude; lat++) {
        const latAngle = (Math.PI * lat) / numLatitude - Math.PI / 2;
        const rLat = sphereRadius * Math.cos(latAngle);
        const yLat = sphereRadius * Math.sin(latAngle);

        ctx.beginPath();
        for (let lon = 0; lon <= 24; lon++) {
          const lonAngle = (Math.PI * 2 * lon) / 24 + angleY;
          const px = rLat * Math.cos(lonAngle);
          const pz = rLat * Math.sin(lonAngle);

          // Rotate around X
          const rx = px;
          const ry = yLat * cosX - pz * sinX;
          const rz = yLat * sinX + pz * cosX;

          const fov = 300 / (300 + rz);
          const screenX = rx * fov;
          const screenY = ry * fov;

          if (lon === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.strokeStyle = `rgba(${primaryColor === '#ef4444' ? '239, 68, 68' : '6, 182, 212'}, ${0.2 + (lat / numLatitude) * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Central glowing orb
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, primaryColor);
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Render Orbiting Particles with 3D projection
      particles.forEach((p, idx) => {
        // Orbit update
        const pAngle = p.speed;
        const nx = p.x * Math.cos(pAngle) - p.z * Math.sin(pAngle);
        const nz = p.x * Math.sin(pAngle) + p.z * Math.cos(pAngle);
        p.x = nx;
        p.z = nz;

        // Apply 3D rotation
        const px1 = p.x * cosY - p.z * sinY;
        const pz1 = p.x * sinY + p.z * cosY;
        const py2 = p.y * cosX - pz1 * sinX;
        const pz2 = p.y * sinX + pz1 * cosX;

        const fov = 320 / (320 + pz2);
        const sx = px1 * fov;
        const sy = py2 * fov;

        const alpha = Math.max(0.2, (pz2 + 120) / 240);
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * fov, 0, Math.PI * 2);

        if (p.isThreat || (idx < entityCount * 3)) {
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = `rgba(${primaryColor === '#ef4444' ? '249, 115, 22' : '56, 189, 248'}, ${alpha * 0.8})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = accentColor;
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
      mouseRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
        isHover: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: 0, y: 0, isHover: false };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
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
      ? 'text-rose-400 border-rose-500/40 bg-rose-950/40'
      : riskScore >= 60
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0e1626]/90 via-[#0a0e17]/95 to-[#070a10] p-4 shadow-2xl backdrop-blur-md">
      {/* Top telemetry bar */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
          </span>
          <span>LATENCY: {latencyMs}ms</span>
        </div>
        <div className={`flex items-center gap-1.5 rounded border px-2 py-0.5 font-semibold text-[11px] ${statusColorClass}`}>
          <span>🛡</span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative my-2 flex h-52 w-full items-center justify-center">
        <canvas
          ref={canvasRef}
          width={380}
          height={210}
          className="max-h-full max-w-full cursor-crosshair select-none"
        />
      </div>

      {/* Bottom telemetry indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">RULESET:</span>
          <span className="text-cyan-400">v4.19-STRICT</span>
        </div>
        <div className="text-slate-400">
          PARSED {charCount} CHARS
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${entityCount > 0 ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          <span className={entityCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {entityCount} {entityCount === 1 ? 'REDACTION' : 'REDACTIONS'}
          </span>
        </div>
      </div>
    </div>
  );
};
