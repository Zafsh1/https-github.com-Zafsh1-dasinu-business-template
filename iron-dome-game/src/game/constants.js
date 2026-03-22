// ============================================================
// GAME CONSTANTS — Iron Shield Defense Network
// ============================================================

// ─── THREAT TYPES (per spec) ────────────────────────────
export const THREAT_TYPES = {
  ROCKET: {
    id: 'ROCKET',
    labelHe: 'רקטה',
    speed: 2.0,
    damage: 10,
    points: 100,
    color: '#ff4444',
    radius: 6,
    trailLen: 20,
    interceptors: ['IRON_DOME', 'DAVID_SLING'],
    type: 'rocket',
    spawnWeight: 5,
    warheadKg: 20,
  },
  UAV: {
    id: 'UAV',
    labelHe: 'כטב"ם / שאהד',
    speed: 1.2,
    damage: 15,
    points: 150,
    color: '#ffaa00',
    radius: 9,
    trailLen: 15,
    interceptors: ['IRON_DOME'],
    type: 'drone',
    spawnWeight: 3,
    warheadKg: 40,
    weave: true,
  },
  BALLISTIC: {
    id: 'BALLISTIC',
    labelHe: 'טיל בליסטי',
    speed: 4.0,
    damage: 40,
    points: 500,
    color: '#aa00ff',
    radius: 8,
    trailLen: 30,
    interceptors: ['ARROW', 'DAVID_SLING'],
    type: 'ballistic',
    spawnWeight: 1,
    warheadKg: 500,
    arc: true,
  },
};

// ─── INTERCEPTOR ASSETS (per spec) ───────────────────────
export const INTERCEPTORS = {
  IRON_DOME: {
    id: 'IRON_DOME',
    cost: 50,
    speed: 7,
    color: '#4ade80',
    bgColor: '#052e16',
    label: 'כיפת ברזל',
    labelEn: 'Iron Dome',
    icon: '🛡️',
    key: '1',
    ammo: 20,
    maxAmmo: 20,
    reloadMs: 3000,
    range: 0.28,       // fraction of canvas width
    effectiveness: { rocket: 0.90, drone: 0.80, ballistic: 0.20 },
    canHit: ['ROCKET', 'UAV'],
    description: 'זול ומהיר — לרקטות וכטב"מים',
  },
  DAVID_SLING: {
    id: 'DAVID_SLING',
    cost: 150,
    speed: 10,
    color: '#60a5fa',
    bgColor: '#0c1a2e',
    label: 'קלע דוד',
    labelEn: "David's Sling",
    icon: '⚔️',
    key: '2',
    ammo: 8,
    maxAmmo: 8,
    reloadMs: 8000,
    range: 0.45,
    effectiveness: { rocket: 0.50, drone: 0.85, ballistic: 0.88 },
    canHit: ['ROCKET', 'UAV', 'BALLISTIC'],
    description: 'בינוני-ארוך טווח — למגוון איומים',
  },
  ARROW: {
    id: 'ARROW',
    cost: 500,
    speed: 15,
    color: '#a78bfa',
    bgColor: '#1a0a2e',
    label: 'חץ 3',
    labelEn: 'Arrow 3',
    icon: '🚀',
    key: '3',
    ammo: 3,
    maxAmmo: 3,
    reloadMs: 20000,
    range: 0.75,
    effectiveness: { rocket: 0.05, drone: 0.20, ballistic: 0.92 },
    canHit: ['BALLISTIC'],
    description: 'יקר ומדויק — לטילים בליסטיים בלבד',
  },
};

// ─── CITIES ON MAP ──────────────────────────────────────
// Normalized coords (0–1) within the game canvas area
export const CITIES = {
  tel_aviv:   { name: 'תל אביב',    x: 0.22, y: 0.42, hp: 100, value: 10, pop: 'מטרופולין' },
  jerusalem:  { name: 'ירושלים',    x: 0.33, y: 0.52, hp: 100, value: 10, pop: 'בירה' },
  haifa:      { name: 'חיפה',       x: 0.21, y: 0.25, hp: 100, value: 9,  pop: 'עיר גדולה' },
  beersheva:  { name: 'באר שבע',    x: 0.32, y: 0.70, hp: 100, value: 8,  pop: 'עיר גדולה' },
  ashdod:     { name: 'אשדוד',      x: 0.20, y: 0.57, hp: 100, value: 7,  pop: 'נמל מרכזי' },
  netanya:    { name: 'נתניה',      x: 0.19, y: 0.35, hp: 100, value: 6,  pop: 'עיר' },
  eilat:      { name: 'אילת',       x: 0.36, y: 0.93, hp: 100, value: 5,  pop: 'עיר נמל' },
  dimona:     { name: 'דימונה ⚛️',  x: 0.36, y: 0.73, hp: 100, value: 10, pop: 'אתר אסטרטגי', critical: true },
};

// ─── THREAT FRONTS ──────────────────────────────────────
export const FRONTS = [
  { id: 'hamas',     name: 'חמאס',       flag: '🇵🇸', x: 0.05, y: 0.65, color: '#ff4444', types: ['ROCKET', 'UAV'],              weight: 5 },
  { id: 'hezbollah', name: 'חיזבאללה',   flag: '🇱🇧', x: 0.22, y: 0.01, color: '#ff6600', types: ['ROCKET', 'UAV', 'BALLISTIC'], weight: 4 },
  { id: 'iran',      name: 'איראן',       flag: '🇮🇷', x: 0.98, y: 0.35, color: '#9900cc', types: ['BALLISTIC', 'UAV'],           weight: 2 },
  { id: 'houthis',   name: 'חות\'ים',    flag: '🇾🇪', x: 0.55, y: 0.99, color: '#cc6600', types: ['BALLISTIC', 'ROCKET'],        weight: 2 },
  { id: 'iraq',      name: 'מיליציות',   flag: '🇮🇶', x: 0.95, y: 0.22, color: '#cc3300', types: ['ROCKET', 'UAV'],              weight: 2 },
];

// ─── GAME LEVELS ────────────────────────────────────────
export const LEVELS = [
  {
    id: 1, name: 'גבול עזה', subtitle: 'Hamas Opening Barrage',
    fronts: ['hamas'],
    systems: ['IRON_DOME'],
    duration: 90, spawnRate: 3.5, budget: 5000,
    passScore: 500, goldScore: 2000,
    description: 'חמאס פותח. רקטות בסיסיות. כיפת ברזל בלבד.',
  },
  {
    id: 2, name: 'חזית הצפון', subtitle: 'Hezbollah Joins',
    fronts: ['hamas', 'hezbollah'],
    systems: ['IRON_DOME', 'DAVID_SLING'],
    duration: 120, spawnRate: 2.5, budget: 15000,
    passScore: 2000, goldScore: 7000,
    description: 'חיזבאללה נכנס מהצפון. קלע דוד זמין.',
  },
  {
    id: 3, name: 'מתקפת איראן', subtitle: 'All Fronts — Full Strike',
    fronts: ['hamas', 'hezbollah', 'iran', 'houthis', 'iraq'],
    systems: ['IRON_DOME', 'DAVID_SLING', 'ARROW'],
    duration: 150, spawnRate: 1.8, budget: 50000,
    passScore: 6000, goldScore: 20000,
    description: 'כל החזיתות. טילים בליסטיים מאיראן. חץ 3 נחוץ!',
    isFinal: true,
  },
];

// ─── SCORING ────────────────────────────────────────────
export const SCORING = {
  INTERCEPT_BASE:     100,
  INTERCEPT_EARLY:    50,
  CITY_HIT:           -500,
  CRITICAL_CITY_HIT:  -1500,
  OPEN_FIELD_HIT:     -10,
  WAVE_CLEARED:       200,
  LEVEL_COMPLETE:     1000,
  EFFICIENCY_BONUS:   500,   // > 90% intercept rate
  BUDGET_REMAINING:   0.01,  // per remaining dollar
};

// ─── OPEN FIELD RADIUS ──────────────────────────────────
// Missiles landing further than this from any city = open field
export const CITY_PROTECTION_RADIUS = 0.10; // normalized
