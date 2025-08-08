// src/pages/SocialChat/SocialChatThread/components/DraggableMessageContainer.tsx
import React, { useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Capacitor } from '@capacitor/core';

interface DraggableMessageContainerProps {
    children: React.ReactNode;
    isUser: boolean;
    isRevoked: boolean;
    onReply: () => void;
    onLongPress: () => void;
    messageId: string | number;
    setShowActionsMobile: (show: boolean) => void;
}

export const DraggableMessageContainer: React.FC<DraggableMessageContainerProps> = ({
    children,
    isUser,
    isRevoked,
    onReply,
    onLongPress,
    messageId,
    setShowActionsMobile
}) => {
    const isNative = Capacitor.isNativePlatform();
    const controls = useAnimation();
    const longPressTimer = useRef<any>(null);

    const handleLongPressStart = (e: React.TouchEvent) => {
        e.stopPropagation();

        const touch = e.changedTouches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        longPressTimer.current = setTimeout(() => {
            setShowActionsMobile(true);
        }, 500);

        const handleMove = (moveEvent: TouchEvent) => {
            const moveTouch = moveEvent.changedTouches[0];
            const deltaX = Math.abs(moveTouch.clientX - startX);
            const deltaY = Math.abs(moveTouch.clientY - startY);

            if (deltaX > 15 || deltaY > 15) {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            }
        };

        const handleEnd = () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };

        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    };

    return (
        <motion.div
            key={messageId}
            className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <motion.div
                className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""} items-start w-full`}
                drag="x"
                dragDirectionLock
                dragConstraints={isUser ? { left: -100, right: 0 } : { left: 0, right: 100 }}
                dragElastic={0.2}
                style={{
                    touchAction: isNative ? 'pan-y' : 'auto' // ← Platform specific
                }}
                onDrag={(e, info) => {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                    if (!isRevoked) {
                        if (isUser && info.offset.x > 0) {
                            controls.start({ x: 0 });
                        }
                        if (!isUser && info.offset.x < 0) {
                            controls.start({ x: 0 });
                        }
                    }
                }}
                onDragEnd={(e, info) => {
                    const offset = info.offset.x;
                    const threshold = 80;
                    const shouldTrigger =
                        (!isUser && offset > threshold) || (isUser && offset < -threshold);
                    if (shouldTrigger) {
                        onReply();
                    }
                    controls.start({ x: 0 });
                }}
                animate={controls}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div
                    className="flex-1 flex  items-start gap-1 relative group"
                    onTouchStart={handleLongPressStart}
                    style={{
                        touchAction: isNative ? 'manipulation' : 'auto',
                        userSelect: 'none'
                    }}
                >
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
};