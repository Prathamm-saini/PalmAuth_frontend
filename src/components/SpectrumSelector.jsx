import React from 'react'

const SPECTRUMS = [
  { id: '460nm',  label: '460nm', desc: 'Blue' },
  { id: '630nm',  label: '630nm', desc: 'Red' },
  { id: '700nm',  label: '700nm', desc: 'Deep red' },
  { id: '850nm',  label: '850nm', desc: 'NIR' },
  { id: '940nm',  label: '940nm', desc: 'NIR' },
  { id: 'white',  label: 'White', desc: 'Visible' },
]

export default function SpectrumSelector({ selected, captured = {}, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {SPECTRUMS.map(s => {
        const isActive   = selected === s.id
        const isCaptured = !!captured[s.id]
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: isActive
                ? '1px solid var(--accent-cyan)'
                : isCaptured
                  ? '1px solid rgba(0,255,136,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
              background: isActive
                ? 'rgba(0,229,255,0.10)'
                : isCaptured
                  ? 'rgba(0,255,136,0.06)'
                  : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '64px',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 500,
              color: isActive ? 'var(--accent-cyan)' : isCaptured ? 'var(--accent-green)' : 'var(--text-muted)',
              letterSpacing: '0.03em',
            }}>
              {s.label}
            </span>
            <span style={{
              fontSize: '10px',
              color: isActive ? 'rgba(0,229,255,0.6)' : 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
            }}>
              {s.desc}
            </span>
            {isCaptured && (
              <div style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: 'var(--accent-green)',
                boxShadow: '0 0 4px var(--accent-green)',
                marginTop: '2px',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}