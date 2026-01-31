import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const appleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

export type AnimatedSectionAnimation = 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimatedSectionAnimation;
}

const animations: Record<AnimatedSectionAnimation, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  animation = 'fadeUp',
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      variants={animations[animation]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-64px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: appleEase,
      }}
    >
      {children}
    </motion.div>
  );
}

