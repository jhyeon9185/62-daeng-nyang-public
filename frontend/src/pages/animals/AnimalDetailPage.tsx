import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { animalApi, favoriteApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { Animal } from '@/types/entities';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KakaoMap from '@/components/map/KakaoMap';
import FavoriteButton from '@/components/animals/FavoriteButton';

const speciesLabels: Record<string, string> = { DOG: '강아지', CAT: '고양이' };
const sizeLabels: Record<string, string> = { SMALL: '소형', MEDIUM: '중형', LARGE: '대형' };
const genderLabels: Record<string, string> = { MALE: '수컷', FEMALE: '암컷' };
const statusLabels: Record<string, string> = { PROTECTED: '보호 중', ADOPTED: '입양 완료', FOSTERING: '임시보호 중' };

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      loadAnimal();
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      favoriteApi.getMyFavoriteIds().then(setFavoriteIds).catch(() => setFavoriteIds([]));
    } else {
      setFavoriteIds([]);
    }
  }, [isAuthenticated]);

  const loadAnimal = async () => {
    try {
      setLoading(true);
      const data = await animalApi.getById(Number(id));
      setAnimal(data);
    } catch (err) {
      console.error(err);
      alert('동물 정보를 불러오는데 실패했습니다.');
      navigate('/animals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!animal) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner max-w-4xl">
            <Link to="/animals" className="text-green-600 hover:underline mb-4 inline-block">
              ← 목록으로
            </Link>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6">
                <div
                  className="aspect-square bg-gray-200 flex items-center justify-center"
                  style={{
                    backgroundImage: animal.imageUrl ? `url(${animal.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!animal.imageUrl && (
                    <div className="text-center text-gray-400">
                      <svg className="w-24 h-24 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                      <p>사진 준비중</p>
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col relative">
                  <div className="absolute top-8 right-8">
                    <FavoriteButton
                      animalId={animal.id}
                      isFavorited={favoriteIds.includes(animal.id)}
                      onToggle={(added) => {
                        setFavoriteIds((prev) =>
                          added ? [...prev, animal.id] : prev.filter((i) => i !== animal.id)
                        );
                      }}
                      size="lg"
                    />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{animal.name}</h1>
                  <p className="text-gray-600 mb-4">{animal.shelterName}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6 text-sm">
                    <p><strong>종류</strong> {speciesLabels[animal.species]}</p>
                    <p><strong>품종</strong> {animal.breed ?? '미상'}</p>
                    <p><strong>나이</strong> {animal.age != null ? `${animal.age}세` : '미상'}</p>
                    <p><strong>성별</strong> {genderLabels[animal.gender] ?? '미상'}</p>
                    <p><strong>크기</strong> {sizeLabels[animal.size] ?? '미상'}</p>
                    <p><strong>중성화</strong> {animal.neutered ? '완료' : '미완료'}</p>
                    <p className="sm:col-span-2"><strong>상태</strong>{' '}
                      <span className={animal.status === 'ADOPTED' ? 'text-gray-500' : 'text-green-600'}>{statusLabels[animal.status]}</span>
                    </p>
                  </div>
                  {animal.description && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-2 text-gray-800">소개</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{animal.description}</p>
                    </div>
                  )}
                  <p className="text-sm text-amber-800 font-medium mb-3 mt-4">
                    신청·예약은 전화로 진행됩니다. 아래 보호소/담당자 연락처로 문의하세요.
                  </p>
                  {(animal.chargePhone || animal.shelterPhone) && (
                    <p className="text-sm text-gray-600 mb-3">
                      📞{' '}
                      <a
                        href={`tel:${(animal.chargePhone || animal.shelterPhone || '').replace(/\s/g, '')}`}
                        className="text-green-600 hover:underline font-semibold"
                      >
                        {animal.chargePhone || animal.shelterPhone}
                      </a>
                      {animal.chargePhone && animal.shelterPhone ? ' (담당자 / 보호소)' : ''}
                    </p>
                  )}
                  <div className="flex gap-3 mt-auto pt-2">
                    <Link
                      to={`/guide/adoption?animalId=${animal.id}`}
                      className={`landing-btn landing-btn-primary flex-1 text-center ${animal.status === 'ADOPTED' ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {animal.status === 'ADOPTED' ? '입양 완료' : '입양 절차 안내'}
                    </Link>
                    <Link
                      to={`/guide/foster?animalId=${animal.id}`}
                      className={`landing-btn landing-btn-secondary flex-1 text-center ${animal.status === 'ADOPTED' ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      임보 절차 안내
                    </Link>
                  </div>
                </div>
              </div>

              {/* 보호소 정보 & 지도 */}
              {(animal.shelterName || animal.shelterAddress || animal.shelterPhone || animal.orgName || animal.chargeName || animal.chargePhone) && (
                <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">보호소 정보</h2>
                    <div className="space-y-3">
                      {animal.shelterName && (
                        <p className="font-semibold text-gray-800">{animal.shelterName}</p>
                      )}
                      {animal.orgName && (
                        <p className="text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 shrink-0">🏛️</span>
                          <span><strong>관할기관</strong> {animal.orgName}</span>
                        </p>
                      )}
                      {animal.chargeName && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400 shrink-0">👤</span>
                          <span><strong>담당자</strong> {animal.chargeName}</span>
                        </p>
                      )}
                      {animal.shelterAddress && (
                        <p className="text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 shrink-0">📍</span>
                          <span>{animal.shelterAddress}</span>
                        </p>
                      )}
                      {animal.shelterPhone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400 shrink-0">📞</span>
                          <a
                            href={`tel:${animal.shelterPhone.replace(/\s/g, '')}`}
                            className="text-green-600 hover:underline font-medium"
                          >
                            {animal.shelterPhone}
                          </a>
                          <span className="text-gray-400 text-sm">(보호소 전화)</span>
                        </p>
                      )}
                      {animal.chargePhone && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400 shrink-0">📞</span>
                          <a
                            href={`tel:${animal.chargePhone.replace(/\s/g, '')}`}
                            className="text-green-600 hover:underline font-medium"
                          >
                            {animal.chargePhone}
                          </a>
                          <span className="text-gray-400 text-sm">(담당자 연락처)</span>
                        </p>
                      )}
                      {/* 전화 문의 시 보호소가 동물을 식별할 수 있는 예시 문구 (이름은 우리가 부여한 값이라 보호소에서 모름) */}
                      {animal.shelterPhone && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">전화 문의 시 참고</p>
                          {animal.publicApiAnimalId ? (
                            <>
                              <p className="text-sm text-gray-700 mb-2">
                                보호소에서 식별할 수 있도록 <strong>유기번호</strong>를 말씀해 주세요.
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-800 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                                  유기번호 {animal.publicApiAnimalId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const phrase = `62댕냥 사이트 보고 연락드렸는데, 유기번호 ${animal.publicApiAnimalId} 해당 동물에 대해 문의드려도 될까요?`;
                                    navigator.clipboard.writeText(phrase).then(() => alert('예시 문구가 복사되었습니다.'));
                                  }}
                                  className="text-sm text-green-600 hover:underline font-medium"
                                >
                                  예시 문구 복사
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                예: &quot;62댕냥 사이트 보고 연락드렸는데, 유기번호 {animal.publicApiAnimalId} 해당 동물에 대해 문의드려도 될까요?&quot;
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">
                              전화 시 품종·크기·보호소에서 아시는 특징을 말씀해 주시면 도움이 됩니다.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {(animal.shelterAddress || (animal.shelterLatitude != null && animal.shelterLongitude != null)) && (
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-700">위치</h3>
                        <div className="flex gap-2">
                          {animal.shelterAddress && (
                            <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(animal.shelterAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline font-medium"
                            >
                              카카오맵에서 보기
                            </a>
                          )}
                          {animal.shelterLatitude != null && animal.shelterLongitude != null && animal.shelterName && (
                            <a
                              href={`https://map.kakao.com/link/to/${encodeURIComponent(animal.shelterName)},${animal.shelterLatitude},${animal.shelterLongitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline font-medium"
                            >
                              길찾기
                            </a>
                          )}
                        </div>
                      </div>
                      <KakaoMap
                        address={animal.shelterAddress ?? undefined}
                        latitude={animal.shelterLatitude ?? undefined}
                        longitude={animal.shelterLongitude ?? undefined}
                        height={280}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
