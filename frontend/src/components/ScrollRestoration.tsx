import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 스크롤 복원 컴포넌트
 * - 버튼/링크로 이동(PUSH/REPLACE): 상단으로 스크롤
 * - 뒤로가기/앞으로가기(POP): 페인트 전에 복원 → 스크롤 애니메이션 없이 자리 그대로 (요즘 웹 UX)
 */
export default function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef<Record<string, number>>({});
  const prevKey = useRef<string | null>(null);
  /** 현재 페이지의 스크롤 위치를 항상 최신으로 유지 (이동 전 저장용) */
  const lastScrollY = useRef(0);

  // 스크롤할 때마다 현재 위치 저장 → 페이지를 떠날 때 이 값을 이전 location.key에 저장
  useEffect(() => {
    const onScroll = () => {
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // beforeunload 시 sessionStorage에 저장 (새로고침/탭 닫기 대비)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (prevKey.current) {
        scrollPositions.current[prevKey.current] = lastScrollY.current;
      }
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions.current));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // sessionStorage에서 복원 (탭 재진입 시)
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPositions');
    if (saved) {
      try {
        scrollPositions.current = { ...scrollPositions.current, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
  }, []);

  // 페인트 전에 스크롤 복원 → 화면이 처음부터 그 자리에 있음 (스크롤 이동 없음)
  useLayoutEffect(() => {
    // 이전 페이지 스크롤 저장
    if (prevKey.current && prevKey.current !== location.key) {
      scrollPositions.current[prevKey.current] = lastScrollY.current;
    }

    if (navigationType === 'POP') {
      const savedPosition = scrollPositions.current[location.key];
      if (savedPosition !== undefined) {
        window.scrollTo(0, savedPosition);
      }
    } else {
      window.scrollTo(0, 0);
      lastScrollY.current = 0;
    }

    prevKey.current = location.key;
  }, [location.key, navigationType]);

  // 비동기로 렌더되는 목록(API 등)은 DOM이 늦게 채워지므로, 한 번 더 복원 (스크롤은 이미 맞춰져 있으면 변화 없음)
  useEffect(() => {
    if (navigationType !== 'POP') return;
    const savedPosition = scrollPositions.current[location.key];
    if (savedPosition === undefined) return;
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition);
    });
    return () => cancelAnimationFrame(id);
  }, [location.key, navigationType]);

  return null;
}
