// ============================================================
// GAME CANVAS — Canvas Renderer for React
// ============================================================
import { useRef, useEffect, useCallback } from 'react';
import { CITIES, INTERCEPTORS, THREAT_TYPES } from '../game/constants.js';

// Israel map polygon (normalized 0–1)
const ISRAEL_POLY = [
  [0.16,0.12],[0.22,0.08],[0.30,0.09],[0.37,0.11],
  [0.43,0.18],[0.44,0.28],[0.40,0.36],[0.38,0.44],
  [0.40,0.52],[0.38,0.60],[0.32,0.65],[0.30,0.72],
  [0.34,0.78],[0.36,0.87],[0.35,0.95],[0.32,0.97],
  [0.26,0.88],[0.20,0.76],[0.14,0.64],[0.12,0.54],
  [0.13,0.44],[0.15,0.34],[0.14,0.24],[0.16,0.12],
];

export default function GameCanvas({ snapshot, onThreatClick, selectedSystem, W, H }) {
  const canvasRef = useRef(null);

  // Stars (stable)
  const starsRef = useRef(
    Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }))
  );

  const draw = useCallback((ctx, snap) => {
    if (!snap) return;
    const { threats, interceptors, explosions, cities, batteries, level } = snap;

    // Background
    ctx.fillStyle = level?.background || '#0a1520';
    ctx.fillRect(0, 0, W, H);

    // Stars
    const now = Date.now() * 0.001;
    for (const s of starsRef.current) {
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(now + s.phase));
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Israel map
    drawIsraelMap(ctx, W, H);

    // Battery range indicators
    if (batteries) {
      for (const [sysId, bat] of Object.entries(batteries)) {
        const sys = INTERCEPTORS[sysId];
        if (!sys) continue;
        const cx = 0.25 * W, cy = 0.50 * H;
        ctx.save();
        ctx.strokeStyle = sys.color + '22';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, sys.range * W, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Cities
    if (cities) {
      for (const [key, city] of Object.entries(cities)) {
        drawCity(ctx, key, city, W, H);
      }
    }

    // Threats
    for (const t of threats || []) {
      if (!t.active) continue;
      drawThreat(ctx, t, W, H);
    }

    // Interceptors
    for (const i of interceptors || []) {
      if (!i.active) continue;
      drawInterceptor(ctx, i);
    }

    // Explosions
    for (const e of explosions || []) {
      if (!e.active) continue;
      drawExplosion(ctx, e);
    }

    // Cursor hint on hovered threat
    ctx.restore?.();
  }, [W, H]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    draw(ctx, snapshot);
  }, [snapshot, draw]);

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if (!snapshot?.threats) return;
    // Find nearest threat
    let nearest = null, nearDist = 45;
    for (const t of snapshot.threats) {
      if (!t.active) continue;
      const d = Math.hypot(t.x - cx, t.y - cy);
      if (d < nearDist) { nearest = t; nearDist = d; }
    }
    if (nearest) onThreatClick(nearest.id, selectedSystem);
  }

  function handleTouch(e) {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.changedTouches[0];
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = (t.clientX - rect.left) * scaleX;
    const cy = (t.clientY - rect.top) * scaleY;

    if (!snapshot?.threats) return;
    let nearest = null, nearDist = 60; // larger touch target
    for (const threat of snapshot.threats) {
      if (!threat.active) continue;
      const d = Math.hypot(threat.x - cx, threat.y - cy);
      if (d < nearDist) { nearest = threat; nearDist = d; }
    }
    if (nearest) onThreatClick(nearest.id, selectedSystem);
  }

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={handleClick}
      onTouchEnd={handleTouch}
      className="w-full h-full cursor-crosshair touch-none"
      style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
    />
  );
}

// ─── DRAW HELPERS ────────────────────────────────────────

function drawIsraelMap(ctx, W, H) {
  const pts = ISRAEL_POLY.map(([nx, ny]) => [nx * W, ny * H]);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = '#1a2b1a';
  ctx.fill();
  ctx.strokeStyle = '#2255aa';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Mediterranean sea gradient
  const grad = ctx.createLinearGradient(0, 0, pts[0][0] * 0.9, 0);
  grad.addColorStop(0, 'rgba(0,60,140,0.4)');
  grad.addColorStop(1, 'rgba(0,60,140,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pts[0][0] * 0.9, H);
  ctx.restore();
}

function drawCity(ctx, key, city, W, H) {
  const cx = city.x * W;
  const cy = city.y * H;
  const hpR = city.hp / 100;

  ctx.save();

  // Glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
  const gColor = hpR > 0.6 ? 'rgba(255,200,80,' : hpR > 0.3 ? 'rgba(255,120,0,' : 'rgba(255,30,0,';
  grad.addColorStop(0, gColor + '0.35)');
  grad.addColorStop(1, gColor + '0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  // Dot
  const dotColor = hpR > 0.6 ? '#ffcc44' : hpR > 0.3 ? '#ff8800' : '#ff3300';
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();

  // Critical marker
  if (city.critical) {
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // HP bar
  if (city.hp < 100) {
    const bw = 30, bh = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - bw / 2, cy + 12, bw, bh);
    ctx.fillStyle = hpR > 0.6 ? '#00ff44' : hpR > 0.3 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(cx - bw / 2, cy + 12, bw * hpR, bh);
  }

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(city.name, cx, cy + 18);

  ctx.restore();
}

function drawThreat(ctx, t, W, H) {
  const tdata = THREAT_TYPES[t.type] || {};

  // Trail
  if (t.trail?.length > 1) {
    ctx.save();
    for (let i = 1; i < t.trail.length; i++) {
      const a = (i / t.trail.length) * 0.5;
      ctx.strokeStyle = tdata.color + Math.floor(a * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = tdata.type === 'drone' ? 1 : 2;
      ctx.beginPath();
      ctx.moveTo(t.trail[i - 1].x, t.trail[i - 1].y);
      ctx.lineTo(t.trail[i].x, t.trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(t.x, t.y);

  if (tdata.type === 'drone') {
    // Drone shape
    ctx.fillStyle = tdata.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tdata.color + '88';
    ctx.fillRect(-14, -1, 28, 2); // wings
  } else {
    // Missile
    const angle = Math.atan2(t.targetY - t.startY, t.targetX - t.startX);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = tdata.color;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    // Exhaust
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.ellipse(0, 5, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // High threat indicator
  if ((tdata.points || 0) >= 300) {
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawInterceptor(ctx, i) {
  // Trail
  if (i.trail?.length > 1) {
    ctx.save();
    for (let j = 1; j < i.trail.length; j++) {
      const a = (j / i.trail.length) * 0.7;
      ctx.strokeStyle = i.color + Math.floor(a * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i.trail[j - 1].x, i.trail[j - 1].y);
      ctx.lineTo(i.trail[j].x, i.trail[j].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (!i.target) return;
  const dx = i.target.x - i.x;
  const dy = i.target.y - i.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(i.x, i.y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = i.color;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(3, 4);
  ctx.lineTo(-3, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, -7, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExplosion(ctx, e) {
  const ease = 1 - Math.pow(1 - e.progress, 3);
  const alpha = 1 - e.progress;

  ctx.save();
  ctx.translate(e.x, e.y);

  // Core
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.radius * ease);
  grad.addColorStop(0, e.color + 'ff');
  grad.addColorStop(0.5, e.color + '88');
  grad.addColorStop(1, e.color + '00');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * ease, 0, Math.PI * 2);
  ctx.fill();

  // Particles
  for (const p of e.particles || []) {
    ctx.globalAlpha = p.life * alpha;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life || 2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Intercept ring
  if (e.isIntercept) {
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * ease * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // Floating label
  if (e.label && e.progress < 0.55) {
    const a = 1 - e.progress / 0.55;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = e.isIntercept ? '#00ff88' : '#ff4444';
    ctx.textAlign = 'center';
    ctx.fillText(e.label, e.x, e.y - 30 - e.progress * 30);
    ctx.restore();
  }
}
