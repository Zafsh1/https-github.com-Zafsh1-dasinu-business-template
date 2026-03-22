// ============================================================
// MAIN MENU
// ============================================================
import { Shield, Globe, Users, ChevronRight } from 'lucide-react';
import { LEVELS, INTERCEPTORS } from '../game/constants.js';

export default function Menu({ onStart, globalStats, bestScore }) {
  const totalInterceptions = globalStats?.totalInterceptions || 0;

  const threatLabel =
    totalInterceptions < 1000   ? 'נמוך' :
    totalInterceptions < 5000   ? 'בינוני' :
    totalInterceptions < 20000  ? 'גבוה' :
    totalInterceptions < 100000 ? 'קריטי' : 'חירום לאומי';

  const threatColor =
    totalInterceptions < 1000   ? 'text-green-400' :
    totalInterceptions < 5000   ? 'text-yellow-400' :
    totalInterceptions < 20000  ? 'text-orange-400' : 'text-red-400';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 text-white"
      dir="rtl"
      style={{ background: 'radial-gradient(ellipse at center, #0d1f2d 0%, #050d15 100%)' }}
    >
      {/* Stars bg */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              opacity: Math.random() * 0.8 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full flex flex-col gap-5">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-2">🛡️</div>
          <h1 className="text-3xl font-extrabold tracking-tight">מגן ברזל</h1>
          <p className="text-blue-300 text-lg">Iron Shield Defense Network</p>
          <p className="text-white/40 text-sm mt-1">מבצע חרבות ברזל — הגנה רב-חזיתית</p>
        </div>

        {/* Global PLG counter */}
        <div className="bg-black/50 border border-purple-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-purple-400" />
              <span className="text-purple-300 font-bold">יירוטים גלובליים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping-slow" />
              <span className={`text-xs font-bold ${threatColor}`}>רמת איום: {threatLabel}</span>
            </div>
          </div>
          <div className="text-4xl font-mono font-bold text-purple-200 mt-1">
            {totalInterceptions.toLocaleString()}
          </div>
          <div className="text-white/40 text-xs mt-1">
            ככל שהמספר גדל — האיום עולה לכולם
          </div>
        </div>

        {/* Best score */}
        {bestScore > 0 && (
          <div className="bg-black/40 border border-yellow-800/40 rounded-xl px-4 py-2 text-center">
            <span className="text-yellow-300/70 text-sm">הניקוד הטוב ביותר שלך: </span>
            <span className="text-yellow-300 font-bold">{bestScore.toLocaleString()}</span>
          </div>
        )}

        {/* Systems preview */}
        <div className="grid grid-cols-3 gap-2">
          {Object.values(INTERCEPTORS).map(sys => (
            <div key={sys.id} className="bg-black/40 border border-white/10 rounded-lg p-2 text-center">
              <div className="text-2xl">{sys.icon}</div>
              <div className="text-xs font-bold text-white/80">{sys.label}</div>
              <div className="text-xs text-white/40">${sys.cost.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Level selector */}
        <div className="flex flex-col gap-2">
          <h2 className="text-white/60 text-sm font-bold text-center">בחר רמה</h2>
          {LEVELS.map((level, i) => (
            <button
              key={level.id}
              onClick={() => onStart(i)}
              className={`
                group flex items-center gap-3 w-full px-4 py-3 rounded-xl border
                transition-all duration-150 text-right active:scale-98
                ${level.isFinal
                  ? 'border-red-700/60 bg-red-950/30 hover:bg-red-900/40'
                  : 'border-white/10 bg-black/30 hover:bg-white/5 hover:border-white/25'}
              `}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{level.name}</span>
                  {level.isFinal && <span className="text-red-400 text-xs">🔴 FINAL</span>}
                </div>
                <span className="text-white/40 text-xs">{level.description}</span>
                <div className="flex gap-2 mt-1">
                  {level.fronts.map(f => (
                    <span key={f} className="text-xs bg-white/10 rounded px-1">{f}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-white/40 text-xs">{level.duration}ש׳</span>
                <span className="text-green-400/70 text-xs">>{level.passScore.toLocaleString()}</span>
              </div>
              <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs pb-2">
          ← לחץ על טיל לשיגור מיירט • [1/2/3] מקש מהיר →
        </div>
      </div>
    </div>
  );
}
