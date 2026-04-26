import { useRef, useState, useCallback, useEffect } from 'react';
import { verifyPalm } from '../api/palmApi';

const VERIFY_INTERVAL_MS = 2000;     // re-verify every 2 seconds
const CONFIDENCE_HISTORY = 10;        // keep last 10 scores for rolling avg
const SESSION_TIMEOUT_MS = 30000;     // kill session after 30s of low confidence
const LOW_CONFIDENCE_THRESHOLD = 0.6; // below this = suspicious

/**
 * useContinuousAuth — polls verifyPalm() every 2 seconds while active.
 * Maintains a rolling confidence history and fires onSessionExpired
 * if confidence stays low for too long.
 */
export function useContinuousAuth({
  getFrames,          // () => { [spectrum]: base64 } — current captured frames
  fusionRule = 'WHT',
  onSessionExpired,   // callback when trust drops
  onIdentityChange,   // callback when identity changes mid-session
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScore, setCurrentScore] = useState(null);
  const [currentIdentity, setCurrentIdentity] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [sessionMs, setSessionMs] = useState(0);

  const intervalRef = useRef(null);
  const tickRef = useRef(null);
  const lowConfidenceStartRef = useRef(null);
  const lastIdentityRef = useRef(null);

  const runVerify = useCallback(async () => {
    const frames = getFrames();
    if (!frames || Object.keys(frames).length === 0) return;

    try {
      const { data } = await verifyPalm(frames, fusionRule);
      const score = data.fusedScore ?? 0;
      const identity = data.identity ?? null;

      setCurrentScore(score);
      setCurrentIdentity(identity);
      setScoreHistory(prev => {
        const updated = [...prev, score].slice(-CONFIDENCE_HISTORY);
        return updated;
      });

      // Identity change detection
      if (lastIdentityRef.current && identity && identity !== lastIdentityRef.current) {
        onIdentityChange?.({ previous: lastIdentityRef.current, current: identity });
      }
      lastIdentityRef.current = identity;

      // Low confidence tracking
      if (score < LOW_CONFIDENCE_THRESHOLD) {
        if (!lowConfidenceStartRef.current)
          lowConfidenceStartRef.current = Date.now();
        else if (Date.now() - lowConfidenceStartRef.current > SESSION_TIMEOUT_MS)
          onSessionExpired?.({ reason: 'low_confidence', lastScore: score });
      } else {
        lowConfidenceStartRef.current = null;
      }

    } catch {
      // Network blip — don't crash the session, just skip this tick
    }
  }, [getFrames, fusionRule, onIdentityChange, onSessionExpired]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setSessionMs(0);
    lowConfidenceStartRef.current = null;

    intervalRef.current = setInterval(runVerify, VERIFY_INTERVAL_MS);

    // Session timer tick (every second)
    tickRef.current = setInterval(() => {
      setSessionMs(prev => prev + 1000);
    }, 1000);
  }, [isRunning, runVerify]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(tickRef.current);
    setIsRunning(false);
    setCurrentScore(null);
    setScoreHistory([]);
    setSessionMs(0);
    lastIdentityRef.current = null;
    lowConfidenceStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(tickRef.current);
    };
  }, []);

  const rollingAverage = scoreHistory.length
    ? scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length
    : null;

  return {
    start,
    stop,
    isRunning,
    currentScore,
    currentIdentity,
    scoreHistory,
    rollingAverage,
    sessionMs,
  };
}