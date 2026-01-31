import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { animalApi, preferenceApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { Animal } from '@/types/entities';
import type { PreferenceRequest } from '@/types/dto';
import ListSearch from '@/components/list/ListSearch';
import Pagination from '@/components/list/Pagination';
import FilterBar from '@/components/list/FilterBar';
import PreferenceModal from '@/components/animals/PreferenceModal';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { REGION_SIDO_OPTIONS, SIGUNGU_BY_SIDO } from '@/constants/regions';

const speciesLabels: Record<string, string> = {
  DOG: '강아지',
  CAT: '고양이',
};

const sizeLabels: Record<string, string> = {
  SMALL: '소형',
  MEDIUM: '중형',
  LARGE: '대형',
};

const genderLabels: Record<string, string> = {
  MALE: '수컷',
  FEMALE: '암컷',
};

const PAGE_SIZE_OPTIONS = [8, 12, 20];

type ViewMode = 'all' | 'recommended';

export default function AnimalsPage() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<'DOG' | 'CAT' | ''>('');
  const [size, setSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE' | ''>('');
  const [status, setStatus] = useState<'PROTECTED' | 'FOSTERING' | ''>('');
  const [region, setRegion] = useState<string>('');
  const [sigungu, setSigungu] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [preference, setPreference] = useState<PreferenceRequest | null>(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [apiAnimals, setApiAnimals] = useState<Animal[]>([]);
  const [apiTotalElements, setApiTotalElements] = useState(0);

  const totalPages = Math.ceil(apiTotalElements / pageSize) || 1;

  // 로그인 시 저장된 선호도 로드 (나를 위한 추천 탭에 반영)
  useEffect(() => {
    if (!isAuthenticated) {
      setPreference(null);
      return;
    }
    preferenceApi
      .getMy()
      .then((data) => {
        if (data)
          setPreference({
            species: data.species ?? undefined,
            minAge: data.minAge ?? undefined,
            maxAge: data.maxAge ?? undefined,
            size: data.size ?? undefined,
          });
        else setPreference(null);
      })
      .catch(() => setPreference(null));
  }, [isAuthenticated]);

  // API 모드: 전체 목록 또는 선호도 기반 추천 목록
  useEffect(() => {
    if (viewMode === 'recommended' && !isAuthenticated) {
      setApiAnimals([]);
      setApiTotalElements(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        if (viewMode === 'recommended') {
          const data = await preferenceApi.getRecommendedAnimals(page, pageSize) as { content?: Animal[]; totalElements?: number } | null;
          setApiAnimals(data?.content ?? []);
          setApiTotalElements(data?.totalElements ?? 0);
        } else {
          const data = await animalApi.getAll({
            page,
            sizeParam: pageSize,
            species: species || undefined,
            size: size || undefined,
            status: status || undefined,
            region: region || undefined,
            sigungu: sigungu || undefined,
            sort: 'random',
          });
          const content = data?.content ?? [];
          const total = data?.totalElements ?? content.length;
          setApiAnimals(content);
          setApiTotalElements(total);
        }
      } catch (err) {
        setError(
          viewMode === 'recommended'
            ? '추천 목록을 불러오는데 실패했습니다. 로그인 후 선호도를 설정해 주세요.'
            : '동물 목록을 불러오는데 실패했습니다.'
        );
        setApiAnimals([]);
        setApiTotalElements(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewMode, page, pageSize, species, size, status, region, sigungu, isAuthenticated]);

  const animals = apiAnimals;

  // 검색어가 있으면 현재 페이지 결과에서 클라이언트 필터링
  const filteredAnimals = useMemo(() => {
    if (!search.trim()) return animals;
    const q = search.trim().toLowerCase();
    return animals.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.breed && a.breed.toLowerCase().includes(q)) ||
        (a.shelterName && a.shelterName.toLowerCase().includes(q))
    );
  }, [animals, search]);

  const handleSavePreference = async (pref: PreferenceRequest) => {
    try {
      await preferenceApi.update(pref);
      setPreference(pref);
      setViewMode('recommended');
      setShowPreferenceModal(false);
      setPage(0);
    } catch {
      alert('선호도 저장에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner">
            <div className="text-center mb-8">
              <h1 className="landing-section-title landing-section-title--center">
                입양 가능한 아이들
              </h1>
              <p className="landing-section-desc landing-section-desc--center">
                새로운 가족을 기다리는 아이들입니다.
              </p>
            </div>

            {/* 뷰 모드 탭 (전체 / 나를 위한 추천) */}
            <div className="flex justify-center gap-2 mb-6">
              <button
                type="button"
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  viewMode === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600'
                }`}
                onClick={() => setViewMode('all')}
              >
                전체
              </button>
              <button
                type="button"
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  viewMode === 'recommended'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600'
                }`}
                onClick={() => {
                  if (!preference) {
                    setShowPreferenceModal(true);
                  } else {
                    setViewMode('recommended');
                    setPage(0);
                  }
                }}
              >
                나를 위한 추천 {preference && '✓'}
              </button>
              {viewMode === 'recommended' && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-gray-400 text-sm"
                  onClick={() => setShowPreferenceModal(true)}
                >
                  설정 변경
                </button>
              )}
            </div>

            <div className="list-toolbar mb-8">
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder="이름, 품종, 보호소로 검색"
              />
              {viewMode === 'all' && (
                <FilterBar
                  groups={[
                    {
                      label: '종류',
                      options: [
                        { value: '', label: '전체' },
                        { value: 'DOG', label: speciesLabels.DOG },
                        { value: 'CAT', label: speciesLabels.CAT },
                      ],
                      value: species,
                      onChange: (v) => {
                        setSpecies(v as 'DOG' | 'CAT' | '');
                        setPage(0);
                      },
                    },
                    {
                      label: '크기',
                      options: [
                        { value: '', label: '전체' },
                        { value: 'SMALL', label: sizeLabels.SMALL },
                        { value: 'MEDIUM', label: sizeLabels.MEDIUM },
                        { value: 'LARGE', label: sizeLabels.LARGE },
                      ],
                      value: size,
                      onChange: (v) => {
                        setSize(v as 'SMALL' | 'MEDIUM' | 'LARGE' | '');
                        setPage(0);
                      },
                    },
                    {
                      label: '상태',
                      options: [
                        { value: '', label: '전체' },
                        { value: 'PROTECTED', label: '보호 중' },
                        { value: 'FOSTERING', label: '임시보호' },
                      ],
                      value: status,
                      onChange: (v) => {
                        setStatus(v as 'PROTECTED' | 'FOSTERING' | '');
                        setPage(0);
                      },
                    },
                    {
                      label: '시/도',
                      options: REGION_SIDO_OPTIONS,
                      value: region,
                      onChange: (v) => {
                        setRegion(v);
                        setSigungu('');
                        setPage(0);
                      },
                    },
                    // 시/도 선택 시 우측에 시/군/구 드롭다운 표시
                    ...(region
                      ? [
                          {
                            label: '시/군/구',
                            options: SIGUNGU_BY_SIDO[region] ?? [{ value: '', label: '전체' }],
                            value: sigungu,
                            onChange: (v: string) => {
                              setSigungu(v);
                              setPage(0);
                            },
                          },
                        ]
                      : []),
                  ]}
                  onReset={() => {
                    setSpecies('');
                    setSize('');
                    setStatus('');
                    setRegion('');
                    setSigungu('');
                    setPage(0);
                  }}
                />
              )}
            </div>

            {/* 추천 모드 안내 */}
            {viewMode === 'recommended' && preference && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 max-w-3xl mx-auto">
                <p className="text-green-800 text-sm font-medium">
                  <span className="font-bold">선호도 기준:</span>{' '}
                  {preference.species ? speciesLabels[preference.species] : '종류 무관'} ·{' '}
                  {preference.minAge !== undefined || preference.maxAge !== undefined
                    ? `${preference.minAge ?? 0}~${preference.maxAge ?? '제한없음'}세`
                    : '나이 무관'} ·{' '}
                  {preference.size ? sizeLabels[preference.size] : '크기 무관'}
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {!error && (
              <>
                {loading ? (
                  <div className="text-center py-20">
                    <p className="text-gray-600">로딩 중...</p>
                  </div>
                ) : filteredAnimals.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl">
                    <p className="text-gray-600">조건에 맞는 아이가 없습니다.</p>
                    <button
                      type="button"
                      className="mt-3 text-green-600 font-medium hover:underline"
                      onClick={() => {
                        setSearch('');
                        setSpecies('');
                        setSize('');
                        setStatus('');
                        setRegion('');
                        setSigungu('');
                        setPage(0);
                      }}
                    >
                      필터 초기화
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="landing-pet-grid">
                      {filteredAnimals.map((animal) => (
                        <Link
                          key={animal.id}
                          to={`/animals/${animal.id}`}
                          className="landing-pet-card"
                        >
                          <div
                            className="landing-pet-card-img"
                            style={{
                              backgroundImage: animal.imageUrl ? `url(${animal.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                          <div className="landing-pet-card-body">
                            <p className="landing-pet-card-name">{animal.name}</p>
                            <p className="landing-pet-card-meta">
                              {speciesLabels[animal.species] ?? ''} · {animal.age != null ? `${animal.age}세` : '나이미상'} · {sizeLabels[animal.size] ?? '크기미상'} · {genderLabels[animal.gender] ?? '성별미상'}
                            </p>
                            <p className="landing-pet-card-story">
                              {animal.breed ?? '품종미상'} · {animal.neutered ? '중성화 완료' : '미중성화'}
                            </p>
                            {animal.shelterName && (
                              <p className="text-xs text-gray-500 mt-1">{animal.shelterName}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      totalElements={apiTotalElements}
                      size={pageSize}
                      onPageChange={setPage}
                      onSizeChange={(s) => {
                        setPageSize(s);
                        setPage(0);
                      }}
                      sizeOptions={PAGE_SIZE_OPTIONS}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* 선호도 설정 모달: body에 포탈로 렌더링해 푸터 밑이 아닌 화면 위 오버레이로 표시 */}
      {showPreferenceModal &&
        createPortal(
          <PreferenceModal
            currentPreference={preference || undefined}
            onSave={handleSavePreference}
            onClose={() => setShowPreferenceModal(false)}
          />,
          document.body
        )}
    </div>
  );
}
