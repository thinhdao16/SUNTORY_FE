import React from "react";
import { motion } from "framer-motion";

const transition = {
  duration: 0.6,
  ease: "easeInOut",
};

const variants = {
  initial: { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition,
  },
  exit: { opacity: 0, y: -10, scale: 0.98, filter: "blur(4px)", transition },
};

const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    // variants={variants}
    style={{ height: "100%" }}
  >
    {children}
  </motion.div>
);

export default RouteTransition;
