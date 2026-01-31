/**
 * 2026 트렌드: 검색 바 (돋보기 아이콘 + placeholder)
 */
interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ListSearch({
  value,
  onChange,
  placeholder = '검색어를 입력하세요',
  className = '',
}: ListSearchProps) {
  return (
    <div className={`list-search-wrap ${className}`}>
      <span className="list-search-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        className="list-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="검색"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="list-search-clear"
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
