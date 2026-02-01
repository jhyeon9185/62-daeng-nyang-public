import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

const quickLinks = [
  { to: '/animals', label: '입양하기' },
  { to: '/guide/foster', label: '임시보호' },
  { to: '/volunteers', label: '봉사하기' },
  { to: '/donations', label: '기부하기' },
];

export default function MissionSection() {
  return (
    <section className="landing-section landing-magnet" id="mission">
      <div className="landing-inner">
        <AnimatedSection>
          <div className="landing-section-row landing-section--left">
            <div className="landing-section-content">
              <h2 className="landing-section-title">
                <AnimatedText text="두 개의 62: 희망과 절망 사이" />
              </h2>
              <p className="landing-section-desc">
                <strong>마음속의 62%</strong>는 “유기동물을 입양하겠다”는 따뜻한 의향입니다.
                하지만 현실의 <strong>62%</strong>는 집으로 돌아가지 못한 채, 보호 시스템 안에 남겨진 아이들의 비율이기도 합니다.
              </p>
              <p className="landing-section-desc">
                2024년 한 해에만 구조된 유실·유기동물은 <strong>106,824마리</strong>.
                그중 <strong>자연사+안락사 비율은 46.0%</strong>에 달했습니다.
                “좋은 마음”이 “현실”로 이어지지 못하면 숫자는 비극으로 남습니다.
              </p>
              <div className="landing-quick-grid" aria-label="지금 할 수 있는 행동">
                {quickLinks.map(({ to, label }) => (
                  <Link key={to} to={to} className="landing-quick-card">
                    {label}
                  </Link>
                ))}
              </div>
              <p className="landing-section-desc" style={{ fontSize: '0.9375rem', opacity: 0.9 }}>
                출처 요약: KB금융지주 경영연구소(2021) 입양 의향 61.6%, 농림축산식품부·검역본부(2024년 실태조사) 발생/처리 통계.
              </p>
            </div>
            <div className="landing-section-visual">
              <div className="landing-visual-placeholder landing-visual-placeholder--image" aria-hidden>
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"
                  alt="고양이와 강아지가 함께 있는 모습"
                  width={800}
                  height={600}
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
