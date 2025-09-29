import { useEffect, useRef } from 'react';
import { useSocialFeedStore, generateFeedKey } from '@/store/zustand/social-feed-store';

interface UseScrollRestorationOptions {
    feedType?: number;
    hashtagNormalized?: string;
    enabled?: boolean;
}

export const useScrollRestoration = (options: UseScrollRestorationOptions = {}) => {
    const { feedType, hashtagNormalized, enabled = true } = options;
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const isRestoringRef = useRef(false);

    const { saveScrollPosition, getScrollPosition } = useSocialFeedStore();
    const feedKey = generateFeedKey(feedType, hashtagNormalized);

    useEffect(() => {
        if (!enabled) return;

        let timeoutId: number;
        let scrollElement: Element | null = null;

        const findScrollElement = () => {
            const ionContent = document.querySelector('ion-content');
            if (ionContent) {
                const scrollElement = ionContent.shadowRoot?.querySelector('.inner-scroll') || ionContent;
                return scrollElement as Element;
            }

            const el = scrollContainerRef.current as HTMLElement | null;
            if (el && el.scrollHeight > el.clientHeight) {
                return el as Element;
            }

            // Fallback: use window scroll
            return null;
        };

        const handleScroll = () => {
            if (isRestoringRef.current) return;

            const element = scrollElement as HTMLElement;
            if (!element) return;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const scrollTop = element.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
                saveScrollPosition(scrollTop, feedKey);
            }, 100);
        };

        const setupScrollListener = () => {
            scrollElement = findScrollElement();

            if (scrollElement) {
                scrollElement.addEventListener('scroll', handleScroll, { passive: true });
            } else {
                window.addEventListener('scroll', handleScroll, { passive: true });
            }
        };

        setTimeout(setupScrollListener, 100);

        return () => {
            if (scrollElement) {
                scrollElement.removeEventListener('scroll', handleScroll);
            } else {
                window.removeEventListener('scroll', handleScroll);
            }
            clearTimeout(timeoutId);
        };
    }, [enabled, feedKey, saveScrollPosition]);

    useEffect(() => {
        if (!enabled) return;

        const savedPosition = getScrollPosition(feedKey);


        if (savedPosition > 0) {
            isRestoringRef.current = true;

            const restorePosition = () => {
                const ionContent = document.querySelector('ion-content');
                let scrollElement: HTMLElement | null = null;

                if (ionContent) {
                    scrollElement = (ionContent.shadowRoot?.querySelector('.inner-scroll') || ionContent) as HTMLElement;
                } else {
                    const el = scrollContainerRef.current as HTMLElement | null;
                    if (el && el.scrollHeight > el.clientHeight) {
                        scrollElement = el;
                    }
                }

                if (scrollElement) {
                    scrollElement.scrollTop = savedPosition;
                } else {
                    window.scrollTo(0, savedPosition);
                }

                setTimeout(() => {
                    isRestoringRef.current = false;
                }, 200);
            };

            requestAnimationFrame(() => {
                restorePosition();

                setTimeout(() => {
                    if (getScrollPosition(feedKey) !== savedPosition) {
                        restorePosition();
                    }
                }, 100);
            });
        } else {
            isRestoringRef.current = false;
        }
    }, [enabled, feedKey, getScrollPosition]);

    const setScrollContainer = (element: HTMLElement | null) => {
        scrollContainerRef.current = element;
    };

    return {
        setScrollContainer,
        scrollContainerRef
    };
};
