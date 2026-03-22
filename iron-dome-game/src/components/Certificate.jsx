// ============================================================
// CERTIFICATE — Shareable End-of-Game Certificate
// "תעודת לוחם הגנ"א"
// ============================================================
import { useRef, useEffect } from 'react';
import { Share2, Download, RotateCcw } from 'lucide-react';

export default function Certificate({ result, onRestart, onNextLevel }) {
  const canvasRef = useRef(null);

  const {
    score = 0,
    interceptPct = 0,
    stats = {},
    levelId = 1,
    passed = true,
    gold = false,
    budget = 0,
  } = result || {};

  const rank = gold ? 'זהב 🥇' : passed ? 'כסף 🥈' : 'ברונזה 🥉';
  const rankColor = gold ? '#FFD700' : passed ? '#C0C0C0' : '#CD7F32';

  // Draw certificate on canvas for sharing/download
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 600, H = 400;
    canvas.width = W;
    canvas.height = H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a1520');
    bg.addColorStop(1, '#0d1f10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = rankColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.strokeStyle = rankColor + '55';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Stars decoration
    ctx.fillStyle = rankColor + '44';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        30 + Math.random() * (W - 60),
        30 + Math.random() * (H - 60),
        Math.random() * 1.5, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Shield icon
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️', W / 2, 80);

    // Title
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 28px Arial';
    ctx.fillText('תעודת לוחם הגנ"א', W / 2, 120);

    ctx.fillStyle = '#ffffff88';
    ctx.font = '16px Arial';
    ctx.fillText('Iron Shield Defense Network', W / 2, 145);

    // Divider
    ctx.strokeStyle = rankColor + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(W - 60, 160);
    ctx.stroke();

    // Stats
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';

    const leftX = W / 2 - 20;
    const rightX = W / 2 + 140;

    const rows = [
      ['ניקוד:', score.toLocaleString()],
      ['שיעור יירוטים:', `${interceptPct}%`],
      ['טילים יורטו:', (stats.intercepted || 0).toString()],
      ['ערים שנפגעו:', (stats.cityHits || 0).toString()],
      ['תקציב נותר:', `$${budget.toLocaleString()}`],
      ['רמה:', `${levelId}`],
    ];

    rows.forEach(([label, value], i) => {
      const y = 190 + i * 28;
      ctx.fillStyle = '#ffffff99';
      ctx.textAlign = 'right';
      ctx.fillText(label, leftX, y);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(value, rightX - 120, y);
    });

    // Rank badge
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = rankColor;
    ctx.fillText(`דרגה: ${rank}`, W / 2, 375);

    // Footer
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff33';
    ctx.fillText(`iron-shield.app • ${new Date().toLocaleDateString('he-IL')}`, W / 2, H - 20);
  }, [result, rank, rankColor]);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async blob => {
        const file = new File([blob], 'iron-shield-certificate.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'מגן ברזל — תעודת לוחם הגנ"א',
            text: `יירטתי ${result?.stats?.intercepted} טילים! ניקוד: ${score.toLocaleString()} 🛡️`,
            files: [file],
          });
        } else {
          // Fallback: copy text
          await navigator.clipboard.writeText(
            `🛡️ מגן ברזל — יירטתי ${result?.stats?.intercepted} טילים!\n` +
            `ניקוד: ${score.toLocaleString()} | ${interceptPct}% יירוטים | דרגה: ${rank}\n` +
            `#IronShield #כיפתברזל`
          );
          alert('טקסט הועתק ללוח!');
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'iron-shield-certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-gray-950 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Certificate canvas */}
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: 'block' }}
        />

        {/* Action buttons */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              <Share2 size={18} />
              שתף
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              <Download size={18} />
              הורד
            </button>
          </div>

          <div className="flex gap-2">
            {onNextLevel && (
              <button
                onClick={onNextLevel}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-lg transition-colors"
              >
                🎯 רמה הבאה →
              </button>
            )}
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-1.5 px-5 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors"
            >
              <RotateCcw size={16} />
              שחק שוב
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
