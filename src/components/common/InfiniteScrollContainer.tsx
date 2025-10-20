import React, { useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollContainerProps {
    children: React.ReactNode;
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    className?: string;
    showEndIndicator?: boolean;
    containerRefCallback?: (el: HTMLDivElement | null) => void;
}

const InfiniteScrollContainer: React.FC<InfiniteScrollContainerProps> = ({
    children,
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 200,
    className = "",
    showEndIndicator = true,
    containerRefCallback,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    const handleScroll = useCallback(() => {
        if (!containerRef.current || loadingRef.current || !hasMore || isLoading) {
            return;
        }

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Check if user scrolled near the bottom
        if (scrollHeight - scrollTop - clientHeight < threshold) {
            loadingRef.current = true;
            onLoadMore();
            
            // Reset loading flag after a delay to prevent multiple calls
            setTimeout(() => {
                loadingRef.current = false;
            }, 1000);
        }
    }, [onLoadMore, hasMore, isLoading, threshold]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        if (containerRefCallback) containerRefCallback(container);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (containerRefCallback) containerRefCallback(null);
        };
    }, [handleScroll, containerRefCallback]);

    return (
        <div 
            ref={containerRef}
            className={`flex-1 overflow-y-auto ${className}`}
        >
            {children}
            
            {isLoading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">{t("Loading more...")}</span>
                </div>
            )}
            
            {showEndIndicator && !hasMore && !isLoading && (
                <div className="text-center py-4 text-gray-500 text-sm">
                    {t("No more results")}</div>
            )}
        </div>
    );
};

export default InfiniteScrollContainer;
