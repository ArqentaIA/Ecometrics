import { useEffect, useRef, useState } from "react";

interface UseLoopAnimationOptions {
  targetValue: number;
  riseDuration?: number;
}

interface UseLoopAnimationResult {
  displayValue: number;
  progress: number;
  isPulsing: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useLoopAnimation({
  targetValue,
  riseDuration = 2500,
}: UseLoopAnimationOptions): UseLoopAnimationResult {
  const [displayValue, setDisplayValue] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      setProgress(0);
      doneRef.current = false;
      return;
    }

    // If already done animating, just snap to new value
    if (doneRef.current) {
      setDisplayValue(targetValue);
      setProgress(1);
      return;
    }

    let startTime: number | null = null;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / riseDuration, 1);
      const p = easeInOutCubic(t);

      setProgress(p);
      setDisplayValue(p * targetValue);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Done — pulse and stay
        doneRef.current = true;
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 200);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, riseDuration]);

  return { displayValue, progress, isPulsing };
}
