import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '@/types/dto';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const STORAGE_EMAIL = 'login_saved_email';
const STORAGE_PASSWORD = 'login_saved_password';
const STORAGE_REMEMBER_EMAIL = 'login_remember_email';
const STORAGE_REMEMBER_PASSWORD = 'login_remember_password';
const STORAGE_KEEP_LOGGED_IN = 'login_keep_logged_in';

function loadSavedCredentials() {
  try {
    const savedEmail = localStorage.getItem(STORAGE_EMAIL);
    const savedPassword = localStorage.getItem(STORAGE_PASSWORD);
    const rememberEmail = localStorage.getItem(STORAGE_REMEMBER_EMAIL) === '1';
    const rememberPassword = localStorage.getItem(STORAGE_REMEMBER_PASSWORD) === '1';
    const keepLoggedIn = localStorage.getItem(STORAGE_KEEP_LOGGED_IN) !== '0';
    return {
      email: savedEmail ?? '',
      password: savedPassword ?? '',
      rememberEmail,
      rememberPassword,
      keepLoggedIn,
    };
  } catch {
    return {
      email: '',
      password: '',
      rememberEmail: false,
      rememberPassword: false,
      keepLoggedIn: true,
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleButtonMounted, setGoogleButtonMounted] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleRenderedRef = useRef(false);

  const setGoogleButtonRef = useCallback((el: HTMLDivElement | null) => {
    googleButtonRef.current = el;
    if (el) setGoogleButtonMounted(true);
  }, []);

  useEffect(() => {
    const saved = loadSavedCredentials();
    setEmail(saved.email);
    setPassword(saved.password);
    setRememberEmail(saved.rememberEmail);
    setRememberPassword(saved.rememberPassword);
    setKeepLoggedIn(saved.keepLoggedIn);
  }, []);

  // 구글 GSI 스크립트 로드 및 ID 토큰용 초기화(initialize + renderButton)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleRenderedRef.current) return;

    const initGoogle = () => {
      const accounts = window.google?.accounts;
      if (!accounts?.id) return;
      const el = googleButtonRef.current;
      if (!el) return;

      accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (res: CredentialResponse) => {
          setError('');
          setGoogleLoading(true);
          try {
            const apiRes = await authApi.googleLogin(res.credential);
            const data = apiRes.data?.data ?? apiRes.data;
            if (data?.accessToken && data?.user) {
              loginStore(
                {
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken ?? '',
                  expiresIn: data.expiresIn ?? 3600,
                  user: data.user,
                },
                { keepLoggedIn: true }
              );
              navigate('/', { replace: true });
            } else {
              setError('로그인 응답 형식이 올바르지 않습니다.');
            }
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? '구글 로그인에 실패했습니다.');
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 356, // 폼 너비(420px)에서 패딩(32px*2)을 뺀 값에 가깝게 조정
      });
      googleRenderedRef.current = true;
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [GOOGLE_CLIENT_ID, googleButtonMounted, loginStore, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (rememberEmail) {
        localStorage.setItem(STORAGE_EMAIL, email);
        localStorage.setItem(STORAGE_REMEMBER_EMAIL, '1');
      } else {
        localStorage.removeItem(STORAGE_EMAIL);
        localStorage.removeItem(STORAGE_REMEMBER_EMAIL);
      }
      if (rememberPassword) {
        localStorage.setItem(STORAGE_PASSWORD, password);
        localStorage.setItem(STORAGE_REMEMBER_PASSWORD, '1');
      } else {
        localStorage.removeItem(STORAGE_PASSWORD);
        localStorage.removeItem(STORAGE_REMEMBER_PASSWORD);
      }
      localStorage.setItem(STORAGE_KEEP_LOGGED_IN, keepLoggedIn ? '1' : '0');

      const payload: LoginRequest = { email, password };
      const res = await authApi.login(payload);
      const data = res.data?.data ?? res.data;
      if (data?.accessToken && data?.user) {
        loginStore(
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? '',
            expiresIn: data.expiresIn ?? 3600,
            user: data.user,
          },
          { keepLoggedIn }
        );
        navigate('/', { replace: true });
      } else {
        setError('로그인 응답 형식이 올바르지 않습니다.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="toss-auth-page">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="toss-auth-wrap"
      >
        <div className="toss-auth-head">
          <h1 className="toss-auth-title">로그인</h1>
          <p className="toss-auth-desc">62댕냥이와 함께 따뜻한 가족을 만나보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="toss-auth-card">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="toss-auth-error"
            >
              {error}
            </motion.div>
          )}

          <div className="toss-auth-field">
            <label htmlFor="login-email" className="toss-auth-label">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="toss-auth-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="toss-auth-field">
            <label htmlFor="login-password" className="toss-auth-label">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="toss-auth-input"
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </div>

          <div className="toss-auth-options">
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">이메일 저장</span>
            </label>
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">비밀번호 저장</span>
            </label>
            <label className="toss-auth-checkbox-row">
              <input
                type="checkbox"
                className="toss-auth-checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
              />
              <span className="toss-auth-checkbox-label">로그인 유지</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="toss-auth-submit">
            {loading ? '로그인 중...' : '로그인'}
          </button>


          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '32px' }}>
            {/* 구글 로그인 스크립트가 렌더링될 영역 */}
            {GOOGLE_CLIENT_ID && (
              <div className="toss-auth-google-wrap" style={{ minHeight: 40, display: 'flex', justifyContent: 'center' }}>
                {googleLoading && (
                  <div style={{ marginBottom: 8, color: 'var(--toss-gray-600)', fontSize: 14 }}>
                    구글 로그인 중...
                  </div>
                )}
                <div ref={setGoogleButtonRef} aria-hidden={googleLoading} />
              </div>
            )}

            {/* 카카오 로그인 */}
            <button
              type="button"
              onClick={() => {
                const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
                const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
                const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
                window.location.href = kakaoURL;
              }}
              style={{
                width: '356px',
                height: '40px',
                backgroundColor: '#FEE500',
                borderRadius: '6px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: 'rgba(0, 0, 0, 0.85)',
                padding: '0 12px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3C5.13437 3 2 5.34375 2 8.25C2 10.0875 3.25 11.6625 5.125 12.6375L4.40625 15.1875C4.34375 15.4312 4.6125 15.6188 4.81875 15.4688L8.03125 13.35H9C12.8656 13.35 16 11.0062 16 8.1C16 5.19375 12.8656 2.85 9 2.85V3Z" fill="black"/>
              </svg>
              카카오 로그인
            </button>
          </div>


          <p className="toss-auth-foot">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="toss-auth-link">
              회원가입
            </Link>
          </p>
          <p className="toss-auth-foot" style={{ marginTop: 8 }}>
            <Link to="/admin/login" className="toss-auth-link" style={{ fontSize: '0.9rem', color: 'var(--toss-gray-500)' }}>
              관리자 로그인 바로가기
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
