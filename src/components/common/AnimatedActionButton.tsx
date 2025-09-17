import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedActionButtonProps {
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    count: number;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    activeColor?: string;
    inactiveColor?: string;
    activeNumberColor?: string;
    inactiveNumberColor?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | "none";
}

const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({
    icon,
    activeIcon,
    count,
    isActive,
    onClick,
    disabled = false,
    activeColor = 'text-red-500',
    inactiveColor = 'text-black',
    activeNumberColor,
    inactiveNumberColor ="text-black",
    className = '',
    size = 'none'
}) => {
    const [displayCount, setDisplayCount] = useState(count);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (count !== displayCount) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayCount(count);
                setIsAnimating(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [count, displayCount]);

    const sizeClasses = {
        sm: 'gap-1 text-xs',
        md: 'gap-2 text-sm',
        lg: 'gap-3 text-base',
        none: ''
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        none: ''
    };

    const handleClick = () => {
        if (!disabled) {
            onClick();
        }
    };

    const numberColor = isActive 
        ? (activeNumberColor || activeColor)
        : (inactiveNumberColor || inactiveColor);

    return (
        <motion.button
            className={`relative flex items-center justify-center ${sizeClasses[size]} transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            } ${className}`}
            onClick={handleClick}
            disabled={disabled}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            whileHover={!disabled ? { scale: 1.05 } : {}}
        >
            <motion.div
                className={`${iconSizeClasses[size]} ${isActive ? activeColor : inactiveColor} transition-colors duration-200`}
                animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    rotate: isActive ? [0, -10, 10, 0] : 0
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isActive ? 'active' : 'inactive'}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isActive && activeIcon ? activeIcon : icon}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <div className="relative overflow-hidden min-w-[20px] flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={displayCount}
                        initial={{ 
                            y: isAnimating ? (count > displayCount ? -20 : 20) : 0,
                            opacity: isAnimating ? 0 : 1
                        }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ 
                            y: count > displayCount ? 20 : -20,
                            opacity: 0
                        }}
                        transition={{ 
                            duration: 0.3,
                            ease: "easeInOut"
                        }}
                        className={`block font-medium transition-colors duration-200 ${numberColor}`}
                    >
                        {displayCount.toLocaleString()}
                    </motion.span>
                </AnimatePresence>
            </div>

            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        background: `radial-gradient(circle, ${activeColor.includes('red') ? '#ef4444' : '#3b82f6'} 0%, transparent 70%)`
                    }}
                />
            )}
        </motion.button>
    );
};

export default AnimatedActionButton;
