import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '@/types/dto';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ADMIN_ROLES = ['SHELTER_ADMIN', 'SUPER_ADMIN'];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = (location.state as { message?: string })?.message;
    if (msg) {
      setSuccess(msg);
      setError('');
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: LoginRequest = { email, password };
      const res = await authApi.login(payload);
      const data = res.data?.data ?? res.data;
      if (data?.accessToken && data?.user) {
        const role = data.user?.role ?? '';
        if (!ADMIN_ROLES.includes(role)) {
          setError('관리자 전용 로그인입니다. 일반 회원은 메인에서 로그인해 주세요.');
          setLoading(false);
          return;
        }
        loginStore(
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? '',
            expiresIn: data.expiresIn ?? 3600,
            user: data.user,
          },
          { keepLoggedIn: true }
        );
        navigate('/admin', { replace: true });
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
    <div className="toss-page-with-fixed-header min-h-screen flex flex-col bg-[var(--toss-gray-100)]">
      <Header />
      <main className="flex-1 flex items-center justify-center pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="toss-section-inner"
          style={{ maxWidth: '28rem' }}
        >
          <div className="toss-auth-head">
            <h1 className="toss-auth-title">관리자 로그인</h1>
            <p className="toss-auth-desc">
              보호소·시스템 관리자 전용 로그인입니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="toss-auth-card">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="toss-auth-error"
                style={{
                  backgroundColor: 'var(--toss-blue-light)',
                  borderColor: 'var(--toss-blue)',
                  color: 'var(--toss-blue-dark)',
                }}
              >
                {success}
              </motion.div>
            )}
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
              <label htmlFor="admin-login-email" className="toss-auth-label">
                이메일
              </label>
              <input
                id="admin-login-email"
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
              <label htmlFor="admin-login-password" className="toss-auth-label">
                비밀번호
              </label>
              <input
                id="admin-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="비밀번호"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="toss-auth-submit">
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p className="toss-auth-foot">
              보호소로 가입하시겠어요?{' '}
              <Link to="/admin/signup" className="toss-auth-link">
                보호소 회원가입
              </Link>
            </p>
            <p className="toss-auth-foot">
              <Link to="/login" className="toss-auth-link text-sm text-gray-500">
                ← 일반 회원 로그인
              </Link>
            </p>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
