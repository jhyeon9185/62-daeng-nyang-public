import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { preferenceApi } from '@/api/preference';
import { useAuthStore } from '@/store/authStore';
import { REGION_SIDO_OPTIONS } from '@/constants/regions';
import type { PreferenceRequest } from '@/types/dto';

const SPECIES_OPTIONS: { value: '' | 'DOG' | 'CAT'; label: string }[] = [
  { value: '', label: '선택 안 함' },
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
];

const SIZE_OPTIONS: { value: '' | 'SMALL' | 'MEDIUM' | 'LARGE'; label: string }[] = [
  { value: '', label: '선택 안 함' },
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
];

export default function PreferencePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [species, setSpecies] = useState<string>('');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    preferenceApi
      .getMy()
      .then((data) => {
        if (data) {
          setSpecies(data.species ?? '');
          setMinAge(data.minAge != null ? String(data.minAge) : '');
          setMaxAge(data.maxAge != null ? String(data.maxAge) : '');
          setSize(data.size ?? '');
          setRegion(data.region ?? '');
        }
      })
      .catch(() => {
        setSpecies('');
        setMinAge('');
        setMaxAge('');
        setSize('');
        setRegion('');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const payload: PreferenceRequest = {};
      if (species === 'DOG' || species === 'CAT') payload.species = species;
      const min = minAge.trim() ? parseInt(minAge, 10) : undefined;
      const max = maxAge.trim() ? parseInt(maxAge, 10) : undefined;
      if (min != null && !Number.isNaN(min)) payload.minAge = min;
      if (max != null && !Number.isNaN(max)) payload.maxAge = max;
      if (size === 'SMALL' || size === 'MEDIUM' || size === 'LARGE') payload.size = size;
      if (region && region.trim()) payload.region = region.trim();
      await preferenceApi.update(payload);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '선호도 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--toss-gray-500)]">로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--toss-gray-100)]">
      <Header />
      <main className="flex-1 toss-section">
        <div className="toss-section-inner" style={{ maxWidth: '28rem' }}>
          <div className="toss-auth-head">
            <h1 className="toss-auth-title">선호도 설정</h1>
            <p className="toss-auth-desc">
              입양 시 맞춤 추천을 위해 선호하는 조건을 선택해 주세요. (선택 사항)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="toss-auth-card">
            {error && <div className="toss-auth-error">{error}</div>}
            {success && (
              <div
                className="toss-auth-error"
                style={{
                  backgroundColor: 'var(--toss-blue-light)',
                  borderColor: 'var(--toss-blue)',
                  color: 'var(--toss-blue-dark)',
                }}
              >
                저장되었습니다.
              </div>
            )}

            <div className="toss-auth-field">
              <label htmlFor="pref-species" className="toss-auth-label">
                종류
              </label>
              <select
                id="pref-species"
                className="toss-auth-input"
                value={species ?? ''}
                onChange={(e) => setSpecies(e.target.value)}
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toss-auth-field">
              <label htmlFor="pref-min-age" className="toss-auth-label">
                나이 (세) <span className="toss-auth-label-optional">최소</span>
              </label>
              <input
                id="pref-min-age"
                type="number"
                min={0}
                max={30}
                className="toss-auth-input"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="toss-auth-field">
              <label htmlFor="pref-max-age" className="toss-auth-label">
                나이 (세) <span className="toss-auth-label-optional">최대</span>
              </label>
              <input
                id="pref-max-age"
                type="number"
                min={0}
                max={30}
                className="toss-auth-input"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="toss-auth-field">
              <label htmlFor="pref-size" className="toss-auth-label">
                크기
              </label>
              <select
                id="pref-size"
                className="toss-auth-input"
                value={size ?? ''}
                onChange={(e) => setSize(e.target.value)}
              >
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toss-auth-field">
              <label htmlFor="pref-region" className="toss-auth-label">
                지역 (시·도)
              </label>
              <select
                id="pref-region"
                className="toss-auth-input"
                value={region ?? ''}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGION_SIDO_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.value === '' ? '상관없음' : opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving} className="toss-auth-submit">
              {saving ? '저장 중...' : '저장'}
            </button>

            <p className="toss-auth-foot">
              <Link to="/mypage" className="toss-auth-link">
                ← 마이페이지로 돌아가기
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
