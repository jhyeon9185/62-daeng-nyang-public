/**
 * 절차 안내 페이지용 "입양상담 예약" / "임보 신청 전화하기" 블록
 * 해당 동물의 유기번호, 담당 전화번호, 전화 문의 시 참고사항을 표시
 */

import type { Animal } from '@/types/entities';

type CallBlockType = 'adoption' | 'foster';

const titles: Record<CallBlockType, string> = {
  adoption: '입양상담 예약',
  foster: '임보 신청 전화하기',
};

interface GuideCallBlockProps {
  animal: Animal;
  type: CallBlockType;
  /** 블록 스타일 (입양=녹색, 임보=파란색) */
  variant?: 'green' | 'blue';
}

export default function GuideCallBlock({ animal, type, variant = type === 'adoption' ? 'green' : 'blue' }: GuideCallBlockProps) {
  const phone = animal.chargePhone || animal.shelterPhone;
  const hasPhone = !!phone;

  const borderClass = variant === 'green' ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50';
  const linkClass = variant === 'green' ? 'text-green-600 hover:underline' : 'text-blue-600 hover:underline';

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${borderClass}`}>
      <h3 className={`text-lg font-semibold mb-4 ${variant === 'green' ? 'text-green-900' : 'text-blue-900'}`}>
        {titles[type]} — {animal.name}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        아래 연락처로 전화하시면 이 아이에 대한 상담·예약을 안내해 드립니다.
      </p>

      {animal.shelterName && (
        <p className="text-sm font-medium text-gray-800 mb-2">
          보호소 {animal.shelterName}
        </p>
      )}

      {hasPhone && (
        <p className="text-sm text-gray-700 mb-4">
          📞{' '}
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className={`font-semibold ${linkClass}`}
          >
            {phone}
          </a>
          {animal.chargePhone && animal.shelterPhone ? ' (담당자 / 보호소)' : ''}
        </p>
      )}

      <div className="mt-4 p-3 bg-white/80 rounded-lg border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">전화 문의 시 참고</p>
        {animal.publicApiAnimalId ? (
          <>
            <p className="text-sm text-gray-700 mb-2">
              보호소에서 식별할 수 있도록 <strong>유기번호</strong>를 말씀해 주세요.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                유기번호 {animal.publicApiAnimalId}
              </span>
              <button
                type="button"
                onClick={() => {
                  const phrase = `62댕냥 사이트 보고 연락드렸는데, 유기번호 ${animal.publicApiAnimalId} 해당 동물에 대해 문의드려도 될까요?`;
                  navigator.clipboard.writeText(phrase).then(() => alert('예시 문구가 복사되었습니다.'));
                }}
                className={`text-sm font-medium ${linkClass}`}
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
    </div>
  );
}
