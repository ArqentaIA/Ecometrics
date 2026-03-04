import { useEffect, useRef, useState, useCallback } from "react";

interface UseLoopAnimationOptions {
  /** The real KPI value (animation target) */
  targetValue: number;
  /** Rise duration in ms (default 1500) */
  riseDuration?: number;
  /** Hold duration in ms (default 3000) */
  holdDuration?: number;
  /** Fall duration in ms (default 700) */
  fallDuration?: number;
}

interface UseLoopAnimationResult {
  /** Current animated display value (0 → targetValue → 0 loop) */
  displayValue: number;
  /** Progress 0–1 for chart reveal masks */
  progress: number;
  /** True during the brief pulse at peak */
  isPulsing: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useLoopAnimation({
  targetValue,
  riseDuration = 1500,
  holdDuration = 3000,
  fallDuration = 700,
}: UseLoopAnimationOptions): UseLoopAnimationResult {
  const [displayValue, setDisplayValue] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef(targetValue);

  // Keep target in sync
  useEffect(() => {
    targetRef.current = targetValue;
  }, [targetValue]);

  const animate = useCallback(() => {
    const totalCycle = riseDuration + holdDuration + fallDuration;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) % totalCycle;
      const tv = targetRef.current;

      let p: number;
      if (elapsed < riseDuration) {
        // Rising phase
        p = easeInOutCubic(elapsed / riseDuration);
      } else if (elapsed < riseDuration + holdDuration) {
        // Hold phase
        p = 1;
        // Pulse at the very start of hold
        if (elapsed - riseDuration < 50) {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 200);
        }
      } else {
        // Falling phase
        const fallElapsed = elapsed - riseDuration - holdDuration;
        p = 1 - easeInOutCubic(fallElapsed / fallDuration);
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

