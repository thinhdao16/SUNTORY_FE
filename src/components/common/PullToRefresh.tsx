import React, { useState, useRef, useCallback } from 'react';
import { IonRefresher, IonRefresherContent } from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { motion } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    disabled = false,
    className = ''
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const refresherRef = useRef<HTMLIonRefresherElement>(null);

    const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
        if (disabled) {
            event.detail.complete();
            return;
        }

        setIsRefreshing(true);

        try {
            await onRefresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
            event.detail.complete();
            setPullProgress(0);
        }
    }, [onRefresh, disabled]);

    const handlePulling = useCallback((event: CustomEvent) => {
        const detail = event.detail as any;
        if (detail && detail.progress !== undefined) {
            const progress = Math.min(detail.progress, 1);
            setPullProgress(progress);
        }
    }, []);

    const RefreshIcon = () => (
        <motion.div
            className="flex items-center justify-center"
            animate={{
                scale: isRefreshing ? [1, 1.2, 1] : 1 + (pullProgress * 0.3),
                rotate: isRefreshing ? 360 : pullProgress * 180,
            }}
            transition={{
                scale: isRefreshing ? {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : { duration: 0.1 },
                rotate: isRefreshing ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                } : { duration: 0.2 }
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-blue-500"
            >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
            </svg>
        </motion.div>
    );

    return (
        <div className={`relative ${className}`}>
            <IonRefresher
                ref={refresherRef}
                slot="fixed"
                onIonRefresh={handleRefresh}
                onIonPull={handlePulling}
                pullMin={60}
                pullMax={120}
                snapbackDuration="300ms"
                disabled={disabled}
            >
                <IonRefresherContent>
                    <div className="flex flex-col items-center justify-center py-4">
                        {/* <RefreshIcon /> */}
                    </div>
                </IonRefresherContent>
            </IonRefresher>

            {children}
        </div>
    );
};

export default PullToRefresh;
