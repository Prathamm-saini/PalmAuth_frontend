import React, { useState, useCallback, useRef, useEffect } from 'react'
import CameraView from '../components/CameraView.jsx'
import ContinuousAuthTicker from '../components/ContinuousAuthTicker.jsx'
import AuthResultBanner from '../components/AuthResultBanner.jsx'
import { useCamera } from '../hooks/useCamera.js'
import { useContinuousAuth } from '../hooks/useContinuousAuth.js'
import { verifyPalm } from '../api/palmApi.js'

export default function SessionPage() {
  const [spectrum, setSpectrum] = useState('850nm')
  const [captured, setCaptured] = useState({})
  const [alert, setAlert] = useState(null)   // { type, message }
  const [lastResult, setLastResult] = useState(null)

  const { videoRef, active, start: startCam, stop: stopCam, captureFrame } = useCamera()

  // getFrames is called by the hook every 2s — returns current captured dict
  const capturedRef = useRef(captured)
  useEffect(() => {
    capturedRef.current = captured
  }, [captured])

  const getFrames = useCallback(() => capturedRef.current, [])

  const { start, stop, running, currentScore, currentIdent, history, rollingAvg, sessionTime } =
    useContinuousAuth({
      getFrames,
      fusionRule: 'WHT',
      onExpire: ({ reason, lastScore }) => {
        setAlert({
          type: 'warn',
          message: `Session expired: ${reason} (last score ${(lastScore * 100).toFixed(1)}%)`,
        })
        stopCam()
      },
      onIdentityChange: ({ previous, current }) => {
        setAlert({
          type: 'danger',
          message: `Identity drift detected: ${previous} → ${current}. Session terminated.`,
        })
        stop()
        stopCam()
      },
    })

  const handleStartCamera = useCallback(async () => {
    await startCam()
    setAlert(null)
  }, [startCam])

  // Capture the current frame for the active spectrum
  const handleCapture = useCallback(() => {
    const frame = captureFrame(224, 224)
    if (!frame) return
    setCaptured(prev => ({ ...prev, [spectrum]: frame }))
  }, [captureFrame, spectrum])

  // Manual single verify
  const handleManualVerify = useCallback(async () => {
    if (Object.keys(captured).length === 0) return
    try {
      const { data } = await verifyPalm(captured, 'WHT')
      setLastResult(data)
    } catch { /* silent */ }
  }, [captured])

  const handleStop = useCallback(() => {
    stop()
    stopCam()
    setCaptured({})
    setLastResult(null)
    setAlert(null)
  }, [stop, stopCam])

  const SPECTRUMS = ['460nm', '630nm', '700nm', '850nm', '940nm', 'white']

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1080px', margin: '0 auto', animation: 'fade-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
      {/* Title */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div className="badge-pill">Continuous Monitoring</div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px' }}>
          <span className="gradient-text">Active</span> Session
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 500 }}>
          Continuous palm re-verification every 2 seconds with rolling confidence
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          marginBottom: '24px', padding: '16px 20px', borderRadius: '12px',
          background: alert.type === 'danger' ? '#fef2f2' : '#fef3c7',
          border: `1px solid ${alert.type === 'danger' ? '#fecaca' : '#fde68a'}`,
          color: alert.type === 'danger' ? '#ef4444' : '#d97706',
          fontSize: '14px', fontWeight: 600,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.type === 'danger' ? '✕' : '⚠'} {alert.message}
          </span>
          <button
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Camera */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CameraView videoRef={videoRef} active={active} spectrum={running ? spectrum : null} />

          {!active ? (
            <button onClick={handleStartCamera} style={primaryBtnStyle}>START CAMERA</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Spectrum pill selector */}
              <div style={{
                flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px',
                background: 'var(--bg-card)', borderRadius: '10px', padding: '8px',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {SPECTRUMS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpectrum(s)}
                    style={{
                      padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                      border: spectrum === s ? '1px solid rgba(0,229,255,0.35)' : '1px solid transparent',
                      background: spectrum === s ? 'rgba(0,229,255,0.10)' : 'transparent',
                      color: spectrum === s ? 'var(--accent-cyan)' : 'var(--text-faint)',
                      fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {active && (
            <button onClick={handleCapture} style={secondaryBtnStyle}>
              ◎ CAPTURE {spectrum.toUpperCase()}
            </button>
          )}

          {Object.keys(captured).length > 0 && !running && (
            <button onClick={handleManualVerify} style={ghostBtnStyle}>
              SINGLE VERIFY
            </button>
          )}

          {lastResult && !running && (
            <AuthResultBanner result={lastResult} />
          )}
        </div>

        {/* Right: Continuous auth panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ContinuousAuthTicker
            running={running}
            currentScore={currentScore}
            currentIdent={currentIdent}
            history={history}
            rollingAvg={rollingAvg}
            sessionTime={sessionTime}
            onStart={Object.keys(captured).length > 0 ? start : null}
            onStop={handleStop}
          />

          {Object.keys(captured).length === 0 && !running && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,184,48,0.20)',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--accent-amber)',
            }}>
              ⚠ Start camera and capture at least one spectrum to begin session monitoring
            </div>
          )}

          {/* How it works */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '14px' }}>
              How continuous auth works
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Every 2 seconds', 'The live camera frame is sent to /api/v1/verify'],
                ['Rolling average', 'Last 12 readings are averaged for stability'],
                ['Threshold: 85%', 'Fused score must stay above 85% to keep session alive'],
                ['Session expires', 'If confidence drops below 60% for 20s, session terminates'],
                ['Identity drift', 'If predicted identity changes mid-session, immediate termination'],
              ].map(([label, desc]) => (
                <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, marginTop: '2px',
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--accent-cyan)', opacity: 0.6,
                  }} />
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)' }}>
                      {' — '}{desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const primaryBtnStyle = {
  width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-btn)',
  border: 'none', background: 'var(--accent-primary)',
  color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 8px 20px -6px rgba(14, 165, 233, 0.4)'
}

const secondaryBtnStyle = {
  width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-btn)',
  border: 'none', background: 'var(--bg-hover)',
  color: 'var(--accent-primary)', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

const ghostBtnStyle = {
  width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-btn)',
  border: '2px solid var(--border)', background: 'transparent',
  color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}