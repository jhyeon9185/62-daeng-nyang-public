import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

export default function GetInvolvedSection() {
  return (
    <section className="landing-section landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="입양이 어려워도, ‘62’를 바꿀 수 있어요" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            주말 4시간의 봉사는 240분의 ‘바깥’과 240분의 ‘교감’을 선물합니다. 임시보호는
            보호소의 시간을 벌어주고, 아이에게는 회복의 공간이 됩니다.
          </p>
          <div className="landing-two-col">
            <div className="landing-involve-card">
              <h3>임시보호 (임보)</h3>
              <p>
                입양 전까지 잠시 우리 집에서. 1주일에서 몇 달까지, 당신의 공간이 한 생명에게
                “기다림”이 아닌 “회복”이 될 수 있어요.
              </p>
              <Link to="/guide/foster" className="landing-btn landing-btn-primary">
                임보 절차 안내
              </Link>
            </div>
            <div className="landing-involve-card">
              <h3>봉사활동</h3>
              <p>
                산책·방문·이동·온라인 봉사까지. 시간이 길 필요는 없어요. ‘정기적으로’는 더
                큰 변화를 만듭니다.
              </p>
              <Link to="/volunteers" className="landing-btn landing-btn-primary">
                봉사 신청하기
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
