/**
 * 재사용 가능한 필터 바
 * 카테고리별 드롭다운(select) 방식
 */

export interface FilterGroupOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  label: string;
  options: FilterGroupOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  groups: FilterGroup[];
  onReset?: () => void;
  className?: string;
}

export default function FilterBar({ groups, onReset, className = '' }: FilterBarProps) {
  return (
    <div className={`list-filter-bar list-filter-bar--dropdown ${className}`.trim()}>
      <div className="list-filter-groups">
        {groups.map((group) => (
          <div key={group.label} className="list-filter-group">
            <label htmlFor={`filter-${group.label}`} className="list-filter-group-label">
              {group.label}
            </label>
            <select
              id={`filter-${group.label}`}
              className="list-filter-select"
              value={group.value}
              onChange={(e) => group.onChange(e.target.value)}
              aria-label={group.label}
            >
              {group.options.map((opt) => (
                <option key={opt.value || `all-${group.label}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {onReset && (
        <button type="button" className="list-filter-reset" onClick={onReset}>
          필터 초기화
        </button>
      )}
    </div>
  );
}
