import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AnimatedNumber({ to, duration = 1800 }) {
  const ref = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.floor(eased * to).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <span ref={ref}>0</span>;
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)', overflowX: 'hidden' }}>
      
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,255,0,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <header style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, background: 'rgba(8,10,14,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '9px', background: '#c6ff00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>PalmSecure</span>
        </div>
        <nav style={{ display: 'flex', gap: '32px' }}>
          {['Home', 'Architecture', 'Documentation'].map(item => (
            <span key={item} style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >{item}</span>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/admin')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', borderRadius: '8px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >Admin Panel</button>
          <button onClick={() => navigate('/enroll')} style={{ padding: '9px 20px', background: '#c6ff00', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Get Started →</button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', paddingBottom: '120px', padding: '100px 24px 120px', zIndex: 10, textAlign: 'center' }}>
        
        <div style={{ animation: 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.2)', fontSize: '13px', fontWeight: 600, color: '#c6ff00', marginBottom: '32px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c6ff00', animation: 'blink 2s ease infinite' }} />
            Active · 3-tier microservice architecture
          </div>

          <h1 style={{ fontSize: 'clamp(52px, 8vw, 88px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#ffffff', marginBottom: '28px', maxWidth: '900px' }}>
            Your palm is your<br />
            <span style={{ background: 'linear-gradient(135deg, #c6ff00 0%, #00e5ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>password.</span>
          </h1>

          <p style={{ maxWidth: '560px', margin: '0 auto 48px', fontSize: '19px', color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 400 }}>
            PalmSecure is a research prototype that uses palm biometrics to authenticate users. 
            No passwords, no tokens — just your hand. Built with cancelable BioHashes so your raw biometric is never stored anywhere.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/enroll')} style={{
              padding: '16px 36px', fontSize: '16px', borderRadius: '12px',
              background: '#c6ff00', color: '#000', border: 'none', fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 40px rgba(198,255,0,0.25)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(198,255,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(198,255,0,0.25)'; }}
            >Enroll Your Identity →</button>
            <button onClick={() => navigate('/verify')} style={{
              padding: '16px 36px', fontSize: '16px', borderRadius: '12px',
              background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >Try Verification</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0', marginTop: '80px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', animation: 'fade-up 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          {[
            { label: 'Feature Dimensions', value: 410, suffix: 'd', desc: 'WPCA compressed' },
            { label: 'Liveness Landmarks', value: 21, suffix: ' pts', desc: 'MediaPipe 3D tracking' },
            { label: 'Hash Security', value: 256, suffix: '-bit', desc: 'SHA-256 BioHash' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: '32px 48px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>
                <AnimatedNumber to={stat.value} />{stat.suffix}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{stat.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginTop: '120px', width: '100%', maxWidth: '1000px', textAlign: 'left' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: '12px' }}>How it works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '17px' }}>Three steps. No passwords. No usernames to remember.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {[
              { step: '01', title: 'Show your palm', body: 'Hold your open hand in front of the camera. Our Edge AI using Google MediaPipe maps 21 3D landmarks of your hand instantly and confirms you\'re a real person, not a photo.', icon: '✋', color: '#c6ff00' },
              { step: '02', title: 'We create your BioHash', body: 'Your palm\'s mathematical features are combined with a secret PIN you choose and hashed with SHA-256. We never store a picture of your hand — just an irreversible number.', icon: '🔐', color: '#00e5ff' },
              { step: '03', title: 'You\'re in', body: 'Next time you want access, just show your palm again. The system matches your features against the database and grants access in milliseconds.', icon: '✅', color: '#a78bfa' },
            ].map(card => (
              <div key={card.step} className="hover-lift" style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '36px' }}>{card.icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: card.color, opacity: 0.7 }}>{card.step}</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{card.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack comparison */}
        <div style={{ marginTop: '100px', width: '100%', maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: '12px' }}>The problem with traditional biometrics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '17px' }}>If your fingerprint is stolen, you can't get a new finger. We thought about that.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,68,68,0.04)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '20px', padding: '36px' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ff6b6b', marginBottom: '16px' }}>Standard biometric systems</h3>
              {['Store your actual fingerprint or face image', 'One database breach = permanently compromised', 'No way to "reset" your biometric', 'Only check identity at login, not continuously'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff6b6b', marginTop: '2px' }}>✗</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '20px', padding: '36px' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>🛡️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#c6ff00', marginBottom: '16px' }}>PalmSecure with Cancelable BioHashes</h3>
              {['Only mathematical hashes are stored, never images', 'Database breach exposes nothing useful', 'Change your PIN → instant new identity hash', 'Liveness detection on every single session frame'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#c6ff00', marginTop: '2px' }}>✓</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '100px', textAlign: 'center', padding: '80px 40px', background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.12)', borderRadius: '28px', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: '16px' }}>Ready to try it?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '17px', marginBottom: '40px' }}>The entire demo runs locally on your machine. Nothing is sent to any cloud.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/enroll')} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px', background: '#c6ff00', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 40px rgba(198,255,0,0.3)' }}>Enroll Now →</button>
            <button onClick={() => navigate('/admin')} style={{ padding: '16px 36px', fontSize: '16px', borderRadius: '12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, cursor: 'pointer' }}>View Admin Panel</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px', width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-faint)', fontSize: '13px' }}>
          <span>PalmSecure · Academic Prototype</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>React + Vite · Port 5173</span>
            <span>Spring Boot · Port 8081</span>
            <span>FastAPI · Port 8000</span>
          </div>
        </div>
      </main>
    </div>
  );
}
