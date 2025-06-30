import React from "react";
import { motion } from "framer-motion";

interface MotionBottomSheetProps {
  isOpen: boolean;
  scale?: number;
  opacity?: number;
  borderRadius?: string;
  children?: React.ReactNode;
}

const MotionBottomSheet: React.FC<MotionBottomSheetProps> = ({
  isOpen,
  scale = 1,
  opacity = 1,
  borderRadius = 0,
  children,
}) => {
  return (
    <motion.div
      className={`min-h-[100dvh] transition-transform duration-300 bg-white darkk:bg-black overflow-hidden
        flex flex-col z-99
      }`}
      style={{
        transform: isOpen ? `scale(${scale})` : undefined,
        transition: isOpen ? "none" : "transform 0.2s ease",
        opacity: opacity,
        borderRadius: borderRadius,
      }}
      animate={{
        scale: isOpen ? scale : 1,
        opacity: opacity,
        borderRadius: borderRadius,
      }}
      initial={false}
      transition={{
        opacity: { duration: 0.2 },
        borderRadius: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
};

export default MotionBottomSheet;
