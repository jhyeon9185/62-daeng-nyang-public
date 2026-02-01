import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCallBlock from '@/components/guide/GuideCallBlock';
import { animalApi } from '@/api';
import type { Animal } from '@/types/entities';

const FOSTER_STEPS = [
  {
    step: 1,
    title: '임보 신청서 작성',
    desc: '임보를 희망하는 단체나 개인이 제시하는 신청 양식을 작성합니다. 임보 희망 동물의 이름, 관리 가능한 문제 상황, 임보 가능 기간(최소 2개월 이상), 주거지 형태 등을 기재합니다.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 2,
    title: '가정 환경 점검',
    desc: '임보 전 반드시 확인할 체크리스트: 가족 전원이 임보에 적극 동의, 환경의 안전 위험 요소 제거, 초기 2주간 집중 돌봄 가능성, 주거 규정(반려동물 사육 허용 여부), 응급 상황 시 병원 접근성.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 3,
    title: '계약서 작성',
    desc: '임보자와 구조 단체 간의 책임 범위를 명확히 하는 계약서를 작성합니다. 임보 동물의 기본 정보, 의료 책임 범위, 입양 실패 시 처리 방법, 동물 학대 및 유기 금지, 긴급 연락처 등이 포함됩니다.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 4,
    title: '동물 인수',
    desc: '구조 단체로부터 동물을 인수할 때 기본 건강 상태, 기본 케어용품 제공 여부, 의료 기록 및 예방접종 현황, 응급 시 24시간 연락처를 확인하세요.',
    linkLabel: null,
    linkUrl: null,
  },
];

export default function GuideFosterPage() {
  const [searchParams] = useSearchParams();
  const animalIdParam = searchParams.get('animalId');
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [animalLoading, setAnimalLoading] = useState(false);

  useEffect(() => {
    if (!animalIdParam) {
      setAnimal(null);
      return;
    }
    const id = Number(animalIdParam);
    if (Number.isNaN(id)) {
      setAnimal(null);
      return;
    }
    setAnimalLoading(true);
    animalApi
      .getById(id)
      .then(setAnimal)
      .catch(() => setAnimal(null))
      .finally(() => setAnimalLoading(false));
  }, [animalIdParam]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12 px-4" style={{ paddingTop: '6.5rem' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">임보 절차 안내</h1>
          <p className="text-gray-600 mb-6">
            임시보호(임보)는 입양으로 가는 과정의 중요한 경로이며, 강아지·고양이 모두 가능합니다.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-900 font-semibold">
              실제 신청은 해당 단체/보호소에 전화로 문의하세요.
            </p>
            <p className="text-amber-800 text-sm mt-1">
              임보 비용·지원 내용은 단체마다 다를 수 있으므로, 희망하는 단체에 직접 전화로 확인하세요.
            </p>
          </div>

          {animalLoading && (
            <p className="text-sm text-gray-500 mb-6">해당 아이 정보 불러오는 중...</p>
          )}
          {!animalLoading && animal && (
            <div className="mb-8">
              <GuideCallBlock animal={animal} type="foster" variant="blue" />
            </div>
          )}

          <ol className="space-y-6">
            {FOSTER_STEPS.map(({ step, title, desc, linkLabel, linkUrl }) => (
              <li key={step} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm mb-3">
                  {step}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{desc}</p>
                {linkLabel && linkUrl && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    해당 사이트 바로가기
                    <span className="opacity-90">({linkLabel})</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-8 flex gap-3">
            <Link to="/guide/adoption" className="text-blue-600 font-medium hover:underline text-sm">
              입양 절차 안내
            </Link>
            <Link to="/animals" className="text-gray-600 font-medium hover:underline text-sm">
              입양 가능한 아이 보기 →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
