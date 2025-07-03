import React from "react";

interface MotionStylesProps {
  isOpen: boolean;
  translateY: number;
  screenHeight: number;
  children: (styles: {
    scale: number;
    opacity: number;
    borderRadius: string;
    backgroundColor: string;
  }) => React.ReactNode;
}

const MotionStyles: React.FC<MotionStylesProps> = ({
  isOpen,
  translateY,
  screenHeight,
  children,
}) => {
  // const scale = isOpen
  //   ? Math.min(1, 0.95 + (translateY / screenHeight) * 0.05)
  //   : 0.95;
  const scale = 1
  const opacity = isOpen
    ? Math.min(0.5 + (translateY / screenHeight) * 0.5, 1)
    : 1;

  // const borderRadius = isOpen
  //   ? `${Math.min(12 + (translateY / screenHeight) * 20, 80)}px`
  //   : "0";
  const borderRadius = "0"
  const backgroundColor = isOpen
    ? `rgba(0, 0, 0, ${1 - (translateY / screenHeight) * 1.2})`
    : "rgba(255, 255, 255, 1)";

  return <>{children({ scale, opacity, borderRadius, backgroundColor })}</>;
};

export default MotionStyles;
