import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 스크롤 복원 컴포넌트
 * - 버튼/링크로 이동(PUSH/REPLACE): 상단으로 스크롤
 * - 뒤로가기/앞으로가기(POP): 이전 스크롤 위치 복원 (일반 사이트와 동일한 UX)
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

  useEffect(() => {
    // 이전 페이지 스크롤 저장: 이동 후에는 window.scrollY가 새 페이지 값이므로, 미리 저장해 둔 lastScrollY 사용
    if (prevKey.current && prevKey.current !== location.key) {
      scrollPositions.current[prevKey.current] = lastScrollY.current;
    }

    if (navigationType === 'POP') {
      // 뒤로가기/앞으로가기: 저장된 위치로 복원
      const savedPosition = scrollPositions.current[location.key];
      if (savedPosition !== undefined) {
        const restore = () => window.scrollTo(0, savedPosition);
        requestAnimationFrame(() => {
          restore();
          requestAnimationFrame(restore); // 비동기 렌더(목록 등) 후 한 번 더 복원
        });
      }
    } else {
      // PUSH/REPLACE: 상단으로 스크롤
      window.scrollTo(0, 0);
      lastScrollY.current = 0;
    }

    prevKey.current = location.key;
  }, [location.key, navigationType]);

  return null;
}
