import React, { useState, useCallback } from 'react'
import CameraView from '../components/CameraView.jsx'
import SpectrumSelector from '../components/SpectrumSelector.jsx'
import LivenessGate from '../components/LivenessGate.jsx'
import AuthResultBanner from '../components/AuthResultBanner.jsx'
import { useCamera } from '../hooks/useCamera.js'
import { useLiveness } from '../hooks/useLiveness.js'
import { verifyPalm } from '../api/palmApi.js'

const STEP = { LIVENESS: 0, CAPTURE: 1, RESULT: 2 }

export default function VerifyPage() {
  const [step,        setStep]        = useState(STEP.LIVENESS)
  const [spectrum,    setSpectrum]    = useState('850nm')
  const [captured,    setCaptured]    = useState({})
  const [fusionRule,  setFusionRule]  = useState('WHT')
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const { videoRef, active, start: startCam, stop: stopCam, captureFrame } = useCamera()
  const { start: startLiveness, reset: resetLiveness, status: livenessStatus,
          result: livenessResult, progress: livenessProgress, isRunning: livenessRunning } = useLiveness(videoRef)

  const handleCapture = useCallback(() => {
    const frame = captureFrame(224, 224)
    if (!frame) { setError('No frame — start camera first'); return }
    setCaptured(prev => ({ ...prev, [spectrum]: frame }))
    setError(null)
  }, [captureFrame, spectrum])

  const handleVerify = useCallback(async () => {
    if (Object.keys(captured).length === 0) { setError('Capture at least one spectrum first'); return }
    setLoading(true)
    setError(null)
    try {
      const { data } = await verifyPalm(captured, fusionRule)
      setResult(data)
      setStep(STEP.RESULT)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [captured, fusionRule])

  const handleReset = useCallback(() => {
    stopCam()
    setStep(STEP.LIVENESS)
    setCaptured({})
    setResult(null)
    setError(null)
    resetLiveness()
  }, [stopCam, resetLiveness])

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto', animation: 'fade-up 0.4s ease both' }}>
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '6px' }}>
          Verify Identity
        </h1>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          Multispectral palm authentication with Fuzzy Vault key generation
        </p>
      </div>

      {error && (
        <div style={{
          marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.25)',
          color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px',
        }}>
          ✗ {error}
        </div>
      )}

      {/* ── Liveness step ─────────────────────────────────────────────────── */}
      {step === STEP.LIVENESS && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <CameraView videoRef={videoRef} active={active} spectrum={null} />
            {!active && (
              <button onClick={() => startCam()} style={primaryBtnStyle}>START CAMERA</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <LivenessGate
              status={livenessStatus}
              result={livenessResult}
              progress={livenessProgress}
              isRunning={livenessRunning}
              onStart={startLiveness}
              onReset={resetLiveness}
            />
            {livenessStatus === 'pass' && (
              <button onClick={() => setStep(STEP.CAPTURE)} style={primaryBtnStyle}>
                PROCEED TO CAPTURE →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Capture step ──────────────────────────────────────────────────── */}
      {step === STEP.CAPTURE && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <CameraView videoRef={videoRef} active={active} spectrum={spectrum} />
            <button onClick={handleCapture} style={primaryBtnStyle}>
              ◎ CAPTURE {spectrum.toUpperCase()}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Spectrum */}
            <SectionCard title="Active spectrum">
              <SpectrumSelector selected={spectrum} captured={captured} onChange={setSpectrum} />
            </SectionCard>

            {/* Fusion rule */}
            <SectionCard title="Fusion rule">
              <div style={{ display: 'flex', gap: '8px' }}>
                {['WHT', 'SUM', 'MUL'].map(rule => (
                  <button
                    key={rule}
                    onClick={() => setFusionRule(rule)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px',
                      border: fusionRule === rule ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      background: fusionRule === rule ? 'rgba(168,85,247,0.12)' : 'transparent',
                      color: fusionRule === rule ? 'var(--accent-purple)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {rule}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', marginTop: '8px' }}>
                {fusionRule === 'WHT' ? 'Weighted by per-spectrum EER (recommended)' : fusionRule === 'SUM' ? 'Normalized sum of all scores' : 'Product of all scores'}
              </p>
            </SectionCard>

            {/* Captured */}
            <SectionCard title="Captured bands">
              {Object.keys(captured).length === 0 ? (
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>None yet</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.keys(captured).map(s => (
                    <span key={s} style={{
                      padding: '3px 9px', borderRadius: '20px',
                      background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.22)',
                      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>

            <button
              onClick={handleVerify}
              disabled={loading || Object.keys(captured).length === 0}
              style={{
                ...primaryBtnStyle,
                opacity: loading || Object.keys(captured).length === 0 ? 0.5 : 1,
                cursor: loading || Object.keys(captured).length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⟳ VERIFYING...' : '⚡ VERIFY IDENTITY'}
            </button>
          </div>
        </div>
      )}

      {/* ── Result step ───────────────────────────────────────────────────── */}
      {step === STEP.RESULT && result && (
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fade-up 0.4s ease both' }}>
          <AuthResultBanner result={result} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleReset} style={{ ...ghostBtnStyle, flex: 1 }}>← START OVER</button>
            {result.granted && (
              <button onClick={() => setStep(STEP.CAPTURE)} style={{ ...primaryBtnStyle }}>
                RE-VERIFY
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const primaryBtnStyle = {
  width: '100%', padding: '13px 20px', borderRadius: '10px',
  border: '1px solid rgba(0,229,255,0.30)', background: 'rgba(0,229,255,0.10)',
  color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', fontWeight: 700,
  fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease',
}

const ghostBtnStyle = {
  padding: '13px 20px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.10)', background: 'transparent',
  color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600,
  fontSize: '13px', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s ease',
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', padding: '16px',
    }}>
      <div style={{
        fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)',
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}