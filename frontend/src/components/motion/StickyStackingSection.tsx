import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StickyStackingSectionProps {
  children: ReactNode;
  zIndex: number;
  className?: string;
  /**
   * fixed header 아래로 붙도록 offset(px)
   */
  topOffsetPx?: number;
}

/**
 * playw_project 스타일의 “섹션 자석(스티키 스택)” 효과
 * - 각 섹션이 화면 상단(헤더 아래)에 붙어있다가
 * - 다음 섹션이 위로 올라오며 덮는 느낌을 만듭니다.
 * - 모바일에서는 스크롤 충돌 방지를 위해 모션을 약하게/단순하게 처리합니다.
 */
export default function StickyStackingSection({
  children,
  zIndex,
  className = '',
  topOffsetPx = 56, // toss header height(3.5rem)
}: StickyStackingSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const style = {
    zIndex,
    top: `${topOffsetPx}px`,
    // CSS에서 스택 높이/여백 계산에 사용
    ['--landing-stack-top' as any]: `${topOffsetPx}px`,
  } as const;

  return (
    <motion.div
      className={`sticky w-full max-w-full overflow-x-hidden touch-pan-y ${className}`}
      style={{ ...style, touchAction: 'pan-y' }}
      initial={{ y: isMobile ? 28 : 72, opacity: 0.92 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        type: 'spring',
        stiffness: 110,
        damping: 22,
        mass: 0.55,
      }}
    >
      <div className="landing-stack-stage">
        {children}
      </div>
    </motion.div>
  );
}

