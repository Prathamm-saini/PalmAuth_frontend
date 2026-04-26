import React, { useState, useCallback, useEffect } from 'react'
import CameraView from '../components/CameraView.jsx'
import LivenessGate from '../components/LivenessGate.jsx'
import { useCamera } from '../hooks/useCamera.js'
import { useLiveness } from '../hooks/useLiveness.js'
import { enrollPalm, checkUserId } from '../api/palmApi.js';

const STEP = { CAPTURE: 0, LIVENESS: 1, DONE: 2 }

const stepLabels = ['Capture Details', 'Liveness Check', 'Complete']

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

let captureHandsInstance = null;

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
      {stepLabels.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: done
                  ? 'var(--accent-green)'
                  : active
                    ? 'rgba(0,229,255,0.15)'
                    : 'rgba(255,255,255,0.05)',
                border: done
                  ? '1px solid var(--accent-green)'
                  : active
                    ? '1px solid var(--accent-cyan)'
                    : '1px solid rgba(255,255,255,0.08)',
                color: done ? '#000' : active ? 'var(--accent-cyan)' : 'var(--text-faint)',
                boxShadow: active ? '0 0 12px rgba(0,229,255,0.25)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)',
                color: active ? 'var(--accent-cyan)' : done ? 'var(--accent-green)' : 'var(--text-faint)',
                letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                {label.toUpperCase()}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{
                flex: 1, height: '1px', marginBottom: '18px',
                background: i < current
                  ? 'var(--accent-green)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function EnrollPage() {
  const [step,        setStep]        = useState(STEP.CAPTURE)
  const [userId,      setUserId]      = useState('')
  const [token,       setToken]       = useState('')
  const [captured,    setCaptured]    = useState({})
  const [enrollResult,setEnrollResult]= useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const { videoRef, active, start: startCam, stop: stopCam, captureFrame } = useCamera()
  const { start: startLiveness, reset: resetLiveness, status: livenessStatus,
          result: livenessResult, progress: livenessProgress, isRunning: livenessRunning } = useLiveness(videoRef)

  const handleStartCamera = useCallback(async () => {
    setError(null)
    await startCam()
  }, [startCam])

  const handleCapture = useCallback(async () => {
    const frame = captureFrame(224, 224)
    if (!frame) { setError('No camera frame — start camera first'); return }

    setLoading(true);
    try {
      if (!captureHandsInstance) {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        captureHandsInstance = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        captureHandsInstance.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.4 });
        await captureHandsInstance.initialize();
      }
      
      const hasHand = await new Promise((resolve) => {
        captureHandsInstance.onResults((results) => {
          resolve(results.multiHandLandmarks && results.multiHandLandmarks.length > 0);
        });
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + frame;
        img.onload = async () => {
          await captureHandsInstance.send({ image: img });
        };
      });

      if (!hasHand) {
        setError('No palm detected! Please hold your open palm clearly in the center frame.');
        setLoading(false);
        return;
      }
      
      setError(null);
      setCaptured(prev => ({ ...prev, ['850nm']: frame }))
    } catch (err) {
      setError('Hand validation engine failed to load.');
    } finally {
      setLoading(false);
    }
  }, [captureFrame])

  const handleProceedToLiveness = useCallback(async () => {
    if (!userId.trim()) { setError('User ID is required'); return }
    if (!token.trim())  { setError('Security PIN is required'); return }
    if (Object.keys(captured).length === 0) { setError('Capture your palm first'); return }
    
    setLoading(true);
    try {
      const { data } = await checkUserId(userId.trim());
      if (!data.available) {
        setError('already taken');
        setLoading(false);
        return;
      }
      setError(null)
      setStep(STEP.LIVENESS)
    } catch (err) {
      setError('Failed to verify username. Server may be down.');
    } finally {
      setLoading(false);
    }
  }, [userId, token, captured])

  const handleEnroll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await enrollPalm(userId.trim(), captured, token.trim())
      setEnrollResult(data)
      setStep(STEP.DONE)
    } catch (err) {
      setError(err.message)
      resetLiveness()
      setStep(STEP.CAPTURE)
    } finally {
      setLoading(false)
    }
  }, [userId, token, captured, resetLiveness])

  // Automatically trigger enrollment when liveness check passes
  useEffect(() => {
    if (step === STEP.LIVENESS && livenessStatus === 'pass' && !loading && !enrollResult) {
      handleEnroll();
    }
  }, [step, livenessStatus, loading, enrollResult, handleEnroll]);

  const handleReset = useCallback(() => {
    stopCam()
    setStep(STEP.CAPTURE)
    setUserId('')
    setToken('')
    setCaptured({})
    setEnrollResult(null)
    setError(null)
    resetLiveness()
  }, [stopCam, resetLiveness])

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    background: 'var(--bg-void)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.2s ease',
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: '960px', margin: '0 auto', animation: 'fade-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
      {/* Page title */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div className="badge-pill">Secure Onboarding</div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px' }}>
          <span className="gradient-text">Enroll</span> Identity
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 500 }}>
          Register a new palm biometric with cancelable BioHash templates
        </p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div style={{
          marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.25)',
          color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px',
        }}>
          ✗ {error}
        </div>
      )}

      {/* ── SHARED LAYOUT: Step 0 & Step 1 ──────────────────────────────────────────────── */}
      {(step === STEP.CAPTURE || step === STEP.LIVENESS) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Camera */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {step === STEP.LIVENESS && (
              <div style={{ padding: '12px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', marginBottom: '8px', animation: 'fade-up 0.3s ease' }}>
                <p style={{ fontSize: '13px', color: 'var(--accent-cyan)', margin: 0, fontWeight: 500 }}>
                  💡 Hold your open palm up to the camera and make a small gesture to pass liveness. Upon passing, your enrollment will automatically save.
                </p>
              </div>
            )}

            <CameraView videoRef={videoRef} active={active} spectrum={step === STEP.CAPTURE ? '850nm' : null} />
            
            {step === STEP.CAPTURE ? (
              !active ? (
                <button onClick={handleStartCamera} style={primaryBtnStyle}>
                  START CAMERA
                </button>
              ) : (
                <button 
                  onClick={handleCapture} 
                  style={{
                    ...primaryBtnStyle, 
                    background: captured['850nm'] ? '#c6ff00' : 'var(--accent-primary)',
                    color: captured['850nm'] ? '#000' : '#fff',
                    boxShadow: captured['850nm'] ? '0 0 15px rgba(198,255,0,0.5)' : '0 8px 20px -6px rgba(14, 165, 233, 0.4)',
                    transform: captured['850nm'] ? 'scale(0.98)' : 'scale(1)'
                  }}
                >
                  {captured['850nm'] ? '✓ PALM CAPTURED (Click to retake)' : '◎ CAPTURE PALM'}
                </button>
              )
            ) : (
              <button onClick={() => setStep(STEP.CAPTURE)} style={ghostBtnStyle}>← BACK TO CAPTURE</button>
            )}
          </div>
          
          {/* RIGHT COLUMN: Details / Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {step === STEP.CAPTURE ? (
              <>
                <SectionCard title="User credentials">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>User ID</label>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: error && error.includes('already taken') ? 'var(--accent-red)' : 'var(--border)',
                          boxShadow: error && error.includes('already taken') ? '0 0 0 3px rgba(255, 68, 85, 0.15)' : 'none'
                        }}
                        placeholder="e.g. alice_001"
                        value={userId}
                        onChange={e => {
                          setUserId(e.target.value);
                          if (error && error.includes('already taken')) setError(null);
                        }}
                        onFocus={e => { e.target.style.borderColor = error && error.includes('already taken') ? 'var(--accent-red)' : 'var(--accent-blue)'; e.target.style.boxShadow = error && error.includes('already taken') ? '0 0 0 3px rgba(255, 68, 85, 0.15)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = error && error.includes('already taken') ? 'var(--accent-red)' : 'var(--border)'; e.target.style.boxShadow = error && error.includes('already taken') ? '0 0 0 3px rgba(255, 68, 85, 0.15)' : 'var(--shadow-sm)'; }}
                      />
                      {error && error.includes('already taken') && (
                        <div style={{ color: 'var(--accent-red)', fontSize: '12px', marginTop: '6px', fontWeight: 500, animation: 'fade-up 0.2s ease' }}>
                          Oops, this username is already taken!
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Setup a Secure PIN <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(Required)</span></label>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                        This PIN combines with your palm to create a cancelable BioHash token, ensuring your raw biometrics are never exposed.
                      </p>
                      <input
                        style={inputStyle}
                        type="password"
                        placeholder="Enter a secure PIN"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
                      />
                    </div>
                  </div>
                </SectionCard>

                <button 
                  onClick={handleProceedToLiveness} 
                  style={{
                    ...primaryBtnStyle, 
                    animation: 'fade-up 0.3s ease',
                    background: (captured['850nm'] && userId.trim() && token.trim()) ? '#c6ff00' : 'var(--bg-surface)',
                    color: (captured['850nm'] && userId.trim() && token.trim()) ? '#000' : 'var(--text-faint)',
                    border: (captured['850nm'] && userId.trim() && token.trim()) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: (captured['850nm'] && userId.trim() && token.trim()) ? '0 0 25px rgba(198, 255, 0, 0.4)' : 'none',
                    opacity: 1,
                    pointerEvents: (captured['850nm'] && userId.trim() && token.trim()) ? 'auto' : 'none'
                  }}
                >
                  PROCEED TO LIVENESS →
                </button>
              </>
            ) : (
              <>
                <SectionCard title="Enrollment summary">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      ['User ID',       userId],
                      ['Token',         '••••••••'],
                      ['Spectrums',     Object.keys(captured).join(', ')],
                      ['Fusion rule',   'WHT (weighted by EER)'],
                      ['Security',      'BioHash + Fuzzy Vault'],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>{label}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <LivenessGate
                  status={livenessStatus}
                  result={livenessResult}
                  progress={livenessProgress}
                  isRunning={livenessRunning}
                  onStart={startLiveness}
                  onReset={resetLiveness}
                />

                {loading && (
                   <div style={{ marginTop: '16px', padding: '16px', textAlign: 'center', color: 'var(--bg-void)', background: 'var(--accent-cyan)', borderRadius: '8px', fontWeight: 'bold', animation: 'fade-up 0.3s ease' }}>
                     ✓ Liveness passed! Enrolling into database...
                   </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Done ─────────────────────────────────────────────────── */}
      {step === STEP.DONE && enrollResult && (
        <div style={{ maxWidth: '480px', animation: 'fade-up 0.4s ease both' }}>
          <div style={{
            borderRadius: 'var(--radius-card)',
            border: 'none',
            background: 'var(--bg-surface)',
            padding: '48px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '24px', color: 'var(--accent-primary)' }}>✨</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-bright)', marginBottom: '12px' }}>
              <span className="gradient-text">Enrollment Complete</span>
            </h2>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '40px' }}>
              Identity <strong style={{ color: 'var(--text-primary)' }}>{enrollResult.userId}</strong> registered in {enrollResult.latencyMs}ms
            </p>
            <button onClick={handleReset} style={primaryBtnStyle}>ENROLL ANOTHER</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared style helpers ─────────────────────────────────────────────────────

const primaryBtnStyle = {
  width: '100%',
  padding: '14px 24px',
  borderRadius: 'var(--radius-btn)',
  border: 'none',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 8px 20px -6px rgba(14, 165, 233, 0.4)'
}

const ghostBtnStyle = {
  width: '100%',
  padding: '14px 24px',
  borderRadius: 'var(--radius-btn)',
  border: '2px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: 'none'
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: 'none',
      borderRadius: 'var(--radius-card)',
      padding: '32px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '24px', letterSpacing: '-0.02em',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}