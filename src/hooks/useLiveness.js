import { useRef, useState, useCallback, useEffect } from 'react';

const COLLECTION_DURATION_MS = 4000;
const FRAME_INTERVAL_MS = 100;

export function useLiveness(videoRef) {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const framesRef = useRef([]);
  const handsRef = useRef(null);
  const intervalRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const loadMediaPipe = useCallback(async () => {
    if (handsRef.current) return handsRef.current;
    setStatus('loading_mediapipe');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    await hands.initialize();
    handsRef.current = hands;
    return hands;
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setProgress(0);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  const start = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);
    setProgress(0);
    framesRef.current = [];

    try {
      const hands = await loadMediaPipe();
      setStatus('collecting');

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');

      hands.onResults((results) => {
        if (!results.multiHandLandmarks?.length) return;
        const lms = results.multiHandLandmarks[0];
        framesRef.current.push({
          landmarks: lms.map(lm => [lm.x, lm.y]),
          timestamp_ms: performance.now()
        });
      });

      let elapsed = 0;
      progressIntervalRef.current = setInterval(() => {
        elapsed += 50;
        setProgress(Math.min(100, Math.floor((elapsed / COLLECTION_DURATION_MS) * 100)));
      }, 50);

      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        ctx.drawImage(video, 0, 0, 320, 240);
        const imageBitmap = await createImageBitmap(canvas);
        await hands.send({ image: imageBitmap });
      }, FRAME_INTERVAL_MS);

      await new Promise(resolve => setTimeout(resolve, COLLECTION_DURATION_MS));
      clearInterval(intervalRef.current);
      clearInterval(progressIntervalRef.current);

      setStatus('checking');
      const frames = framesRef.current;

      if (frames.length < 5) {
        setStatus('fail');
        setResult({ is_live: false, reason: 'no_hand_detected' });
        setIsRunning(false);
        return;
      }

      const response = await fetch('http://localhost:8081/api/v1/liveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, requireGesture: true })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setResult(data);
      setStatus(data.is_live ? 'pass' : 'fail');
    } catch (err) {
      console.error('Liveness check error:', err);
      setStatus('error');
      setResult({ is_live: false, reason: 'network_error', detail: err.message });
    } finally {
      clearInterval(intervalRef.current);
      clearInterval(progressIntervalRef.current);
      setIsRunning(false);
    }
  }, [videoRef, isRunning, loadMediaPipe]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  return { start, reset, status, result, progress, isRunning };
}

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