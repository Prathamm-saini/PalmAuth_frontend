import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DocsPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)', paddingBottom: '100px' }}>
      <header style={{ padding: '24px 48px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <button className="btn-secondary-glow" onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px' }}>
          ← Back to System Overview
        </button>
      </header>

      <main className="animate-fade-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '16px' }}>Documentation</h1>
        <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '64px', lineHeight: 1.6 }}>
          In-depth technical specifications regarding PalmSecure's core continuous authentication algorithms and architectural decisions.
        </p>

        <section id="cancelable-biometrics" style={{ marginBottom: '80px', animation: 'fade-up 0.6s ease both' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-bright)', borderRadius: '8px', fontWeight: 700, marginBottom: '24px' }}>Concept 01</div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Cancelable Biometrics & BioHashing</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            The fundamental flaw with traditional biometrics (like a raw fingerprint or facial scan) is that they are immutable. If a database containing raw biometric templates is breached, the user's identity is permanently compromised.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            PalmSecure mitigates this through <strong>Cancelable Biometrics</strong>. Instead of storing the structural palm pattern directly, the extracted spatial features are passed through a one-way mathematical transformation utilizing a user-specific secret key (the "BioHash"). 
          </p>
          <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent-primary)' }}>
            <strong>Security Guarantee:</strong> Should the authentication database ever be compromised, the current BioHashes can simply be discarded. The system generates a new user-specific token, creating an entirely brand new hash from the same physical palm.
          </div>
        </section>

        <section id="rolling-confidence" style={{ marginBottom: '80px', animation: 'fade-up 0.6s ease both', animationDelay: '0.1s' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-bright)', borderRadius: '8px', fontWeight: 700, marginBottom: '24px' }}>Concept 02</div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Rolling Confidence State Algorithm</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Continuous verification systems inevitably face fluctuating sensor data. Factors such as lighting changes, motion blur, and micro-movements can cause a single frame to fail validation, leading to abrupt and frustrating session lockouts for legitimate users.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            To ensure zero-friction continuity, PalmSecure abstracts frame-by-frame binary logic into a <strong>Rolling Action Confidence State</strong>.
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li style={{ marginBottom: '12px' }}>A temporal buffer maintains the biometric confidence scores of the past 12 inference frames.</li>
            <li style={{ marginBottom: '12px' }}>An exponentially weighted moving average gives precedence to newer frames while softening the impact of isolated sensor anomalies.</li>
            <li>If the averaged confidence drops below a critical threshold `τ`, the system assumes abandonment or hijacking, instantly revoking the session token.</li>
          </ul>
        </section>

        <section id="liveness" style={{ marginBottom: '80px', animation: 'fade-up 0.6s ease both', animationDelay: '0.2s' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-bright)', borderRadius: '8px', fontWeight: 700, marginBottom: '24px' }}>Concept 03</div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>MediaPipe Spatial Liveness</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Traditional 2D facial and palm recognition systems are highly susceptible to Presentation Attacks (e.g., holding a high-resolution photograph or an iPad screen in front of the camera). 
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            PalmSecure implements a robust anti-spoofing layer leveraging <strong>MediaPipe Vision logic</strong>. Before the frame is even passed to the biometric feature extractor, the system verifies:
          </p>
          <ol style={{ marginTop: '24px', listStyleType: 'decimal', paddingLeft: '24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li style={{ marginBottom: '12px' }}><strong>Hand Presence & Geometry:</strong> 21 3D landmarks are actively tracked to ensure realistic inter-joint kinematics.</li>
            <li style={{ marginBottom: '12px' }}><strong>Dynamic Motion Consistency:</strong> Screens and photographs generally lack the microscopic muscular jitter associated with living tissue.</li>
            <li><strong>Constraint Boxing:</strong> The palm must align cleanly within a physical spatial boundary metric to ensure the biometric data is extracted un-distorted.</li>
          </ol>
        </section>

      </main>
    </div>
  );
}
