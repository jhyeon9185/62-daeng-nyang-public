import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '@/types/dto';

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

  useEffect(() => {
    const saved = loadSavedCredentials();
    setEmail(saved.email);
    setPassword(saved.password);
    setRememberEmail(saved.rememberEmail);
    setRememberPassword(saved.rememberPassword);
    setKeepLoggedIn(saved.keepLoggedIn);
  }, []);

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
