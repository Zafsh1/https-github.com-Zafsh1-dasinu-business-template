// ============================================================
// HUD — Heads-Up Display
// ============================================================
import { Shield, Clock, DollarSign, Target, Zap } from 'lucide-react';
import { INTERCEPTORS } from '../game/constants.js';

export default function HUD({ snapshot, selectedSystem, onSelectSystem, globalStats, messages }) {
  if (!snapshot) return null;
  const { score, budget, levelTimer, stats, combo, batteries, level } = snapshot;

  const pct = stats.total > 0
    ? Math.round((stats.intercepted / stats.total) * 100)
    : 100;

  const mins = Math.floor(levelTimer / 60);
  const secs = Math.floor(levelTimer % 60).toString().padStart(2, '0');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col" dir="rtl">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-white/10">
        {/* Score */}
        <div className="flex items-center gap-1.5">
          <Target size={16} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-lg">{score.toLocaleString()}</span>
          {combo >= 3 && (
            <span className="text-orange-400 text-sm font-bold animate-pulse-fast">
              ×{combo} COMBO!
            </span>
          )}
        </div>

        {/* Level & Timer */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">{level?.name}</span>
          <div className="flex items-center gap-1 text-white">
            <Clock size={14} className={levelTimer < 30 ? 'text-red-400 animate-pulse' : 'text-white/60'} />
            <span className={`font-mono font-bold ${levelTimer < 30 ? 'text-red-400' : 'text-white'}`}>
              {mins}:{secs}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-1">
          <DollarSign size={15} className="text-green-400" />
          <span className={`font-mono text-sm font-bold ${budget < 1000 ? 'text-red-400' : 'text-green-400'}`}>
            {budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Intercept rate bar ── */}
      <div className="px-3 py-1 bg-black/40">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs w-28 shrink-0">
            יירוטים {stats.intercepted}/{stats.total}
          </span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <span className={`text-xs font-bold w-10 text-right ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* ── Message log ── */}
      <div className="flex flex-col items-center gap-1 mt-2 px-2">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`px-3 py-1 rounded-lg text-sm font-semibold pointer-events-none select-none
              transition-opacity duration-300
              ${msg.type === 'error'   ? 'bg-red-900/80 text-red-200 border border-red-600' :
                msg.type === 'warn'    ? 'bg-yellow-900/80 text-yellow-200 border border-yellow-600' :
                msg.type === 'success' ? 'bg-green-900/80 text-green-200 border border-green-600' :
                                         'bg-blue-900/70 text-blue-200 border border-blue-700'}`}
            style={{ opacity: i === 0 ? 1 : 0.6 }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* ── Global counter (PLG) ── */}
      {globalStats && (
        <div className="absolute top-14 left-3 bg-black/60 border border-purple-800/50 rounded-lg px-2 py-1">
          <div className="text-purple-300 text-xs font-bold">🌍 יירוטים גלובליים</div>
          <div className="text-purple-200 text-lg font-mono font-bold">
            {(globalStats.totalInterceptions || 0).toLocaleString()}
          </div>
        </div>
      )}

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── System selector (bottom) ── */}
      <div className="px-3 py-3 bg-black/70 border-t border-white/10 pointer-events-auto">
        <div className="flex gap-2 justify-center flex-wrap">
          {level?.systems?.map(sysId => {
            const sys = INTERCEPTORS[sysId];
            if (!sys) return null;
            const bat = batteries?.[sysId];
            const isSelected = selectedSystem === sysId;
            const isLow = bat && bat.ammo === 0;
            return (
              <button
                key={sysId}
                onClick={() => onSelectSystem(sysId)}
                className={`
                  flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[80px]
                  transition-all duration-150 active:scale-95
                  ${isSelected
                    ? 'border-white/80 bg-white/10 scale-105 shadow-lg'
                    : 'border-white/20 bg-black/40 hover:border-white/40'}
                  ${isLow ? 'opacity-50' : ''}
                `}
                style={isSelected ? { borderColor: sys.color, boxShadow: `0 0 12px ${sys.color}88` } : {}}
              >
                <span className="text-xl">{sys.icon}</span>
                <span className="text-white text-xs font-bold mt-0.5">{sys.label}</span>
                <span className="text-white/50 text-xs">[{sys.key}]</span>
                {/* Ammo dots */}
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[70px]">
                  {Array.from({ length: sys.maxAmmo }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: i < (bat?.ammo || 0) ? sys.color : '#333' }}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-xs mt-0.5">${sys.cost.toLocaleString()}</span>
                {bat?.reloading && (
                  <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${100 - (bat.reloadTimer / sys.reloadMs) * 100}%`,
                        background: sys.color,
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <div className="text-center text-white/30 text-xs mt-1.5">
          לחץ/גע על טיל לשיגור יירוט • [A] אוטומטי • [Esc] עצור
        </div>
      </div>
    </div>
  );
}
