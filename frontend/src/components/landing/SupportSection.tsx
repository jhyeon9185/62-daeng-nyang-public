import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

export default function SupportSection() {
  return (
    <section className="landing-section landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="464.2억 원, ‘비극을 유지’하는 비용을 ‘치료’로 바꿉니다" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            사회는 이미 막대한 비용을 지불하고 있습니다. 하지만 그 돈이 ‘사체 처리’나
            ‘최소 연명’이 아니라, 한 생명의 회복과 입양으로 이어지려면 **개인의 행동**이 필요합니다.
          </p>
          <div className="landing-center-actions">
            <Link to="/donations" className="landing-btn landing-btn-primary">
              커피 몇 잔 값으로 치료를 만들기
            </Link>
          </div>
          <div className="landing-support-grid" style={{ fontFamily: 'var(--landing-font)' }}>
            <div className="landing-support-card">
              <p className="landing-support-title">정기 후원</p>
              <p className="landing-support-desc">매월 아이들의 ‘기본’을 지켜요</p>
            </div>
            <div className="landing-support-card">
              <p className="landing-support-title">일시 후원</p>
              <p className="landing-support-desc">급한 치료/구조에 빠르게</p>
            </div>
            <div className="landing-support-card">
              <p className="landing-support-title">물품 기부</p>
              <p className="landing-support-desc">사료·간식·담요·약품</p>
            </div>
            <div className="landing-support-card">
              <p className="landing-support-title">투명 사용</p>
              <p className="landing-support-desc">사용 내역을 공개합니다</p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
