/**
 * 입양 선호도 설정 모달
 * 종류, 나이 범위, 크기, 지역(시·도 복수)을 설정해 맞춤 추천 받기
 */
import { useState } from 'react';
import type { PreferenceRequest } from '@/types/dto';
import { REGION_SIDO_OPTIONS } from '@/constants/regions';

/** 시·도 옵션 중 값이 있는 것만 (전체 제외) */
const REGION_OPTIONS = REGION_SIDO_OPTIONS.filter((o) => o.value !== '');

interface PreferenceModalProps {
  currentPreference?: PreferenceRequest;
  onSave: (pref: PreferenceRequest) => void;
  onClose: () => void;
}

const speciesOptions = [
  { value: '', label: '상관없음' },
  { value: 'DOG', label: '강아지' },
  { value: 'CAT', label: '고양이' },
];

const sizeOptions = [
  { value: '', label: '상관없음' },
  { value: 'SMALL', label: '소형' },
  { value: 'MEDIUM', label: '중형' },
  { value: 'LARGE', label: '대형' },
];

export default function PreferenceModal({
  currentPreference,
  onSave,
  onClose,
}: PreferenceModalProps) {
  const [formData, setFormData] = useState<PreferenceRequest>({
    species: currentPreference?.species || undefined,
    minAge: currentPreference?.minAge || undefined,
    maxAge: currentPreference?.maxAge || undefined,
    size: currentPreference?.size || undefined,
    regions: currentPreference?.regions ?? [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 최소/최대 나이 검증
    if (
      formData.minAge !== undefined &&
      formData.maxAge !== undefined &&
      formData.minAge > formData.maxAge
    ) {
      alert('최소 나이가 최대 나이보다 클 수 없습니다.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true" aria-labelledby="preference-modal-title">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 id="preference-modal-title" className="text-2xl font-bold mb-2">선호도 설정</h2>
        <p className="text-gray-600 mb-6 text-sm">
          원하는 조건을 선택하면 맞춤 추천을 받을 수 있어요.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-2 text-sm">선호 동물 종류</label>
            <div className="grid grid-cols-3 gap-2">
              {speciesOptions.map(({ value, label }) => (
                <button
                  key={value || 'none'}
                  type="button"
                  className={`py-2 px-3 border rounded-lg font-medium text-sm transition ${
                    formData.species === (value || undefined)
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, species: value ? (value as any) : undefined })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-sm">선호 나이 (세)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="minAge" className="text-xs text-gray-600 mb-1 block">
                  최소
                </label>
                <input
                  id="minAge"
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.minAge ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minAge: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min="0"
                  max="20"
                  placeholder="예: 0"
                />
              </div>
              <div>
                <label htmlFor="maxAge" className="text-xs text-gray-600 mb-1 block">
                  최대
                </label>
                <input
                  id="maxAge"
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.maxAge ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAge: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min="0"
                  max="20"
                  placeholder="예: 10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">비워두면 나이 제한 없이 추천합니다.</p>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-sm">선호 지역 (시·도, 복수 선택)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {REGION_OPTIONS.map(({ value, label }) => {
                const selected = (formData.regions ?? []).includes(value);
                return (
                  <label
                    key={value}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm ${
                      selected ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = formData.regions ?? [];
                        const next = e.target.checked
                          ? [...current, value]
                          : current.filter((r) => r !== value);
                        setFormData({ ...formData, regions: next.length > 0 ? next : [] });
                      }}
                      className="rounded border-gray-300"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">선택한 지역의 보호소 아이들만 추천합니다. (비우면 전체)</p>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-sm">선호 크기</label>
            <div className="grid grid-cols-4 gap-2">
              {sizeOptions.map(({ value, label }) => (
                <button
                  key={value || 'none'}
                  type="button"
                  className={`py-2 px-3 border rounded-lg font-medium text-sm transition ${
                    formData.size === (value || undefined)
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, size: value ? (value as any) : undefined })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 landing-btn landing-btn-primary"
            >
              저장하고 추천 보기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
