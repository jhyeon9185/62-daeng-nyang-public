import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { BoardResponse } from '@/types/dto';
import type { BoardType } from '@/types/entities';
import { boardApi } from '@/api';
import { mockBoards } from '@/data/mockBoards';
import ListSearch from '@/components/list/ListSearch';
import Pagination from '@/components/list/Pagination';
import FilterBar from '@/components/list/FilterBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const typeLabels: Record<BoardType, string> = {
  NOTICE: '공지사항',
  FAQ: 'FAQ',
  FREE: '자유게시판',
  VOLUNTEER: '봉사 모집',
  DONATION: '물품 후원',
};

const typeColors: Record<BoardType, string> = {
  NOTICE: 'bg-red-100 text-red-700',
  FAQ: 'bg-blue-100 text-blue-700',
  FREE: 'bg-gray-100 text-gray-700',
  VOLUNTEER: 'bg-green-100 text-green-700',
  DONATION: 'bg-purple-100 text-purple-700',
};

/** 게시판 목록 필터에 노출할 타입 (공지/FAQ/자유만, 봉사·물품 후원 제외) */
const BOARD_FILTER_TYPES: BoardType[] = ['NOTICE', 'FAQ', 'FREE'];

const PAGE_SIZE_OPTIONS = [10, 15, 20];

export default function BoardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (searchParams.get('type') as BoardType) || undefined;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // 실제 서버 데이터 상태
  const [serverBoards, setServerBoards] = useState<BoardResponse[]>([]);
  const [serverTotalElements, setServerTotalElements] = useState(0);

  // 서버 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 실제 API 호출 (검색 포함)
        const res = await boardApi.getAll({
          type,
          page,
          size: pageSize,
          keyword: search || undefined, // 검색어 전달
        });
        setServerBoards(res.content);
        setServerTotalElements(res.totalElements);
      } catch (err) {
        console.error('Failed to fetch boards:', err);
      } finally {
        setLoading(false);
      }
    };

    // 검색어 변경 시 디바운싱 처리가 필요할 수 있으나, 여기서는 일단 search 변경 시 바로 호출
    // (실제로는 ListSearch에서 Enter키나 버튼 클릭 시에만 상태를 업데이트하는 것이 좋음, 현재는 onChange에서 바로 업데이트 중)
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // 간단한 디바운싱

    return () => clearTimeout(timer);
  }, [type, page, pageSize, search]);

  // Mock 데이터 필터링 (클라이언트 검색 지원)
  const filteredMocks = useMemo(() => {
    let list = type ? mockBoards.filter((b) => b.type === type) : mockBoards;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.content.toLowerCase().includes(q) ||
          (b.userName && b.userName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [type, search]);

  // 데이터 병합: 실제 데이터(이미 페이징됨) + Mock 데이터(현재 페이지 슬라이스)
  const displayList = useMemo(() => {
    const mockStart = page * pageSize;
    const mockPage = filteredMocks.slice(mockStart, mockStart + pageSize);
    return [...serverBoards, ...mockPage];
  }, [serverBoards, filteredMocks, page, pageSize]);

  // 페이지 계산: 서버 데이터와 Mock 데이터 중 더 많은 쪽 기준
  const totalPages =
    Math.max(
      Math.ceil(serverTotalElements / pageSize),
      Math.ceil(filteredMocks.length / pageSize)
    ) || 1;

  const handleTypeChange = (newType?: BoardType) => {
    if (newType) setSearchParams({ type: newType });
    else setSearchParams({});
    setPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" style={{ background: 'var(--landing-gray-100)', paddingTop: '6.5rem' }}>
        <section className="landing-section">
          <div className="landing-inner">
            <div className="text-center mb-10">
              <h1 className="landing-section-title landing-section-title--center">게시판</h1>
              <p className="landing-section-desc landing-section-desc--center">
                소통과 정보 공유의 공간입니다.
              </p>
            </div>

            <div className="list-toolbar mb-6">
              <ListSearch
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(0);
                }}
                placeholder="제목, 내용, 작성자로 검색"
              />
              <FilterBar
                groups={[
                  {
                    label: '게시판',
                    options: [
                      { value: '', label: '전체' },
                      ...BOARD_FILTER_TYPES.map((k) => ({ value: k, label: typeLabels[k] })),
                    ],
                    value: type ?? '',
                    onChange: (v) => handleTypeChange(v ? (v as BoardType) : undefined),
                  },
                ]}
                onReset={type ? () => handleTypeChange() : undefined}
              />
              <Link to="/boards/write" className="landing-btn landing-btn-primary shrink-0">
                글쓰기
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <p className="text-gray-600">게시글이 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="list-card-list">
                  {displayList.map((board, index) => (
                    <Link
                      // ID 충돌 방지를 위해 index 활용 (실제 운영 시에는 ID가 유니크해야 함)
                      key={`${board.id}-${index}`}
                      to={`/boards/${board.id}`}
                      className="list-card"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`list-card-badge ${typeColors[board.type]}`}>
                          {typeLabels[board.type]}
                        </span>
                        {board.isPinned && (
                          <span className="list-card-badge bg-purple-100 text-purple-700">
                            공지
                          </span>
                        )}
                      </div>
                      <h3 className="list-card-title">{board.title}</h3>
                      <div className="list-card-meta">
                        <span>{board.userName || '익명'}</span>
                        <span>조회 {board.views}</span>
                        <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="list-card-summary">{board.content.replace(/\n/g, ' ')}</p>
                    </Link>
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={Math.max(serverTotalElements, filteredMocks.length)}
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
    </div>
  );
}
