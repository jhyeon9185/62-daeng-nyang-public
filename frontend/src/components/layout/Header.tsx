import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

const navItems = [
  { to: '/animals', label: '입양' },
  { to: '/volunteers', label: '봉사' },
  { to: '/donations', label: '기부' },
  { to: '/boards', label: '게시판' },
];

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;

        // 작은 흔들림은 무시
        const threshold = 8;
        if (Math.abs(delta) > threshold) {
          // 아래로 스크롤 + 어느 정도 내려간 경우 숨김
          if (delta > 0 && y > 80) setHidden(true);
          // 위로 스크롤이면 노출
          if (delta < 0) setHidden(false);
          lastYRef.current = y;
        } else {
          lastYRef.current = y;
        }

        // 최상단에서는 항상 노출
        if (y <= 10) setHidden(false);

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={clsx('toss-header', hidden && 'toss-header--hidden')}>
      <div className="toss-header-inner">
        <Link to="/" className="toss-logo" aria-label="62댕냥 홈">
          <img src="/logo-bk.webp" alt="62댕냥" className="toss-logo-img" width={180} height={48} />
        </Link>

        <nav className="toss-nav hidden md:flex" aria-label="메인 메뉴">
          {navItems.map(({ to, label }) => (
            <Link key={to} to={to} className="toss-nav-link">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'SHELTER_ADMIN') && (
                <Link to="/admin" className="toss-btn toss-btn-ghost">
                  관리자
                </Link>
              )}
              <Link to="/mypage" className="toss-btn toss-btn-ghost">
                마이페이지
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="toss-btn toss-btn-primary"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="toss-btn toss-btn-ghost">
                로그인
              </Link>
              <Link to="/signup" className="landing-btn landing-btn-primary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
