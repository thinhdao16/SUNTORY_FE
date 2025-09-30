import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExpandableTextProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  clampClassName?: string; // e.g. 'line-clamp-2'
  stopPropagationOnToggle?: boolean;
  onToggle?: (expanded: boolean) => void;
  resetKey?: string | number; // when this changes, collapse back
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  children,
  className = '',
  contentClassName = '',
  clampClassName = 'line-clamp-2',
  stopPropagationOnToggle = true,
  onToggle,
  resetKey,
}) => {
  const { t } = useTranslation();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showSeeMore, setShowSeeMore] = React.useState(false);

  // Reset expansion only when resetKey changes
  React.useEffect(() => {
    if (resetKey !== undefined) {
      setIsExpanded(false);
    }
  }, [resetKey]);

  // Measure overflow when clamped
  React.useEffect(() => {
    if (isExpanded) return;
    const measure = () => {
      const el = contentRef.current;
      if (!el) return;
      const delta = el.scrollHeight - el.clientHeight;
      setShowSeeMore(delta > 3);
    };

    const id = window.requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
    };
  }, [resetKey, isExpanded]);

  const handleExpand = (e: React.MouseEvent) => {
    if (stopPropagationOnToggle) e.stopPropagation();
    setIsExpanded(true);
    onToggle?.(true);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    if (stopPropagationOnToggle) e.stopPropagation();
    setIsExpanded(false);
    onToggle?.(false);
  };

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`whitespace-pre-wrap ${contentClassName} ${isExpanded ? '' : clampClassName}`}
      >
        {children}
      </div>
      {showSeeMore && (
        <div className="mt-1">
          {!isExpanded ? (
            <button className="text-blue-600 text-sm font-medium hover:underline" onClick={handleExpand}>
              {t('See more')}
            </button>
          ) : (
            <button className="text-blue-600 text-sm font-medium hover:underline" onClick={handleCollapse}>
              {t('See less')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableText;
