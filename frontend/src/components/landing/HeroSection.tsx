import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const appleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

export default function HeroSection() {
  const slides = useMemo(
    () => [
      {
        id: 'story-1',
        bgClass: 'landing-hero-bg--one',
        kicker: '스토리 리포트',
        title: (
          <>
            두 개의 <span className="landing-hero-num">62</span>
            <br />
            희망과 절망 사이
          </>
        ),
        desc: '우리는 “좋은 주인을 만나 행복해질 것”을 믿고 싶습니다. 하지만 데이터는 서로 다른 두 개의 62를 보여줍니다.',
        links: [
          { to: '/volunteers', label: '봉사 참여하기' },
          { to: '/animals', label: '보호소 아이들 보기' },
        ],
      },
      {
        id: 'story-2',
        bgClass: 'landing-hero-bg--two',
        kicker: '첫 번째 62 · 마음속의 희망',
        title: (
          <>
            <span className="landing-hero-num">61.6%</span> (약 <span className="landing-hero-num">62%</span>)
            <br />
            “유기동물을 입양할 의향”
          </>
        ),
        desc: '국민 10명 중 6명 이상은 “펫숍이 아니라 보호소 아이를 가족으로 맞이하겠다”는 따뜻한 마음을 갖고 있습니다.',
        links: [
          { to: '/animals', label: '입양하기' },
          { to: '/boards?type=review', label: '후기 보기' },
        ],
      },
      {
        id: 'story-3',
        bgClass: 'landing-hero-bg--three',
        kicker: '두 번째 62 · 남겨진 아이들',
        title: (
          <>
            약 <span className="landing-hero-num">62%</span>
            <br />
            집으로 돌아가지 못한 아이들
          </>
        ),
        desc: '2024년 구조된 106,824마리 중 자연사+안락사 비율은 46.0%. 반환(약 15%)과 입양(20%대 초반)을 제외하면, “남겨짐”은 대략 62%에 가깝습니다.',
        links: [
          { to: '/animals', label: '한 아이를 가족으로' },
          { to: '/donations', label: '기부하기' },
        ],
      },
    ],
    []
  );

  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [isPlaying, slides.length]);

  const active = slides[activeIndex];

  return (
    <section className="landing-hero" aria-label="메인 소개">
      <div className="landing-hero-media" aria-hidden>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className={`landing-hero-bg ${active.bgClass}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.9, ease: appleEase }}
          />
        </AnimatePresence>
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-hero-center">
        <div className="landing-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              className="landing-hero-copy"
              initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.75, ease: appleEase }}
            >
              <p className="landing-hero-kicker">{active.kicker}</p>
              <h1 className="landing-hero-title">{active.title}</h1>
              <p className="landing-hero-sub">{active.desc}</p>

              <nav className="landing-hero-cta" aria-label="이 스토리 관련 메뉴">
                {active.links.map(({ to, label }) => (
                  <Link key={`${to}-${label}`} to={to} className="landing-btn landing-btn-primary">
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </AnimatePresence>

          <div className="landing-hero-controls" aria-label="히어로 슬라이드 컨트롤">
            <button
              type="button"
              className="landing-hero-play"
              aria-label={isPlaying ? '일시정지' : '재생'}
              aria-pressed={!isPlaying}
              onClick={() => setIsPlaying((v) => !v)}
            >
              {isPlaying ? '일시정지' : '재생'}
            </button>
            <div className="landing-hero-dots" role="tablist" aria-label="슬라이드 선택">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`landing-hero-dot ${i === activeIndex ? 'is-active' : ''}`}
                  aria-label={`${i + 1}번 슬라이드`}
                  aria-selected={i === activeIndex}
                  role="tab"
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
