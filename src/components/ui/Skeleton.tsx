import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
  animate?: 'pulse' | 'none';
  colorClass?: string; // tailwind color classes, e.g. 'bg-gray-200'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = 'pulse',
  colorClass = 'bg-gray-200',
}) => {
  const roundedClass = rounded.startsWith('rounded') ? rounded : `rounded-${rounded}`;
  const animateClass = animate === 'pulse' ? 'animate-pulse' : '';
  const style: React.CSSProperties = {
    width,
    height,
  };
  return (
    <div className={`${animateClass} ${colorClass} ${roundedClass} ${className}`} style={style} />
  );
};

export default Skeleton;
