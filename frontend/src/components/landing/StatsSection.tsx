const stats = [
  { value: '12,000+', label: '연간 구조 동물' },
  { value: '350+', label: '제휴 보호소' },
  { value: '8,000+', label: '입양·임보 성사' },
];

export default function StatsSection() {
  return (
    <section className="toss-stats">
      <div className="toss-section-inner">
        <h2 className="sr-only">서비스 통계</h2>
        <div className="toss-stats-grid">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="toss-stats-value">{value}</p>
              <p className="toss-stats-label">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
