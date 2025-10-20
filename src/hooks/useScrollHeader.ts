import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  threshold?: number;
}

export const useScrollHeader = ({ threshold = 10 }: UseScrollHeaderOptions = {}) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const currentScrollY = container.scrollTop;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      const distance = Math.abs(currentScrollY - lastScrollY.current);

      if (distance < threshold) return;

      if (direction === 'down' && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (direction === 'up') {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
      setScrollY(currentScrollY);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [threshold]);

  return {
    isHeaderVisible,
    scrollY,
    scrollContainerRef
  };
};
