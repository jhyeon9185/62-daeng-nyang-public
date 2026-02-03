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

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#191f28"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    logout();
    setMenuOpen(false);
    navigate('/', { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;

        const threshold = 8;
        if (Math.abs(delta) > threshold) {
          if (delta > 0 && y > 80) setHidden(true);
          if (delta < 0) setHidden(false);
          lastYRef.current = y;
        } else {
          lastYRef.current = y;
        }

        if (y <= 10) setHidden(false);

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    const onResize = () => window.innerWidth >= 768 && setMenuOpen(false);
    document.body.classList.add('toss-menu-open');
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.classList.remove('toss-menu-open');
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

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

        {/* 데스크톱: 버튼들 / 모바일: 햄버거 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-3">
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

          <button
            type="button"
            className="toss-hamburger md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* 모바일 햄버거 메뉴 드로어 */}
      <div
        className={clsx('toss-menu-backdrop', menuOpen && 'toss-menu-backdrop--open')}
        onClick={closeMenu}
        aria-hidden
      />
      <div className={clsx('toss-menu-drawer', menuOpen && 'toss-menu-drawer--open')}>
        <nav className="toss-menu-nav" aria-label="모바일 메뉴">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="toss-menu-link"
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="toss-menu-actions">
          {isAuthenticated ? (
            <>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'SHELTER_ADMIN') && (
                <Link
                  to="/admin"
                  className="toss-menu-link toss-menu-link--admin"
                  onClick={closeMenu}
                >
                  관리자
                </Link>
              )}
              <Link
                to="/mypage"
                className="toss-menu-link toss-menu-link--primary"
                onClick={closeMenu}
              >
                마이페이지
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="toss-menu-btn toss-menu-btn--logout"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="toss-menu-link toss-menu-link--primary"
                onClick={closeMenu}
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="toss-menu-btn toss-menu-btn--signup"
                onClick={closeMenu}
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
