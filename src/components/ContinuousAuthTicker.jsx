import { useEffect, useRef } from 'react';

/**
 * ContinuousAuthTicker — displays the rolling confidence bar and session timer.
 * Pass in values from the useContinuousAuth hook.
 */
export default function ContinuousAuthTicker({
  isRunning,
  currentScore,
  rollingAverage,
  scoreHistory,
  sessionMs,
  currentIdentity,
  onStart,
  onStop,
}) {
  const canvasRef = useRef(null);

  // Draw score sparkline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scoreHistory.length) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const step = w / Math.max(scoreHistory.length - 1, 1);
    ctx.beginPath();
    scoreHistory.forEach((score, i) => {
      const x = i * step;
      const y = h - score * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = rollingAverage >= 0.85
      ? '#1D9E75'
      : rollingAverage >= 0.6
        ? '#BA7517'
        : '#E24B4A';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [scoreHistory, rollingAverage]);

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const scoreColor = currentScore == null
    ? 'var(--color-text-tertiary)'
    : currentScore >= 0.85
      ? 'var(--color-text-success)'
      : currentScore >= 0.6
        ? 'var(--color-text-warning)'
        : 'var(--color-text-danger)';

  return (
    <div style={{
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 12,
      padding: '1rem',
      marginTop: 16,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Continuous authentication
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isRunning && (
            <span style={{ fontSize: 11, color: 'var(--color-text-success)' }}>
              {fmt(sessionMs)}
            </span>
          )}
          <button
            onClick={isRunning ? onStop : onStart}
            style={{
              fontSize: 12,
              padding: '4px 12px',
            }}
          >
            {isRunning ? 'Stop' : 'Start session'}
          </button>
        </div>
      </div>

      {/* Score metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Live score</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: scoreColor, marginTop: 2 }}>
            {currentScore != null ? `${(currentScore * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Rolling avg</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {rollingAverage != null ? `${(rollingAverage * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Identity</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentIdentity ?? '—'}
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <canvas
        ref={canvasRef}
        width={400}
        height={48}
        style={{
          width: '100%',
          height: 48,
          display: 'block',
          borderRadius: 6,
          background: 'var(--color-background-secondary)',
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4, textAlign: 'right' }}>
        last {scoreHistory.length} checks · 2s interval
      </div>
    </div>
  );
}