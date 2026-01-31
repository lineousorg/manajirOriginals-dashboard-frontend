"use client";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { ReactNode, ComponentProps } from "react";

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className,
}: PageTransitionProps) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
    className={className}
  >
    {children}
  </motion.div>
);

interface FadeInProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  delay?: number;
}

export const FadeIn = ({ children, delay = 0, ...props }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

export const ScaleOnHover = ({ children, ...props }: FadeInProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    {...props}
  >
    {children}
  </motion.div>
);

export { motion, AnimatePresence };
