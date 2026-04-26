import React from 'react'

export default function AuthResultBanner({ result }) {
  if (!result) return null

  const granted = result.granted

  return (
    <div style={{
      borderRadius: '14px',
      border: `1px solid ${granted ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,85,0.25)'}`,
      background: granted ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,85,0.06)',
      padding: '20px 24px',
      animation: 'fade-in 0.35s ease both',
    }}>
      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: granted ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,85,0.15)',
          border: `1px solid ${granted ? 'rgba(0,255,136,0.4)' : 'rgba(255,68,85,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
          boxShadow: granted ? '0 0 16px rgba(0,255,136,0.2)' : '0 0 16px rgba(255,68,85,0.2)',
        }}>
          {granted ? '✓' : '✗'}
        </div>
        <div>
          <div style={{
            fontWeight: 700, fontSize: '15px', letterSpacing: '0.04em',
            color: granted ? 'var(--accent-green)' : 'var(--accent-red)',
            fontFamily: 'var(--font-display)',
          }}>
            {granted ? 'AUTHENTICATION GRANTED' : 'AUTHENTICATION FAILED'}
          </div>
          {granted && result.identity && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Identity: <span style={{ color: 'var(--text-primary)' }}>{result.identity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <MetricCell label="Fused score" value={`${((result.fusedScore ?? 0) * 100).toFixed(1)}%`} highlight={granted} />
        <MetricCell label="Latency" value={`${result.latencyMs ?? 0}ms`} />
        <MetricCell
          label="Secret key"
          value={granted && result.secretKey ? result.secretKey : '—'}
          mono
          highlight={granted}
        />
      </div>

      {/* Spectrum scores */}
      {result.spectrumScores && Object.keys(result.spectrumScores).length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Per-spectrum scores
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(result.spectrumScores).map(([spectrum, score]) => (
              <div key={spectrum} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px', padding: '4px 10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint)' }}>{spectrum}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCell({ label, value, mono, highlight }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '10px 12px',
    }}>
      <div style={{
        fontSize: '10px', fontFamily: 'var(--font-mono)',
        color: 'var(--text-faint)', letterSpacing: '0.06em',
        textTransform: 'uppercase', marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: mono ? '12px' : '15px',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
        fontWeight: 600,
        color: highlight ? 'var(--accent-green)' : 'var(--text-primary)',
        letterSpacing: mono ? '0.08em' : '0',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
    </div>
  )
}