import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import MissionSection from '@/components/landing/MissionSection';
import AdoptableSection from '@/components/landing/AdoptableSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import GetInvolvedSection from '@/components/landing/GetInvolvedSection';
import SupportSection from '@/components/landing/SupportSection';
import SuccessStoriesSection from '@/components/landing/SuccessStoriesSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import StickyStackingSection from '@/components/motion/StickyStackingSection';

const missionStats = [
  { value: '106,824', label: '2024 구조된 유실·유기동물(마리)' },
  { value: '61.6%', label: '유기동물 입양 의향(약 62%)' },
  { value: '46.0%', label: '자연사+안락사 비율(2024)' },
  { value: '464.2억', label: '지자체 보호센터 운영비(2024)' },
];

/**
 * 랜딩 페이지 흐름 (스토리텔링)
 * 감정적 연결 → 문제 인식 → 해결 방법 → 행동 유도
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 relative w-full max-w-full overflow-x-hidden">
        <HeroSection />
        <StickyStackingSection zIndex={1} className="landing-stack-bg">
          <MissionSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={2} className="landing-stack-bg">
          <section className="landing-stats" aria-label="팩트 체크 주요 수치">
            <div className="landing-inner">
              <div className="landing-stats-grid">
                {missionStats.map(({ value, label }) => (
                  <div key={label} className="landing-stats-item">
                    <p className="landing-stats-value landing-num">{value}</p>
                    <p className="landing-stats-label">{label}</p>
                  </div>
                ))}
              </div>
              <p className="landing-fact-note">
                데이터 기준: 2024~2025 공개 통계(리포트 요약). 상세 출처는 섹션 설명을 참고해 주세요.
              </p>
            </div>
          </section>
        </StickyStackingSection>

        <StickyStackingSection zIndex={3} className="landing-stack-bg">
          <AdoptableSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={4} className="landing-stack-bg">
          <HowItWorksSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={5} className="landing-stack-bg">
          <GetInvolvedSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={6} className="landing-stack-bg">
          <SupportSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={7} className="landing-stack-bg">
          <SuccessStoriesSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={8} className="landing-stack-bg">
          <FAQSection />
        </StickyStackingSection>

        <StickyStackingSection zIndex={9} className="landing-stack-bg landing-stack-bg--last">
          <FinalCTASection />
          <Footer />
        </StickyStackingSection>
      </main>
    </div>
  );
}
