import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * useCamera — manages webcam stream lifecycle.
 * Prefers rear camera (environment) for phone via DroidCam.
 */
export function useCamera() {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const [active,  setActive]  = useState(false)
  const [error,   setError]   = useState(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState(null)

  // Enumerate available cameras on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(all => setDevices(all.filter(d => d.kind === 'videoinput')))
      .catch(() => {})
  }, [])

  const start = useCallback(async (preferredDeviceId = null) => {
    setError(null)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const constraints = {
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' },   width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
      setDeviceId(preferredDeviceId)
    } catch (err) {
      setError(err.message || 'Camera access denied')
      setActive(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  /**
   * Captures the current video frame as a base64 JPEG string (no data: prefix).
   */
  const captureFrame = useCallback((width = 224, height = 224) => {
    const video = videoRef.current
    if (!video || !active) return null

    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // Crop central square from video
    const vw = video.videoWidth
    const vh = video.videoHeight
    const side  = Math.min(vw, vh)
    const srcX  = Math.floor((vw - side) / 2)
    const srcY  = Math.floor((vh - side) / 2)
    ctx.drawImage(video, srcX, srcY, side, side, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
  }, [active])

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop])

  return { videoRef, active, error, devices, deviceId, start, stop, captureFrame }
}