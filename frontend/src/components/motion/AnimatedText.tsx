import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const appleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  /**
   * 단어/문장 덩어리별로 순차 등장 (기본: true)
   * false면 전체를 한 번에 애니메이션.
   */
  stagger?: boolean;
}

function splitByWords(text: string) {
  // 공백을 보존하기 위해 "단어 + 공백" 단위로 분리
  return text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
}

export default function AnimatedText({ text, className = '', delay = 0, stagger = true }: AnimatedTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-64px' });

  const chunks = useMemo(() => splitByWords(text), [text]);

  if (!stagger) {
    return (
      <motion.span
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.8, delay, ease: appleEase }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span ref={ref} className={className} aria-label={text}>
      {chunks.map((chunk, i) => (
        <motion.span
          key={`${chunk}-${i}`}
          style={{ display: 'inline-block', whiteSpace: chunk.trim().length === 0 ? 'pre' : 'normal' }}
          initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.7, delay: delay + i * 0.04, ease: appleEase }}
        >
          {chunk}
        </motion.span>
      ))}
    </span>
  );
}

