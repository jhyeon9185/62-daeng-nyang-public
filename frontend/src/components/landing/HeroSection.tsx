import { Link } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';

const TRANSITION_MS = 700;

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
        desc: '우리는 "좋은 주인을 만나 행복해질 것"을 믿고 싶습니다. 하지만 데이터는 서로 다른 두 개의 62를 보여줍니다.',
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
            "유기동물을 입양할 의향"
          </>
        ),
        desc: '국민 10명 중 6명 이상은 "펫숍이 아니라 보호소 아이를 가족으로 맞이하겠다"는 따뜻한 마음을 갖고 있습니다.',
        links: [
          { to: '/animals', label: '입양하기' },
          { to: '/boards?type=FREE', label: '후기 보기' },
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
        desc: '2024년 구조된 106,824마리 중 자연사+안락사 비율은 46.0%. 반환(약 15%)과 입양(20%대 초반)을 제외하면, "남겨짐"은 대략 62%에 가깝습니다.',
        links: [
          { to: '/animals', label: '한 아이를 가족으로' },
          { to: '/donations', label: '기부하기' },
        ],
      },
    ],
    []
  );

  /** 무한 루프용 확장 트랙: 9개 [0,1,2,0,1,2,0,1,2] - 양끝에 여유 있어 항상 좌우 슬라이드 존재 */
  const extendedSlides = useMemo(
    () => [...slides, ...slides, ...slides],
    [slides]
  );

  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
    []
  );

  const [displayIndex, setDisplayIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logicalIndex = displayIndex < 3 ? (displayIndex + 3) % 3 : displayIndex >= 6 ? (displayIndex - 3) % 3 : displayIndex - 3;

  const goTo = useCallback(
    (nextLogical: number) => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      const prevLogical = displayIndex < 3 ? (displayIndex + 3) % 3 : displayIndex >= 6 ? (displayIndex - 3) % 3 : displayIndex - 3;

      if (nextLogical === prevLogical) return;

      if (nextLogical === 0 && prevLogical === 2) {
        setDisplayIndex(6);
        resetTimeoutRef.current = setTimeout(() => {
          const track = document.querySelector('.landing-hero-track');
          track?.classList.add('landing-hero-track--no-transition');
          setDisplayIndex(3);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              track?.classList.remove('landing-hero-track--no-transition');
            });
          });
          resetTimeoutRef.current = null;
        }, TRANSITION_MS);
      } else if (nextLogical === 2 && prevLogical === 0) {
        setDisplayIndex(2);
        resetTimeoutRef.current = setTimeout(() => {
          const track = document.querySelector('.landing-hero-track');
          track?.classList.add('landing-hero-track--no-transition');
          setDisplayIndex(5);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              track?.classList.remove('landing-hero-track--no-transition');
            });
          });
          resetTimeoutRef.current = null;
        }, TRANSITION_MS);
      } else {
        setDisplayIndex(nextLogical + 3);
      }
    },
    [displayIndex]
  );

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      goTo((logicalIndex + 1) % 3);
    }, 6500);
    return () => window.clearInterval(id);
  }, [isPlaying, logicalIndex, goTo]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    if (velocity < -threshold || offset < -80) {
      goTo((logicalIndex + 1) % 3);
    } else if (velocity > threshold || offset > 80) {
      goTo((logicalIndex + 2) % 3);
    }
  };

  return (
    <section className="landing-hero landing-hero--carousel" aria-label="메인 소개">
      <div className="landing-hero-carousel">
        <motion.div
          className="landing-hero-track"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
          style={{ '--hero-active-index': displayIndex } as React.CSSProperties}
        >
          {extendedSlides.map((slide, i) => (
            <article
              key={`${slide.id}-${i}`}
              className={`landing-hero-slide ${i === displayIndex ? 'is-active' : ''}`}
              onClick={() => goTo(i % 3)}
            >
              <div className="landing-hero-slide-bg-wrap">
                <div className={`landing-hero-bg ${slide.bgClass}`} aria-hidden />
                <div className="landing-hero-overlay" />
              </div>
              <div className="landing-hero-slide-content">
                <p className="landing-hero-kicker">{slide.kicker}</p>
                <h2 className="landing-hero-title">{slide.title}</h2>
                <p className="landing-hero-sub">{slide.desc}</p>
                <nav className="landing-hero-cta" aria-label="이 스토리 관련 메뉴">
                  {slide.links.map(({ to, label }) => (
                    <Link
                      key={`${to}-${label}`}
                      to={to}
                      className="landing-btn landing-btn-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </article>
          ))}
        </motion.div>
      </div>

      <div className="landing-hero-controls-wrap">
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
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`landing-hero-dot ${i === logicalIndex ? 'is-active' : ''}`}
                aria-label={`${i + 1}번 슬라이드`}
                aria-selected={i === logicalIndex}
                role="tab"
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
