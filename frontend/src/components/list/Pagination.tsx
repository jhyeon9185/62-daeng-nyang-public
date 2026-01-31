/**
 * 2026 트렌드: 페이지네이션 (이전/다음 + 페이지 번호 + N개씩 보기)
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  sizeOptions?: number[];
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
  sizeOptions = [10, 15, 20, 30],
  className = '',
}: PaginationProps) {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  const showPages = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: number[] = [];
    if (page <= 2) {
      for (let i = 0; i < Math.min(5, totalPages); i++) pages.push(i);
      if (totalPages > 5) pages.push(-1, totalPages - 1);
    } else if (page >= totalPages - 3) {
      pages.push(0, -1);
      for (let i = totalPages - 5; i < totalPages; i++) if (i >= 0) pages.push(i);
    } else {
      pages.push(0, -1, page - 1, page, page + 1, -1, totalPages - 1);
    }
    return pages;
  })();

  return (
    <div className={`list-pagination ${className}`}>
      <div className="list-pagination-info">
        <span className="list-pagination-range">
          전체 <strong>{totalElements}</strong>건 중 {start}–{end}
        </span>
        {onSizeChange && (
          <div className="list-pagination-size">
            <label htmlFor="list-size" className="sr-only">페이지당 개수</label>
            <select
              id="list-size"
              className="list-pagination-select"
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
            >
              {sizeOptions.map((n) => (
                <option key={n} value={n}>{n}개씩</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <nav className="list-pagination-nav" aria-label="페이지 이동">
        <button
          type="button"
          className="list-pagination-btn"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="list-pagination-numbers">
          {showPages.map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="list-pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`list-pagination-num ${p === page ? 'is-active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`${p + 1}페이지`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p + 1}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="list-pagination-btn"
          disabled={page >= totalPages - 1 || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
