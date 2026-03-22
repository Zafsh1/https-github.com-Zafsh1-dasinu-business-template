// ============================================================
// GAME ENGINE — Physics, Entities, Loop
// Iron Shield Defense Network
// ============================================================
import {
  THREAT_TYPES, INTERCEPTORS, CITIES, FRONTS, LEVELS,
  SCORING, CITY_PROTECTION_RADIUS,
} from './constants.js';

let _nextId = 1;
const uid = () => _nextId++;

// ─── THREAT ENTITY ──────────────────────────────────────
export function createThreat({ type, front, targetCityKey, W, H }) {
  const tdata = THREAT_TYPES[type];
  const targetCity = CITIES[targetCityKey];
  const fx = front.x * W;
  const fy = front.y * H;
  const tx = targetCity.x * W + (Math.random() - 0.5) * 30;
  const ty = targetCity.y * H + (Math.random() - 0.5) * 30;
  const dx = tx - fx;
  const dy = ty - fy;
  const dist = Math.hypot(dx, dy);

  return {
    id: uid(),
    type,
    frontId: front.id,
    targetCityKey,
    x: fx,
    y: fy,
    startX: fx,
    startY: fy,
    targetX: tx,
    targetY: ty,
    dirX: dx / dist,
    dirY: dy / dist,
    totalDist: dist,
    traveledDist: 0,
    trail: [],
    active: true,
    reached: false,
    intercepted: false,
    weaveOffset: 0,
    arcOffset: 0,
    data: tdata,
  };
}

// ─── INTERCEPTOR ENTITY ─────────────────────────────────
export function createInterceptor({ systemId, launchX, launchY, target }) {
  const sys = INTERCEPTORS[systemId];
  return {
    id: uid(),
    systemId,
    x: launchX,
    y: launchY,
    target,
    trail: [],
    active: true,
    speed: sys.speed,
    color: sys.color,
    data: sys,
  };
}

// ─── EXPLOSION ENTITY ───────────────────────────────────
export function createExplosion({ x, y, radius, color, isIntercept, label }) {
  return {
    id: uid(),
    x, y,
    radius,
    color,
    isIntercept,
    label,
    progress: 0,
    active: true,
    duration: isIntercept ? 0.7 : 1.0,
    particles: Array.from({ length: isIntercept ? 12 : 20 }, (_, i) => {
      const a = (i / (isIntercept ? 12 : 20)) * Math.PI * 2 + Math.random() * 0.5;
      const s = 1 + Math.random() * 3;
      return { x: 0, y: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 };
    }),
  };
}

// ─── OPEN FIELD CHECK ───────────────────────────────────
export function isOpenField(tx, ty, W, H) {
  for (const city of Object.values(CITIES)) {
    const cx = city.x * W;
    const cy = city.y * H;
    const dist = Math.hypot(tx - cx, ty - cy) / W;
    if (dist < CITY_PROTECTION_RADIUS) return false;
  }
  return true;
}

// ─── MAIN GAME ENGINE CLASS ─────────────────────────────
export class GameEngine {
  constructor({ W, H, level, onScoreChange, onBudgetChange, onCityHit, onIntercept, onLevelEnd, onMessage }) {
    this.W = W;
    this.H = H;
    this.level = LEVELS[level];
    this.onScoreChange  = onScoreChange;
    this.onBudgetChange = onBudgetChange;
    this.onCityHit      = onCityHit;
    this.onIntercept    = onIntercept;
    this.onLevelEnd     = onLevelEnd;
    this.onMessage      = onMessage;

    // State
    this.threats      = [];
    this.interceptors = [];
    this.explosions   = [];
    this.score        = 0;
    this.budget       = this.level.budget;
    this.cities       = this._initCities();
    this.batteries    = this._initBatteries();
    this.stats        = { intercepted: 0, total: 0, missed: 0, cityHits: 0 };

    // Spawn timing
    this.spawnTimer   = 1;
    this.levelTimer   = this.level.duration;
    this.combo        = 0;
    this.comboTimer   = 0;
    this.running      = false;
    this._raf         = null;
    this._lastTs      = null;

    // Waves
    this.waveNum    = 0;
    this.waveTimer  = 5;
  }

  _initCities() {
    return Object.fromEntries(
      Object.entries(CITIES).map(([k, v]) => [k, { ...v, hp: 100 }])
    );
  }

  _initBatteries() {
    const batteries = {};
    for (const sysId of this.level.systems) {
      const sys = INTERCEPTORS[sysId];
      batteries[sysId] = {
        ...sys,
        ammo: sys.maxAmmo,
        reloadTimer: 0,
        reloading: false,
      };
    }
    return batteries;
  }

  // ─── START / STOP ──────────────────────────────────────
  start() {
    this.running = true;
    this._lastTs = null;
    this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  // ─── MAIN LOOP ─────────────────────────────────────────
  _loop(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min((ts - this._lastTs) / 1000, 0.05);
    this._lastTs = ts;

    this._update(dt);

    if (this.running) {
      this._raf = requestAnimationFrame(ts2 => this._loop(ts2));
    }
  }

  // ─── UPDATE ────────────────────────────────────────────
  _update(dt) {
    this.levelTimer -= dt;
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = 0;

    // Battery reload
    for (const bat of Object.values(this.batteries)) {
      if (bat.reloading) {
        bat.reloadTimer -= dt * 1000;
        if (bat.reloadTimer <= 0) {
          bat.ammo = Math.min(bat.maxAmmo, bat.ammo + 1);
          bat.reloading = bat.ammo < bat.maxAmmo;
          if (bat.reloading) bat.reloadTimer = bat.reloadMs;
        }
      }
    }

    // Spawn threats
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnThreat();
      this.spawnTimer = this.level.spawnRate * (0.7 + Math.random() * 0.6);
    }

    // Update threats
    for (const t of this.threats) this._updateThreat(t, dt);

    // Update interceptors
    for (const i of this.interceptors) this._updateInterceptor(i, dt);

    // Update explosions
    for (const e of this.explosions) this._updateExplosion(e, dt);

    // Collision detection
    this._checkCollisions();

    // Check city hits
    this._checkCityHits();

    // Cleanup
    this.threats      = this.threats.filter(t => t.active);
    this.interceptors = this.interceptors.filter(i => i.active);
    this.explosions   = this.explosions.filter(e => e.active);

    // Level end
    if (this.levelTimer <= 0 && this.threats.length === 0) {
      this._finishLevel();
    }
  }

  _updateThreat(t, dt) {
    if (!t.active) return;
    const step = t.data.speed * dt * 60 * 0.6;
    t.traveledDist += step;
    const progress = Math.min(t.traveledDist / t.totalDist, 1);

    let nx = t.startX + (t.targetX - t.startX) * progress;
    let ny = t.startY + (t.targetY - t.startY) * progress;

    // Arc for ballistic
    if (t.data.arc) {
      ny -= Math.sin(progress * Math.PI) * Math.min(t.totalDist * 0.4, this.H * 0.4);
    }

    // Weave for drones
    if (t.data.weave) {
      t.weaveOffset += 0.08;
      const px = -t.dirY;
      const py = t.dirX;
      nx += px * Math.sin(t.weaveOffset) * 8;
      ny += py * Math.sin(t.weaveOffset) * 8;
    }

    t.trail.push({ x: t.x, y: t.y });
    if (t.trail.length > t.data.trailLen) t.trail.shift();

    t.x = nx;
    t.y = ny;

    if (progress >= 1) {
      t.reached = true;
      t.active  = false;
    }
  }

  _updateInterceptor(i, dt) {
    if (!i.active) return;
    if (!i.target || !i.target.active) {
      i.active = false;
      return;
    }
    const dx   = i.target.x - i.x;
    const dy   = i.target.y - i.y;
    const dist = Math.hypot(dx, dy);
    const step = i.speed * dt * 60 * 0.6;

    if (dist <= step + 6) {
      i.active = false; // handled in collision
      return;
    }

    i.trail.push({ x: i.x, y: i.y });
    if (i.trail.length > 15) i.trail.shift();

    i.x += (dx / dist) * step;
    i.y += (dy / dist) * step;
  }

  _updateExplosion(e, dt) {
    e.progress += dt / e.duration;
    if (e.progress >= 1) { e.active = false; return; }
    for (const p of e.particles) {
      p.x  += p.vx * dt * 60;
      p.y  += p.vy * dt * 60;
      p.vy += 0.04;
      p.life -= dt / e.duration;
    }
  }

  // ─── SPAWN ─────────────────────────────────────────────
  _spawnThreat() {
    const fronts = FRONTS.filter(f => this.level.fronts.includes(f.id));
    // Weighted random front
    const totalW = fronts.reduce((s, f) => s + f.weight, 0);
    let r = Math.random() * totalW;
    const front = fronts.find(f => (r -= f.weight) <= 0) || fronts[0];

    // Allowed types based on level progression
    const elapsed = this.level.duration - this.levelTimer;
    const allowBallistic = elapsed > 20 || this.level.id >= 3;
    const allowedTypes = front.types.filter(t => t !== 'BALLISTIC' || allowBallistic);
    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

    const cityKeys = Object.keys(this.cities);
    const targetKey = cityKeys[Math.floor(Math.random() * cityKeys.length)];

    const threat = createThreat({ type, front, targetCityKey: targetKey, W: this.W, H: this.H });
    this.threats.push(threat);
    this.stats.total++;
  }

  // ─── FIRE ──────────────────────────────────────────────
  fire(threatId, systemId) {
    const sys = this.batteries[systemId];
    if (!sys || sys.ammo <= 0) {
      this.onMessage('🚫 אין תחמושת!', 'error');
      return false;
    }

    const threat = this.threats.find(t => t.id === threatId && t.active);
    if (!threat) return false;

    // Check compatibility
    const tdata = THREAT_TYPES[threat.type];
    const effectiveness = sys.effectiveness[tdata.type] || 0;
    if (effectiveness < 0.1) {
      this.onMessage(`⚠️ ${sys.label} לא מתאים ל${tdata.labelHe}!`, 'warn');
      return false;
    }

    // Check range
    const launchX = 0.25 * this.W;
    const launchY = 0.50 * this.H;
    const rangePx = sys.range * this.W;
    const dist = Math.hypot(threat.x - launchX, threat.y - launchY);
    if (dist > rangePx) {
      this.onMessage(`📍 מחוץ לטווח ${sys.label}`, 'warn');
      return false;
    }

    // Deduct budget
    this.budget -= sys.cost;
    if (this.budget < 0) this.budget = 0;
    this.onBudgetChange(this.budget);

    // Ammo
    sys.ammo--;
    if (!sys.reloading && sys.ammo < sys.maxAmmo) {
      sys.reloading   = true;
      sys.reloadTimer = sys.reloadMs;
    }

    // Create interceptor
    const interceptor = createInterceptor({
      systemId,
      launchX,
      launchY,
      target: threat,
    });
    this.interceptors.push(interceptor);

    const pct = Math.round(effectiveness * 100);
    this.onMessage(`🎯 ${sys.label} → ${tdata.labelHe} (${pct}% הצלחה)`, 'info');
    return true;
  }

  // ─── COLLISIONS ────────────────────────────────────────
  _checkCollisions() {
    for (const interceptor of this.interceptors) {
      if (!interceptor.active) continue;
      const t = interceptor.target;
      if (!t || !t.active) { interceptor.active = false; continue; }

      const dist = Math.hypot(interceptor.x - t.x, interceptor.y - t.y);
      if (dist > 14) continue;

      // Attempt intercept
      const sys    = INTERCEPTORS[interceptor.systemId];
      const tdata  = THREAT_TYPES[t.type];
      const hitP   = sys.effectiveness[tdata.type] || 0.5;
      const success = Math.random() < hitP;

      interceptor.active = false;
      t.active = false;
      t.intercepted = success;

      if (success) {
        this.stats.intercepted++;
        this.combo++;
        this.comboTimer = 3;

        const comboMult = this.combo >= 3 ? 1.5 : 1;
        const pts = Math.round(tdata.points * comboMult);
        this.score += pts;
        this.onScoreChange(this.score);
        this.onIntercept({ type: t.type, score: pts, combo: this.combo });

        this.explosions.push(createExplosion({
          x: t.x, y: t.y,
          radius: 20 + tdata.warheadKg / 30,
          color: sys.color,
          isIntercept: true,
          label: `+${pts}${this.combo >= 3 ? ' ×' + this.combo : ''}`,
        }));
      } else {
        // Interceptor missed
        this.explosions.push(createExplosion({
          x: interceptor.x, y: interceptor.y,
          radius: 10, color: '#888', isIntercept: false, label: 'החטאה',
        }));
        // Re-spawn threat direction approximation
        t.active = true; // let it continue to city
      }
    }
  }

  _checkCityHits() {
    const reached = this.threats.filter(t => t.reached && !t.intercepted);
    for (const t of reached) {
      const tdata = THREAT_TYPES[t.type];
      const openField = isOpenField(t.targetX, t.targetY, this.W, this.H);

      if (openField) {
        this.score = Math.max(0, this.score + SCORING.OPEN_FIELD_HIT);
        this.onMessage('💨 נחת בשטח פתוח — אין נפגעים', 'info');
        this.explosions.push(createExplosion({
          x: t.targetX, y: t.targetY,
          radius: 20, color: '#886600', isIntercept: false, label: 'שטח פתוח',
        }));
      } else {
        const city = this.cities[t.targetCityKey];
        if (city) {
          city.hp = Math.max(0, city.hp - tdata.damage);
          const penalty = city.critical ? SCORING.CRITICAL_CITY_HIT : SCORING.CITY_HIT;
          this.score = Math.max(0, this.score + penalty);
          this.stats.cityHits++;
          this.stats.missed++;
          this.combo = 0;
          this.onScoreChange(this.score);
          this.onCityHit({ cityKey: t.targetCityKey, city, threat: t, penalty });

          this.explosions.push(createExplosion({
            x: city.x * this.W, y: city.y * this.H,
            radius: 40 + tdata.warheadKg / 10,
            color: '#ff4400',
            isIntercept: false,
            label: `💥 ${city.name}`,
          }));
        }
      }
    }
    // Remove reached ones
    this.threats = this.threats.filter(t => !t.reached);
  }

  // ─── LEVEL COMPLETE ─────────────────────────────────────
  _finishLevel() {
    this.stop();
    const pct  = this.stats.total > 0
      ? Math.round((this.stats.intercepted / this.stats.total) * 100)
      : 100;
    if (pct >= 90) this.score += SCORING.EFFICIENCY_BONUS;
    this.score += SCORING.LEVEL_COMPLETE;
    this.score += Math.floor(this.budget * SCORING.BUDGET_REMAINING);
    this.onScoreChange(this.score);
    this.onLevelEnd({
      score:      this.score,
      passed:     this.score >= this.level.passScore,
      gold:       this.score >= this.level.goldScore,
      stats:      this.stats,
      budget:     this.budget,
      interceptPct: pct,
      levelId:    this.level.id,
    });
  }

  // ─── GETTERS ──────────────────────────────────────────
  getSnapshot() {
    return {
      threats:      this.threats,
      interceptors: this.interceptors,
      explosions:   this.explosions,
      cities:       this.cities,
      batteries:    this.batteries,
      score:        this.score,
      budget:       this.budget,
      levelTimer:   Math.max(0, this.levelTimer),
      stats:        this.stats,
      combo:        this.combo,
      level:        this.level,
    };
  }
}
