import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';

const stories = [
  {
    quote: '보호소에서 만난 지 3개월, 이제 우리 가족의 일부입니다. 매일 산책하고 함께 밥 먹는 시간이 가장 행복해요.',
    name: '김○○ 님 · 강아지 입양',
    image: '/success-story-1.webp',
    alt: '강아지와 함께한 입양 후기',
  },
  {
    quote: '처음엔 임보로 시작했는데, 이별이 너무 힘들어 결국 입양했어요. 인생 최고의 선택이었습니다.',
    name: '이○○ 님 · 고양이 입양',
    image: '/success-story-2.webp',
    alt: '고양이 입양 후기',
  },
  {
    quote: '늦은 나이에 만난 우리 루나. 이제 저희 부부에게 없어서는 안 될 존재가 되었어요.',
    name: '박○○ 님 · 고양이 입양',
    image: '/success-story-3.webp',
    alt: '고양이 루나 입양 후기',
  },
];

export default function SuccessStoriesSection() {
  return (
    <section className="landing-section landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="희망의 62가 ‘진짜 이야기’가 되는 순간" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            숫자는 차갑지만, 선택은 따뜻합니다. 한 사람의 행동이 한 생명의 인생이 됩니다.
          </p>
          <div className="landing-center-actions">
            <Link to="/boards?type=FREE" className="landing-btn landing-btn-secondary">
              더 많은 후기 보기
            </Link>
          </div>
          <div className="landing-story-grid">
            {stories.map(({ quote, name, image, alt }) => (
              <div key={name} className="landing-story-card">
                <div className="landing-story-card-img">
                  <img src={image} alt={alt} width={600} height={450} loading="lazy" />
                </div>
                <div className="landing-story-card-body">
                  <p className="landing-story-card-quote">&ldquo;{quote}&rdquo;</p>
                  <p className="landing-story-card-name">— {name}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
