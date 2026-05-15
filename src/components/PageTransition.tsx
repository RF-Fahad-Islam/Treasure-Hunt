import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

export function PageTransition({ children }: Props) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
