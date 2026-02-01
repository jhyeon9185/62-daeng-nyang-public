import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 스크롤 복원 컴포넌트
 * - 새 페이지 이동(PUSH/REPLACE): 상단으로 스크롤
 * - 뒤로가기/앞으로가기(POP): 이전 스크롤 위치 복원
 */
export default function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef<Record<string, number>>({});
  const prevKey = useRef<string | null>(null);

  // 페이지 떠날 때 현재 스크롤 위치 저장
  useEffect(() => {
    const saveScrollPosition = () => {
      if (prevKey.current) {
        scrollPositions.current[prevKey.current] = window.scrollY;
      }
    };

    // beforeunload 시 저장 (새로고침/탭 닫기 대비 - sessionStorage 사용)
    const handleBeforeUnload = () => {
      saveScrollPosition();
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions.current));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // sessionStorage에서 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPositions');
    if (saved) {
      try {
        scrollPositions.current = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // 이전 페이지 스크롤 위치 저장
    if (prevKey.current && prevKey.current !== location.key) {
      scrollPositions.current[prevKey.current] = window.scrollY;
    }

    // 스크롤 처리
    if (navigationType === 'POP') {
      // 뒤로가기/앞으로가기: 저장된 위치로 복원
      const savedPosition = scrollPositions.current[location.key];
      if (savedPosition !== undefined) {
        // requestAnimationFrame으로 렌더링 완료 후 스크롤
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      }
    } else {
      // PUSH/REPLACE: 상단으로 스크롤
      window.scrollTo(0, 0);
    }

    prevKey.current = location.key;
  }, [location.key, navigationType]);

  return null;
}
