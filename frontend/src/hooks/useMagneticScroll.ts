import { useEffect, useRef } from 'react';

interface MagneticScrollOptions {
  enabled?: boolean;
  /**
   * 헤더 높이만큼 “붙을 기준”을 내립니다. (px)
   * 섹션에 scroll-margin-top을 같이 주는 것을 권장합니다.
   */
  topOffsetPx?: number;
  /**
   * 스크롤이 멈췄다고 판단하는 딜레이 (ms)
   */
  settleDelayMs?: number;
  /**
   * 기준점 근처에 들어오면 자동 스냅 (px)
   */
  thresholdPx?: number;
}

/**
 * “자석처럼 붙는” 스크롤 스냅 느낌을 만드는 훅.
 * - 사용자가 스크롤을 멈추면, 가장 가까운 섹션으로 부드럽게 정렬합니다.
 * - scroll-snap처럼 별도의 스크롤 컨테이너를 만들지 않아도 동작합니다.
 */
export default function useMagneticScroll(selector: string, options: MagneticScrollOptions = {}) {
  const {
    enabled = true,
    topOffsetPx = 64,
    settleDelayMs = 120,
    thresholdPx = 140,
  } = options;

  const settleTimerRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const clearTimer = () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    };

    const snapToNearest = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (nodes.length === 0) return;

      const targetY = topOffsetPx;
      let best: { el: HTMLElement; dist: number } | null = null;

      for (const el of nodes) {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - targetY);
        if (!best || dist < best.dist) best = { el, dist };
      }

      if (!best) return;
      if (best.dist > thresholdPx) return;

      isAutoScrollingRef.current = true;
      best.el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      window.setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 520);
    };

    const onScroll = () => {
      if (isAutoScrollingRef.current) return;
      clearTimer();
      settleTimerRef.current = window.setTimeout(snapToNearest, settleDelayMs);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimer();
    };
  }, [enabled, selector, settleDelayMs, thresholdPx, topOffsetPx]);
}

