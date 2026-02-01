import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuideCallBlock from '@/components/guide/GuideCallBlock';
import { animalApi } from '@/api';
import type { Animal } from '@/types/entities';

const ADOPTION_STEPS = [
  {
    step: 1,
    title: '입양 전 필수 교육 완료',
    desc: '동물사랑배움터에서 제공하는 반려견 입양 전 교육을 반드시 이수하세요. 온라인으로 진행되며, 입양 전 준비사항, 반려견의 특성 이해, 건강관리 방법 등을 다룹니다.',
    linkLabel: '동물사랑배움터',
    linkUrl: 'https://apms.epis.or.kr',
  },
  {
    step: 2,
    title: '입양 대기 동물 확인',
    desc: '국가동물보호정보시스템에 접속하거나 각 지역 동물보호센터를 방문하여 입양 가능한 강아지를 확인하세요. 유실·유기동물은 보호소 입소 후 10일간의 공고 기간을 거친 후 분양 가능합니다.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 3,
    title: '입양상담 예약',
    desc: '선택한 강아지가 있는 보호센터에 사전 전화 예약을 통해 방문 일정을 잡으세요. 유선 예약이 필수이며, 센터마다 다른 운영 시간과 상담자를 배정받습니다. 서울 예: 마포 02-2124-2839, 구로 02-2636-7650·7649, 동대문 02-921-2415.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 4,
    title: '입양상담 및 동물 만남',
    desc: '입양 심사는 1~2회 이상의 면접과 만남을 통해 진행됩니다. 상담 시 신분증 2장 사본을 지참하고, 이동장, 안전문, 리드줄, 사료 등 기본 물품 준비 여부를 확인받습니다. 입양 후 파양(반환)은 불가능하므로 신중한 결정이 필요합니다.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 5,
    title: '입양 계약 및 확정',
    desc: '모든 상담이 완료되면 입양계약서를 작성합니다. 입양신청서, 입양 전 교육 수료증, 신분증 사본 2장, 통장 사본(입양비 지원 신청 시)을 준비하세요. 입양이 확정되면 센터에서 전화로 공식 안내합니다.',
    linkLabel: null,
    linkUrl: null,
  },
  {
    step: 6,
    title: '입양 후 관리',
    desc: '보호센터에서는 입양 전 중성화 수술과 동물등록을 완료한 상태로 반려견을 인도합니다. 입양 후 동물의 건강관리와 입양 후기 공유에 협조하세요.',
    linkLabel: null,
    linkUrl: null,
  },
];

export default function GuideAdoptionPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">입양 절차 안내</h1>
          <p className="text-gray-600 mb-6">
            강아지·고양이 입양은 동물보호법에 따라 체계적으로 운영됩니다. 아래 단계별로 진행하세요.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-900 font-semibold">
              실제 신청·예약은 보호소에 전화로 진행합니다.
            </p>
            <p className="text-amber-800 text-sm mt-1">
              상담 예약·운영 시간·지원금 등은 지자체·보호센터마다 다를 수 있으므로, 반드시 해당 지역 동물보호센터 또는 지자체에 전화로 확인하세요.
            </p>
          </div>

          {animalLoading && (
            <p className="text-sm text-gray-500 mb-6">해당 아이 정보 불러오는 중...</p>
          )}
          {!animalLoading && animal && (
            <div className="mb-8">
              <GuideCallBlock animal={animal} type="adoption" variant="green" />
            </div>
          )}

          <ol className="space-y-6">
            {ADOPTION_STEPS.map(({ step, title, desc, linkLabel, linkUrl }) => (
              <li key={step} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-sm mb-3">
                  {step}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{desc}</p>
                {linkLabel && linkUrl && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">고양이 입양 (보호소 유기묘)</h3>
            <p className="text-gray-600 text-sm">
              정보 확인 → 보호소에 전화로 입양 의사 전달 → 서류 준비 → 방문·상담 → 동물 만남 → 입양 확정. 동물보호관리시스템·지역 보호센터에서 입양 가능한 고양이를 조회할 수 있습니다.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <Link to="/animals" className="text-green-600 font-medium hover:underline text-sm">
              입양 가능한 아이 보기 →
            </Link>
            <Link to="/guide/foster" className="text-gray-600 font-medium hover:underline text-sm">
              임보 절차 안내
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
