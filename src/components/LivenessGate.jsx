import { useEffect } from 'react';

const STATUS_CONFIG = {
  idle:             { label: 'Ready to check liveness', color: 'var(--color-text-secondary)' },
  loading_mediapipe:{ label: 'Loading hand detector...', color: 'var(--color-text-warning)' },
  collecting:       { label: 'Slowly open and close your hand...', color: 'var(--color-text-info)' },
  checking:         { label: 'Analyzing motion...', color: 'var(--color-text-info)' },
  pass:             { label: 'Liveness confirmed — live hand detected', color: 'var(--color-text-success)' },
  fail:             { label: 'Liveness failed — please try again', color: 'var(--color-text-danger)' },
  error:            { label: 'Check error — is the camera active?', color: 'var(--color-text-danger)' },
};

/**
 * LivenessGate — displays progress UI based on props injected by caller
 */
export default function LivenessGate({ status, result, progress, isRunning, onStart, onReset, onLivenessConfirmed }) {
  // Auto-advance to parent flow on pass if callback provided
  useEffect(() => {
    if (status === 'pass' && onLivenessConfirmed) {
      const t = setTimeout(() => onLivenessConfirmed(), 800);
      return () => clearTimeout(t);
    }
  }, [status, onLivenessConfirmed]);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
  const isCollecting = status === 'collecting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Progress bar during collection */}
      <div style={{
        height: 3,
        background: 'var(--color-background-secondary)',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: status === 'pass'
            ? 'var(--color-border-success)'
            : status === 'fail'
              ? 'var(--color-border-danger)'
              : 'var(--color-border-info)',
          width: isCollecting ? `${progress}%` : status === 'idle' ? '0%' : '100%',
          transition: isCollecting ? 'width 0.1s linear' : 'width 0.3s ease',
          borderRadius: 2,
        }} />
      </div>

      {/* Status message */}
      <div style={{
        fontSize: 13,
        color: cfg.color,
        minHeight: 20,
        fontWeight: status === 'pass' || status === 'fail' ? 500 : 400,
      }}>
        {cfg.label}
      </div>

      {/* Detail scores on pass/fail */}
      {result && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {[
            ['Motion score', result.motion_score?.toFixed(5) ?? '—'],
            ['Gesture score', result.gesture_score?.toFixed(3) ?? '—'],
            ['Frames analyzed', result.frames_analyzed ?? '—'],
            ['Result', result.reason ?? '—'],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: 'var(--color-background-secondary)',
              borderRadius: 8,
              padding: '6px 10px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>
                {String(val)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Button */}
      {(status === 'idle' || status === 'fail' || status === 'error') && (
        <button
          onClick={status === 'fail' || status === 'error' ? onReset : onStart}
          disabled={isRunning}
          style={{ marginTop: 4, width: '100%' }}
          className="btn-primary-glow"
        >
          {status === 'idle' ? 'Start Liveness Check' : 'Retry'}
        </button>
      )}
    </div>
  );
}