import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "motion/react";

type Props = {
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
};

export function CountUp({ to, duration = 1.4, suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const value = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = `${Math.round(latest)}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, suffix, value]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
