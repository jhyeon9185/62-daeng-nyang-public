import { motion } from 'framer-motion';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

const steps = [
  { title: '마음에 드는 아이 찾기', desc: '프로필을 둘러보고 나와 잘 맞는 친구를 찾아보세요.' },
  { title: '절차 확인 및 전화 예약', desc: '단계별 안내에 따라 사이트를 이용하고, 보호소에 전화로 예약합니다.' },
  { title: '상담 & 만남', desc: '보호소와 상담 후 직접 만나서 교감해 보세요.' },
  { title: '가족 되기', desc: '입양 완료 후에도 사후 지원으로 함께합니다.' },
];

/** 1→2→3→4 구간으로 흐르는 화살표 SVG (큰 사이즈) */
function FlowArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h11m0 0l-4-4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HowItWorksSection() {
  /* 4단계 중심 위치 (%, 뱃지 중앙) → 1→2→3→4→1 반복 */
  const stepPositions = ['12.5%', '37.5%', '62.5%', '87.5%', '12.5%'];

  return (
    <section className="landing-section landing-magnet" id="process">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="마음속 62%를 ‘현실’로 만드는 4단계" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            복잡하지 않아요. 네 단계만 거치면 새로운 가족을 만날 수 있습니다.
          </p>
          <div className="landing-timeline-wrap">
            <motion.div
              className="landing-timeline-arrow"
              aria-hidden
              animate={{ left: stepPositions }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.25, 0.5, 0.75, 1],
              }}
            >
              <FlowArrowIcon />
            </motion.div>
            <div className="landing-timeline">
              {steps.map(({ title, desc }, index) => (
                <div key={title} className="landing-timeline-item">
                  <span className="landing-step-badge" aria-hidden>
                    {index + 1}
                  </span>
                  <h3 className="landing-timeline-title">{title}</h3>
                  <p className="landing-timeline-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
