// ============================================================
// APP ROOT — Iron Shield Defense Network
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import Menu from './components/Menu.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import Certificate from './components/Certificate.jsx';
import { GameEngine } from './game/engine.js';
import { useGlobalStats, useUserScore } from './hooks/useFirestore.js';
import { useAudio } from './hooks/useAudio.js';
import { INTERCEPTORS, LEVELS } from './game/constants.js';

const CANVAS_W = 900;
const CANVAS_H = 600;

const SCREEN = {
  MENU:    'menu',
  PLAYING: 'playing',
  PAUSED:  'paused',
  RESULT:  'result',
};

let msgId = 0;

export default function App() {
  const [screen, setScreen]           = useState(SCREEN.MENU);
  const [levelIdx, setLevelIdx]       = useState(0);
  const [snapshot, setSnapshot]       = useState(null);
  const [selectedSystem, setSelected] = useState('IRON_DOME');
  const [result, setResult]           = useState(null);
  const [messages, setMessages]       = useState([]);

  const engineRef = useRef(null);
  const rafRef    = useRef(null);
  const pausedRef = useRef(false);

  const { stats: globalStats } = useGlobalStats();
  const { bestScore, submitScore } = useUserScore();
  const audio = useAudio();

  // ─── RENDER LOOP ──────────────────────────────────────
  const renderLoop = useCallback(() => {
    if (pausedRef.current) { rafRef.current = requestAnimationFrame(renderLoop); return; }
    if (engineRef.current) {
      setSnapshot({ ...engineRef.current.getSnapshot() });
    }
    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  // ─── START LEVEL ──────────────────────────────────────
  function startLevel(idx) {
    setLevelIdx(idx);
    setMessages([]);
    setResult(null);

    const engine = new GameEngine({
      W: CANVAS_W,
      H: CANVAS_H,
      level: idx,
      onScoreChange: () => {},
      onBudgetChange: () => {},
      onCityHit: ({ city }) => {
        audio.playCityHit();
        pushMessage(`💥 ${city.name} נפגעה!`, 'error');
      },
      onIntercept: ({ score: pts, combo }) => {
        audio.playIntercept();
        if (combo >= 3) audio.playCombo(combo);
      },
      onLevelEnd: async (res) => {
        setResult(res);
        setScreen(SCREEN.RESULT);
        cancelAnimationFrame(rafRef.current);
        // Submit to Firestore
        await submitScore({
          score: res.score,
          levelId: res.levelId,
          interceptPct: res.interceptPct,
          savedCities: Object.values(engineRef.current?.cities || {})
            .filter(c => c.hp > 0).map(c => c.name),
        });
      },
      onMessage: (text, type) => {
        if (type === 'error') audio.playRedAlert();
        pushMessage(text, type);
      },
    });

    engineRef.current = engine;
    pausedRef.current = false;
    engine.start();
    setScreen(SCREEN.PLAYING);
    rafRef.current = requestAnimationFrame(renderLoop);

    // Prompt red alert
    audio.playRedAlert();
    pushMessage('🚨 צבע אדום! טילים נכנסים — לחץ לשיגור יירוט', 'warn');
  }

  // ─── THREAT CLICK ─────────────────────────────────────
  function handleThreatClick(threatId, systemId) {
    if (!engineRef.current || screen !== SCREEN.PLAYING) return;
    const fired = engineRef.current.fire(threatId, systemId);
    if (fired) audio.playLaunch();
  }

  // ─── AUTO INTERCEPT ───────────────────────────────────
  const autoIntercept = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const threats = engine.threats
      .filter(t => t.active)
      .sort((a, b) => (b.data?.points || 0) - (a.data?.points || 0));
    if (threats.length) {
      engine.fire(threats[0].id, selectedSystem);
      audio.playLaunch();
    }
  }, [selectedSystem, audio]);

  // ─── KEYBOARD ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (screen !== SCREEN.PLAYING && screen !== SCREEN.PAUSED) return;
      if (e.key === '1') setSelected('IRON_DOME');
      if (e.key === '2') setSelected('DAVID_SLING');
      if (e.key === '3') setSelected('ARROW');
      if (e.key === 'a' || e.key === 'A') autoIntercept();
      if (e.key === 'Escape') {
        if (screen === SCREEN.PLAYING) {
          pausedRef.current = true;
          engineRef.current?.stop();
          setScreen(SCREEN.PAUSED);
        } else {
          pausedRef.current = false;
          engineRef.current?.start();
          setScreen(SCREEN.PLAYING);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, autoIntercept]);

  // ─── CLEANUP ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ─── MESSAGES ─────────────────────────────────────────
  function pushMessage(text, type = 'info') {
    const id = ++msgId;
    setMessages(prev => [{ id, text, type }, ...prev].slice(0, 4));
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
  }

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 font-hebrew overflow-hidden">

      {/* ── MENU ── */}
      {screen === SCREEN.MENU && (
        <div className="w-full h-full overflow-y-auto">
          <Menu
            onStart={startLevel}
            globalStats={globalStats}
            bestScore={bestScore}
          />
        </div>
      )}

      {/* ── GAME ── */}
      {(screen === SCREEN.PLAYING || screen === SCREEN.PAUSED) && (
        <div
          className="relative w-full bg-black"
          style={{
            aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
          <GameCanvas
            snapshot={snapshot}
            onThreatClick={handleThreatClick}
            selectedSystem={selectedSystem}
            W={CANVAS_W}
            H={CANVAS_H}
          />
          <HUD
            snapshot={snapshot}
            selectedSystem={selectedSystem}
            onSelectSystem={setSelected}
            globalStats={globalStats}
            messages={messages}
          />

          {/* Paused overlay */}
          {screen === SCREEN.PAUSED && (
            <div
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 cursor-pointer z-50"
              onClick={() => {
                pausedRef.current = false;
                engineRef.current?.start();
                setScreen(SCREEN.PLAYING);
              }}
            >
              <div className="text-6xl">⏸️</div>
              <div className="text-white text-2xl font-bold">מושהה</div>
              <div className="text-white/50">לחץ Esc או כאן להמשך</div>
              <button
                onClick={e => { e.stopPropagation(); engineRef.current?.stop(); setScreen(SCREEN.MENU); }}
                className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-white/20"
              >
                ← חזור לתפריט
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT / CERTIFICATE ── */}
      {screen === SCREEN.RESULT && result && (
        <div className="w-full h-full overflow-y-auto">
          <Certificate
            result={result}
            onRestart={() => startLevel(levelIdx)}
            onNextLevel={
              result.passed && levelIdx < LEVELS.length - 1
                ? () => startLevel(levelIdx + 1)
                : null
            }
          />
        </div>
      )}
    </div>
  );
}
