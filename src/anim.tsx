import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

export const easeOut = { duration: 0.2, ease: [0.33, 1, 0.68, 1] as const };
export const spring = easeOut;
export const tapSpring = { duration: 0.16, ease: [0.33, 1, 0.68, 1] as const };

export const pageFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: easeOut,
};

export const holeSlide = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: easeOut,
};

export const tap = { scale: 0.98 };

export function Fade({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} {...pageFade} {...rest}>
      {children}
    </motion.div>
  );
}
