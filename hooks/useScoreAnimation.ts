'use client';

import { useEffect, useRef, useState } from 'react';

export type ScoreDirection = 'up' | 'down' | null;

/**
 * Track score value changes and return a direction indicator that auto-clears.
 * Supports separate durations for up (elevation) and down (flash) states.
 */
export function useScoreAnimation(
  value: number | null | undefined,
  resetMs: number | { up: number; down: number } = { up: 600, down: 300 }
): ScoreDirection {
  const prevRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<ScoreDirection>(null);
  const upMs = typeof resetMs === 'number' ? resetMs : resetMs.up;
  const downMs = typeof resetMs === 'number' ? resetMs : resetMs.down;

  useEffect(() => {
    if (value == null) {
      prevRef.current = null;
      return;
    }
    if (prevRef.current === null) {
      prevRef.current = value;
      return;
    }
    const isUp = value > prevRef.current;
    const isDown = value < prevRef.current;
    if (isUp) {
      setDirection('up');
    } else if (isDown) {
      setDirection('down');
    }
    prevRef.current = value;

    const ms = isUp ? upMs : isDown ? downMs : upMs;
    const timer = setTimeout(() => setDirection(null), ms);
    return () => clearTimeout(timer);
  }, [value, upMs, downMs]);

  return direction;
}

/**
 * Smoothly animate a numeric value change over a given duration.
 * Returns the interpolated value that transitions from old to new.
 * Respects prefers-reduced-motion.
 */
export function useAnimatedValue(target: number, durationMs: number = 800): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) return;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // expo-out: fast start, gentle deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, durationMs]);

  return display;
}
