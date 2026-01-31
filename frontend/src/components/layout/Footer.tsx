import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="toss-footer">
      <div className="toss-footer-inner">
        <Link to="/" className="toss-footer-brand" aria-label="62댕냥 홈">
          <img src="/logo-wh.webp" alt="62댕냥" className="toss-footer-logo-img" width={180} height={48} />
        </Link>
        <nav className="toss-footer-nav" aria-label="푸터 메뉴">
          <Link to="/privacy" className="toss-footer-link">
            개인정보처리방침
          </Link>
          <Link to="/terms" className="toss-footer-link">
            이용약관
          </Link>
          <Link to="/admin/login" className="toss-footer-link">
            관리자 로그인
          </Link>
          <Link to="/admin/signup" className="toss-footer-link">
            보호소 회원가입
          </Link>
          <a href="mailto:contact@dnplatform.com" className="toss-footer-link">
            문의
          </a>
        </nav>
        <p className="toss-footer-copy">
          © {new Date().getFullYear()} 62댕냥. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
