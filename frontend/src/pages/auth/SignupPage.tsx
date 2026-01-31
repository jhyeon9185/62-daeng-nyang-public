import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { SignupRequest } from '@/types/dto';

export default function SignupPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: SignupRequest = { email, password, name, phone };
      if (address.trim()) payload.address = address;
      const res = await authApi.signup(payload);
      const data = res.data?.data ?? res.data;
      const signupOk = data && (data.id !== undefined && data.id !== null);
      if (!signupOk) {
        setError('가입 후 로그인해 주세요.');
        return;
      }
      // 회원가입 성공 후 자동 로그인
      try {
        const loginRes = await authApi.login({ email, password });
        const loginPayload = loginRes.data?.data ?? loginRes.data;
        const accessToken = loginPayload?.accessToken;
        const user = loginPayload?.user;
        if (accessToken && user) {
          loginStore({
            accessToken,
            refreshToken: loginPayload?.refreshToken ?? '',
            expiresIn: loginPayload?.expiresIn ?? 3600,
            user,
          });
          navigate('/', { replace: true });
          return;
        }
      } catch (loginErr: unknown) {
        const loginMsg = (loginErr as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(loginMsg ?? '로그인에 실패했습니다. 위 이메일/비밀번호로 로그인 페이지에서 다시 시도해 주세요.');
        return;
      }
      setError('로그인 응답 형식이 올바르지 않습니다. 로그인 페이지에서 다시 시도해 주세요.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '회원가입에 실패했습니다.');
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
          <h1 className="toss-auth-title">회원가입</h1>
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
            <label htmlFor="signup-email" className="toss-auth-label">
              이메일
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="toss-auth-label">
              비밀번호
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="toss-auth-input"
              placeholder="8자 이상"
              autoComplete="new-password"
            />
          </div>
          <div className="toss-auth-field">
            <label htmlFor="signup-name" className="toss-auth-label">
              이름
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="toss-auth-input"
              placeholder="홍길동"
              autoComplete="name"
            />
          </div>
          <div className="toss-auth-field">
            <label htmlFor="signup-phone" className="toss-auth-label">
              전화번호 <span className="toss-auth-label-optional">(선택)</span>
            </label>
            <input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="toss-auth-input"
              placeholder="010-1234-5678"
              autoComplete="tel"
            />
          </div>
          <div className="toss-auth-field">
            <label htmlFor="signup-address" className="toss-auth-label">
              주소 <span className="toss-auth-label-optional">(선택)</span>
            </label>
            <input
              id="signup-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="toss-auth-input"
              placeholder="주소"
              autoComplete="street-address"
            />
          </div>

          <button type="submit" disabled={loading} className="toss-auth-submit">
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <p className="toss-auth-foot">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="toss-auth-link">
              로그인
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
