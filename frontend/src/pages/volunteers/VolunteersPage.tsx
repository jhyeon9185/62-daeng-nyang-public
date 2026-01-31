import { useEffect, useMemo, useState } from 'react';
import { volunteerApi } from '@/api';
import type { VolunteerRecruitment } from '@/types/entities';
import type { VolunteerApplyRequest } from '@/types/dto';
import { mockVolunteerRecruitments } from '@/data/mockVolunteers';
import ListSearch from '@/components/list/ListSearch';
import Pagination from '@/components/list/Pagination';
import FilterBar from '@/components/list/FilterBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const statusLabels: Record<string, string> = {
  OPEN: '모집 중',
  RECRUITING: '모집 중',
  CLOSED: '마감',
  COMPLETED: '완료',
};

const PAGE_SIZE = 6;

export default function VolunteersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selectedRecruitment, setSelectedRecruitment] = useState<VolunteerRecruitment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<VolunteerApplyRequest>({
    recruitmentId: 0,
    applicantName: '',
    activityRegion: '',
    activityField: '',
    startDate: '',
    endDate: '',
    participantCount: 1,
    message: '',
  });

  const [apiList, setApiList] = useState<VolunteerRecruitment[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const res = await volunteerApi.getAllRecruitments(0, 100);
        if (!cancelled && res?.content) setApiList(res.content);
      } catch {
        if (!cancelled) setApiList([]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rawList = useMemo(() => {
    const real = [...apiList].sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return [...real, ...mockVolunteerRecruitments];
  }, [apiList]);

  const filteredList = useMemo(() => {
    return rawList.filter((rec) => {
      const status = rec.status === 'RECRUITING' ? 'OPEN' : rec.status;
      if (statusFilter && status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          rec.title.toLowerCase().includes(q) ||
          (rec.shelterName && rec.shelterName.toLowerCase().includes(q)) ||
          rec.content.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rawList, statusFilter, search]);

  const paginatedList = useMemo(() => {
    const start = page * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;

  const [detailRecruitment, setDetailRecruitment] = useState<VolunteerRecruitment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const openDetail = (recruitment: VolunteerRecruitment) => {
    setDetailRecruitment(recruitment);
    setShowDetailModal(true);
  };

  const handleApply = (recruitment: VolunteerRecruitment) => {
    setSelectedRecruitment(recruitment);
    setFormData({
      recruitmentId: recruitment.id,
      applicantName: '',
      activityRegion: '',
      activityField: '',
      startDate: '',
      endDate: '',
      participantCount: 1,
      message: '',
    });
    setShowDetailModal(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.activityRegion || !formData.activityField || !formData.startDate || !formData.endDate) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    const count = formData.participantCount ?? 1;
    if (count < 1) {
      alert('신청 인원은 1명 이상이어야 합니다.');
      return;
    }
    try {
      setSubmitting(true);
      await volunteerApi.apply(formData);
      alert('봉사 신청이 완료되었습니다!');
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '봉사 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner">
            <div className="text-center mb-10">
              <h1 className="landing-section-title landing-section-title--center">봉사 모집</h1>
              <p className="landing-section-desc landing-section-desc--center">
                보호소에서 함께할 봉사자를 기다립니다.
              </p>
            </div>

            <div className="list-toolbar mb-8">
              {listLoading && <p className="w-full text-center text-sm text-gray-500">목록 불러오는 중...</p>}
              {!listLoading && (
                <>
                  <ListSearch
                    value={search}
                    onChange={(v) => {
                      setSearch(v);
                      setPage(0);
                    }}
                    placeholder="제목, 보호소명으로 검색"
                  />
                  <FilterBar
                    groups={[
                      {
                        label: '상태',
                        options: [
                          { value: '', label: '전체' },
                          { value: 'OPEN', label: '모집 중' },
                          { value: 'CLOSED', label: '마감' },
                          { value: 'COMPLETED', label: '완료' },
                        ],
                        value: statusFilter,
                        onChange: (v) => {
                          setStatusFilter(v);
                          setPage(0);
                        },
                      },
                    ]}
                    onReset={statusFilter ? () => { setStatusFilter(''); setPage(0); } : undefined}
                  />
                </>
              )}
            </div>

            {paginatedList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <p className="text-gray-600">조건에 맞는 모집공고가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="list-card-list">
                  {paginatedList.map((rec) => (
                    <div
                      key={rec.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetail(rec)}
                      onKeyDown={(e) => e.key === 'Enter' && openDetail(rec)}
                      className="list-card"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h3 className="list-card-title flex-1">{rec.title}</h3>
                        <span
                          className={`list-card-badge shrink-0 ${
                            (rec.status === 'OPEN' || rec.status === 'RECRUITING') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabels[rec.status]}
                        </span>
                      </div>
                      <div className="list-card-meta">
                        <span>📍 {rec.shelterName || '보호소'}</span>
                        <span>👥 {rec.currentApplicants ?? 0}/{rec.maxApplicants}명</span>
                        <span>📅 마감: {new Date(rec.deadline).toLocaleDateString()}</span>
                      </div>
                      <p className="list-card-summary">{rec.content.replace(/\n/g, ' ')}</p>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={filteredList.length}
                  size={pageSize}
                  onPageChange={setPage}
                  onSizeChange={(s) => {
                    setPageSize(s);
                    setPage(0);
                  }}
                  sizeOptions={[6, 10, 15]}
                />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* 봉사 상세 모달: 카드 클릭 시 전체 내용 + 신청하기 */}
      {showDetailModal && detailRecruitment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{detailRecruitment.title}</h2>
              <span
                className={`list-card-badge shrink-0 ${
                  (detailRecruitment.status === 'OPEN' || detailRecruitment.status === 'RECRUITING') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusLabels[detailRecruitment.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-6 pb-4 border-b border-gray-100">
              <span>📍 {detailRecruitment.shelterName || '보호소'}</span>
              <span>👥 {detailRecruitment.currentApplicants ?? 0}/{detailRecruitment.maxApplicants}명</span>
              <span>📅 마감: {new Date(detailRecruitment.deadline).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-gray max-w-none mb-6">
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{detailRecruitment.content}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleApply(detailRecruitment)}
                disabled={detailRecruitment.status !== 'OPEN' && detailRecruitment.status !== 'RECRUITING'}
                className="flex-1 landing-btn landing-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedRecruitment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">봉사 신청</h2>
            <p className="text-gray-600 mb-6">{selectedRecruitment.title}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">신청자 이름 *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">신청 인원 *</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.participantCount ?? 1}
                  onChange={(e) => setFormData({ ...formData, participantCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
                <p className="text-sm text-gray-500 mt-0.5">함께 봉사할 인원 수 (본인 포함)</p>
              </div>
              <div>
                <label className="block font-semibold mb-1">활동 지역 *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.activityRegion}
                  onChange={(e) => setFormData({ ...formData, activityRegion: e.target.value })}
                  placeholder="예: 서울 강남구, 경기 수원시"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">활동 분야 *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.activityField}
                  onChange={(e) => setFormData({ ...formData, activityField: e.target.value })}
                  placeholder="예: 산책, 청소, 급식 등"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">희망 시작일 *</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">희망 종료일 *</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">신청 내용</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 min-h-[100px]"
                  value={formData.message ?? ''}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="하고 싶은 말, 참여 동기, 특이사항 등을 자유롭게 적어주세요."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" disabled={submitting} className="flex-1 landing-btn landing-btn-primary disabled:opacity-50">
                  {submitting ? '신청 중...' : '신청하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
