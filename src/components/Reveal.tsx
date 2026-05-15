import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

type Direction = "up" | "down" | "left" | "right";

type Props = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  direction?: Direction;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "span" | "li" | "p" | "h2" | "h3";
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  direction = "up",
  y,
  x,
  once = true,
  className,
  style,
  as = "div",
}: Props) {
  const offset = 28;
  const from = {
    up: { x: 0, y: y ?? offset },
    down: { x: 0, y: y ?? -offset },
    left: { x: x ?? offset, y: 0 },
    right: { x: x ?? -offset, y: 0 },
  }[direction];

  const variants: Variants = {
    hidden: { opacity: 0, ...from },
    show: { opacity: 1, x: 0, y: 0 },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </MotionTag>
  );
}

type WordRevealProps = {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
};

export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
}: WordRevealProps) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            variants={{
              hidden: { y: "115%", opacity: 0 },
              show: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 0.75, ease }}
            className={["inline-block", wordClassName ?? ""].join(" ")}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
