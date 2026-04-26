import React, { useEffect, useRef } from 'react'

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#040608',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  offLabel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: '#6b7f91',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
}

/**
 * CameraView — renders the video feed with an ROI crosshair overlay.
 * The crosshair shows the crop zone used for palm capture.
 */
export default function CameraView({ videoRef, active, spectrum }) {
  const canvasRef = useRef(null)

  // Draw animated ROI overlay on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      if (!active) { raf = requestAnimationFrame(draw); return }

      // ROI box — central 60% of frame
      const margin = w * 0.20
      const bx = margin, by = margin
      const bw = w - margin * 2
      const bh = h - margin * 2

      // Dimming outside ROI
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(0, 0, w, by)
      ctx.fillRect(0, by + bh, w, h - by - bh)
      ctx.fillRect(0, by, bx, bh)
      ctx.fillRect(bx + bw, by, w - bx - bw, bh)

      // Corner brackets
      const corner = 24
      const color  = active ? '#00e5ff' : 'rgba(255,255,255,0.2)'
      ctx.strokeStyle = color
      ctx.lineWidth   = 2
      ctx.lineCap     = 'square'

      const corners = [
        [bx, by, 1, 1], [bx + bw, by, -1, 1],
        [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1],
      ]
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath()
        ctx.moveTo(cx + dx * corner, cy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx, cy + dy * corner)
        ctx.stroke()
      })

      // Center crosshair
      const cx2 = bx + bw / 2
      const cy2 = by + bh / 2
      ctx.strokeStyle = 'rgba(0,229,255,0.3)'
      ctx.lineWidth   = 1
      ctx.setLineDash([4, 6])
      ctx.beginPath(); ctx.moveTo(cx2 - 12, cy2); ctx.lineTo(cx2 + 12, cy2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx2, cy2 - 12); ctx.lineTo(cx2, cy2 + 12); ctx.stroke()
      ctx.setLineDash([])

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [active])

  // Keep canvas size synced to wrapper
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      canvas.width  = width
      canvas.height = height
    })
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  return (
    <div style={styles.wrapper}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ ...styles.video, opacity: active ? 1 : 0 }}
      />

      {!active && (
        <div style={styles.offLabel}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <path d="M14 20h12M20 14v12" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Camera offline</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ ...styles.overlay, width: '100%', height: '100%' }}
      />

      {/* Status badge */}
      <div style={styles.badge}>
        <div style={{
          ...styles.dot,
          background: active ? '#00ff88' : '#3a4a58',
          boxShadow: active ? '0 0 6px #00ff88' : 'none',
          animation: active ? 'blink 2s ease infinite' : 'none',
        }} />
        {active ? (spectrum ? spectrum.toUpperCase() : 'LIVE') : 'OFFLINE'}
      </div>
    </div>
  )
}