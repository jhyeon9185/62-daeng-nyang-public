import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [shelterName, setShelterName] = useState('');
  const [address, setAddress] = useState('');
  const [shelterPhone, setShelterPhone] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [businessRegistrationFile, setBusinessRegistrationFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('managerName', managerName.trim());
      formData.append('managerPhone', managerPhone.trim());
      formData.append('shelterName', shelterName.trim());
      formData.append('address', address.trim());
      formData.append('shelterPhone', shelterPhone.trim());
      if (businessRegistrationNumber.trim()) {
        formData.append('businessRegistrationNumber', businessRegistrationNumber.trim().replace(/-/g, ''));
      }
      if (businessRegistrationFile) {
        formData.append('businessRegistrationFile', businessRegistrationFile);
      }
      const res = await authApi.shelterSignup(formData);
      const data = res.data?.data ?? res.data;
      if (data?.userId != null) {
        navigate('/admin/login', { replace: true, state: { message: data.message ?? '보호소 가입 신청이 완료되었습니다. 시스템 관리자 승인 후 로그인해 이용해 주세요.' } });
        return;
      }
      setError('가입 신청 처리 중 오류가 발생했습니다.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '보호소 가입 신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="toss-page-with-fixed-header min-h-screen flex flex-col bg-[var(--toss-gray-100)]">
      <Header />
      <main className="flex-1 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="toss-section-inner mx-auto"
          style={{ maxWidth: '28rem' }}
        >
          <div className="toss-auth-head">
            <h1 className="toss-auth-title">보호소 회원가입</h1>
            <p className="toss-auth-desc">
              보호소 관리자로 가입하시면 봉사·기부 요청글 작성 및 신청 승인/반려가 가능합니다. 사업자등록증을 업로드해 주시면 시스템 관리자 승인 후 이용할 수 있습니다.
            </p>
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
              <label htmlFor="admin-signup-email" className="toss-auth-label">이메일</label>
              <input
                id="admin-signup-email"
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
              <label htmlFor="admin-signup-password" className="toss-auth-label">비밀번호 (8자 이상)</label>
              <input
                id="admin-signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="toss-auth-input"
                placeholder="비밀번호"
                autoComplete="new-password"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-manager-name" className="toss-auth-label">담당자 이름</label>
              <input
                id="admin-signup-manager-name"
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="홍길동"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-manager-phone" className="toss-auth-label">담당자 연락처</label>
              <input
                id="admin-signup-manager-phone"
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="010-1234-5678"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-shelter-name" className="toss-auth-label">보호소명</label>
              <input
                id="admin-signup-shelter-name"
                type="text"
                value={shelterName}
                onChange={(e) => setShelterName(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="○○동물보호센터"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-address" className="toss-auth-label">보호소 주소</label>
              <input
                id="admin-signup-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="도로명 주소"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-shelter-phone" className="toss-auth-label">보호소 전화번호</label>
              <input
                id="admin-signup-shelter-phone"
                type="tel"
                value={shelterPhone}
                onChange={(e) => setShelterPhone(e.target.value)}
                required
                className="toss-auth-input"
                placeholder="02-1234-5678"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-business-reg" className="toss-auth-label">
                사업자등록번호 <span className="toss-auth-label-optional">선택</span>
              </label>
              <input
                id="admin-signup-business-reg"
                type="text"
                value={businessRegistrationNumber}
                onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                className="toss-auth-input"
                placeholder="123-45-67890 또는 1234567890"
              />
            </div>
            <div className="toss-auth-field">
              <label htmlFor="admin-signup-business-file" className="toss-auth-label">
                사업자등록증 업로드 <span className="toss-auth-label-optional">권장</span>
              </label>
              <input
                id="admin-signup-business-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setBusinessRegistrationFile(e.target.files?.[0] ?? null)}
                className="toss-auth-input block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (최대 10MB). 시스템 관리자 승인 시 참고됩니다.</p>
            </div>

            <button type="submit" disabled={loading} className="toss-auth-submit">
              {loading ? '가입 신청 중...' : '가입 신청'}
            </button>

            <p className="toss-auth-foot">
              이미 계정이 있으신가요?{' '}
              <Link to="/admin/login" className="toss-auth-link">
                관리자 로그인
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
