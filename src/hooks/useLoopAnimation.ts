import { useEffect, useRef, useState, useCallback } from "react";

interface UseLoopAnimationOptions {
  targetValue: number;
  riseDuration?: number;
  holdDuration?: number;
  fallDuration?: number;
}

interface UseLoopAnimationResult {
  displayValue: number;
  progress: number;
  isPulsing: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Fixed 5s total cycle: 2500ms rise, 1800ms hold, 700ms fall
const DEFAULT_RISE = 2500;
const DEFAULT_HOLD = 1800;
const DEFAULT_FALL = 700;

export function useLoopAnimation({
  targetValue,
  riseDuration = DEFAULT_RISE,
  holdDuration = DEFAULT_HOLD,
  fallDuration = DEFAULT_FALL,
}: UseLoopAnimationOptions): UseLoopAnimationResult {
  const [displayValue, setDisplayValue] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef(targetValue);
  const pulsedRef = useRef(false);

  useEffect(() => {
    targetRef.current = targetValue;
  }, [targetValue]);

  const animate = useCallback(() => {
    const totalCycle = riseDuration + holdDuration + fallDuration;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) % totalCycle;
      const phaseStart = elapsed < riseDuration;
      const tv = targetRef.current;

      let p: number;
      if (elapsed < riseDuration) {
        p = easeInOutCubic(elapsed / riseDuration);
        pulsedRef.current = false;
      } else if (elapsed < riseDuration + holdDuration) {
        p = 1;
        if (!pulsedRef.current) {
          pulsedRef.current = true;
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 200);
        }
      } else {
        p = 1 - easeInOutCubic((elapsed - riseDuration - holdDuration) / fallDuration);
      }

      setProgress(tv > 0 ? p : 0);
      setDisplayValue(tv > 0 ? p * tv : 0);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [riseDuration, holdDuration, fallDuration]);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      setProgress(0);
      return;
    }
    animate();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, animate]);

  return { displayValue, progress, isPulsing };
}
