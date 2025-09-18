import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '@/components/common/modals/ConfirmModal';

interface TabConfig {
  key: string;
  label: string;
  type: 'static' | 'hashtag';
}

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onHashtagDelete?: (hashtag: string) => void;
  isLoadingHashtags?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onHashtagDelete,
  isLoadingHashtags = false
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hashtagToDelete, setHashtagToDelete] = useState<string>('');

  const handleDeleteClick = (hashtag: string) => {
    setHashtagToDelete(hashtag);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (hashtagToDelete && onHashtagDelete) {
      onHashtagDelete(hashtagToDelete.replace('#', ''));
      onTabChange('everyone');
    }
    setShowDeleteConfirm(false);
    setHashtagToDelete('');
  };

  return (
    <div className=" py-3 w-full px-4">
      <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-6 whitespace-nowrap">
          {tabs.map((tab) => {
            const isHash = tab.type === 'hashtag';
            const active = activeTab === tab.key;
            const base = 'flex-none inline-flex items-center h-9 text-sm font-medium transition-colors';
            const textIdle = 'text-[#111827]';
            const pillActive = 'px-3 rounded-full bg-[#ECEEF1] text-[#0B0F1A]';
            const textLink = 'text-[#0B0F1A]';
            const hover = 'hover:opacity-80';
            const cls =
              base + ' ' + hover + ' ' +
              (isHash
                ? (active ? pillActive : textLink)
                : (active ? pillActive : textIdle));

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cls}
                type="button"
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                {isHash && active && (
                  <span
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(tab.key); }}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#D1D5DB] text-[#111827] text-[10px] leading-none hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                    aria-label="Delete hashtag"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {isLoadingHashtags && (
            <div className="flex-none inline-flex items-center h-9 text-sm text-gray-500">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>{t('Loading hashtags...')}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t("Delete hashtag")}
        message={t("You can always add it back by tapping on it.")}
        confirmText={t("Yes, delete")}
        cancelText={t("Cancel")}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
