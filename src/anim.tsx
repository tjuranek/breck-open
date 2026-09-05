import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

export const spring = { type: "spring" as const, duration: 0.28, bounce: 0.1 };
export const tapSpring = { type: "spring" as const, duration: 0.18, bounce: 0.16 };

export const pageFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: spring,
};

export const holeSlide = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { type: "spring" as const, duration: 0.24, bounce: 0.08 },
};

export const tap = { scale: 0.97 };

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
