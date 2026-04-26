import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { id: 'enroll',  path: '/enroll',  label: 'Enrollment',  icon: '✦', desc: 'Secure palm registration' },
  { id: 'verify',  path: '/verify',  label: 'Verification', icon: '✧', desc: 'Identity authentication' },
  { id: 'session', path: '/session', label: 'Monitoring',   icon: '⟡', desc: 'Continuous auth session' },
  { id: 'admin',   path: '/admin',   label: 'Admin',        icon: '⊞', desc: 'Identity registry & DB' },
]

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>
      {/* Logo */}
      <div style={{
        padding: '32px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--text-bright)',
            color: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" /><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-bright)', letterSpacing: '-0.02em' }}>
              PalmSecure
            </div>
            <div style={{ fontWeight: 400, fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Enterprise Auth
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 16px', flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: '12px' }}>
          Overview
        </div>
        {NAV_ITEMS.map(item => {
          const active = location.pathname.includes(item.path) || (location.pathname === '/' && item.id === 'enroll')
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '9999px',
                border: 'none',
                background: active ? 'var(--bg-active)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '4px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '18px', color: active ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                {item.icon}
              </span>
              <div>
                <div style={{
                  fontSize: '15px', fontWeight: 600,
                  color: active ? 'var(--text-bright)' : 'var(--text-primary)',
                  letterSpacing: '-0.01em'
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 400 }}>
                  {item.desc}
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '24px',
        borderTop: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)' }} />
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>System Operational</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Version</span>
          <span style={{ fontWeight: 500 }}>2.0.0</span>
        </div>
      </div>
    </aside>
  )
}