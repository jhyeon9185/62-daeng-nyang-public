import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { DonationRequest as DonationRequestEntity } from '@/types/entities';
import type { DonationApplyRequest } from '@/types/dto';
import { mockDonationRequests } from '@/data/mockDonations';
import ListSearch from '@/components/list/ListSearch';
import Pagination from '@/components/list/Pagination';
import FilterBar from '@/components/list/FilterBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const statusLabels: Record<string, string> = {
  OPEN: '모집 중',
  CLOSED: '마감',
  COMPLETED: '완료',
};

const PAGE_SIZE_OPTIONS = [6, 10, 15];

export default function DonationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequestEntity | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DonationApplyRequest>({
    requestId: 0,
    itemName: '',
    quantity: 1,
    deliveryMethod: 'DELIVERY',
    trackingNumber: '',
  });

  const [apiList, setApiList] = useState<DonationRequestEntity[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const res = await donationApi.getAllRequests(0, 100);
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
    return [...real, ...mockDonationRequests];
  }, [apiList]);

  const filteredList = useMemo(() => {
    return rawList.filter((req) => {
      if (statusFilter && req.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          req.title.toLowerCase().includes(q) ||
          req.itemCategory.toLowerCase().includes(q) ||
          (req.shelterName && req.shelterName.toLowerCase().includes(q));
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

  const [detailRequest, setDetailRequest] = useState<DonationRequestEntity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const openDetail = (request: DonationRequestEntity) => {
    setDetailRequest(request);
    setShowDetailModal(true);
  };

  const handleDonate = (request: DonationRequestEntity) => {
    if (!isAuthenticated) {
      if (window.confirm('기부 신청은 로그인 후 가능합니다. 로그인 페이지로 이동할까요?')) {
        navigate('/login', { state: { from: '/donations', message: '기부 신청을 위해 로그인해 주세요.' } });
      }
      return;
    }
    setSelectedRequest(request);
    setFormData({
      requestId: request.id,
      itemName: '',
      quantity: 1,
      deliveryMethod: 'DELIVERY',
      trackingNumber: '',
    });
    setShowDetailModal(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || formData.quantity <= 0) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      await donationApi.donate(formData);
      alert('기부 신청이 완료되었습니다!');
      setShowModal(false);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401 || status === 403) {
        const goLogin = window.confirm('로그인이 필요합니다. 로그인 페이지로 이동할까요?');
        if (goLogin) navigate('/login', { state: { from: '/donations' } });
      } else {
        alert(message || '기부 신청에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = (req: DonationRequestEntity) => {
    return Math.min(100, (req.currentQuantity / req.targetQuantity) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner">
            <div className="text-center mb-10">
              <h1 className="landing-section-title landing-section-title--center">물품 기부</h1>
              <p className="landing-section-desc landing-section-desc--center">
                보호소에서 필요한 물품을 기부해주세요.
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
                    placeholder="제목, 물품, 보호소로 검색"
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
                <p className="text-gray-600">조건에 맞는 기부 요청이 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="list-card-list">
                  {paginatedList.map((req, index) => (
                    <div
                      key={`donation-req-${req.id}-${page * pageSize + index}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetail(req)}
                      onKeyDown={(e) => e.key === 'Enter' && openDetail(req)}
                      className="list-card"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h3 className="list-card-title flex-1">{req.title}</h3>
                        <span
                          className={`list-card-badge shrink-0 ${
                            req.status === 'OPEN'
                              ? 'bg-yellow-100 text-yellow-700'
                              : req.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabels[req.status]}
                        </span>
                      </div>
                      <div className="list-card-meta">
                        <span>📍 {req.shelterName || '보호소'}</span>
                        <span>물품: {req.itemCategory}</span>
                        <span>{req.currentQuantity}/{req.targetQuantity}</span>
                        <span>📅 마감: {new Date(req.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="mb-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent(req)}%` }}
                        />
                      </div>
                      <p className="list-card-summary">{req.content.replace(/\n/g, ' ')}</p>
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
                  sizeOptions={PAGE_SIZE_OPTIONS}
                />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* 기부 상세 모달: 카드 클릭 시 전체 내용 + 기부하기 */}
      {showDetailModal && detailRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{detailRequest.title}</h2>
              <span
                className={`list-card-badge shrink-0 ${
                  detailRequest.status === 'OPEN'
                    ? 'bg-yellow-100 text-yellow-700'
                    : detailRequest.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusLabels[detailRequest.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
              <span>📍 {detailRequest.shelterName || '보호소'}</span>
              <span>물품: {detailRequest.itemCategory}</span>
              <span>📅 마감: {new Date(detailRequest.deadline).toLocaleDateString()}</span>
            </div>
            <div className="mb-4 bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span>목표 수량</span>
                <span className="font-semibold">{detailRequest.currentQuantity} / {detailRequest.targetQuantity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPercent(detailRequest)}%` }}
                />
              </div>
            </div>
            <div className="prose prose-gray max-w-none mb-6">
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{detailRequest.content}</p>
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
                onClick={() => handleDonate(detailRequest)}
                disabled={detailRequest.status !== 'OPEN'}
                className="flex-1 landing-btn landing-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                기부하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">기부 신청</h2>
            <p className="text-gray-600 mb-6">{selectedRequest.title}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">기부할 물품명 *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="예: 사료, 간식, 담요 등"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">수량 *</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">배송 방법 *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                  required
                >
                  <option value="DELIVERY">택배</option>
                  <option value="VISIT">방문</option>
                </select>
              </div>
              {formData.deliveryMethod === 'DELIVERY' && (
                <div>
                  <label className="block font-semibold mb-1">운송장 번호 (선택)</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="발송 후 입력 가능"
                  />
                </div>
              )}
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
