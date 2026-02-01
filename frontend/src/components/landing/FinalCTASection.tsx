import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

export default function FinalCTASection() {
  return (
    <section className="landing-final-cta landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="당신이 ‘62’를 바꿀 수 있습니다" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            마음속 62%를 오늘의 행동으로. 한 생명이 ‘남겨짐’이 아니라 ‘가족’으로 기록되도록.
          </p>
          <div className="landing-hero-cta">
            <Link to="/guide/adoption" className="landing-btn landing-btn-primary">
              입양 절차 안내
            </Link>
            <Link to="/guide/foster" className="landing-btn landing-btn-secondary">
              임보 절차 안내
            </Link>
            <Link to="/donations" className="landing-btn landing-btn-secondary">
              후원하기
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
