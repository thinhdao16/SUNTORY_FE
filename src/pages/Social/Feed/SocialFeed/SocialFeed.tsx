// SocialFeed.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useHistory, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedHeader from '../FeedHeader';
import { useFeedLayout } from '../useFeedLayout';
import { SocialFeedList } from '../SocialFeedList/SocialFeedList';
import { useScrollHeader } from '@/hooks/useScrollHeader';

const SocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { type, storyId, infoRoom } = useParams<{ type?: string; storyId?: string; infoRoom?: string }>();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Everyone');

  const { scrollContainerRef } = useScrollHeader({ threshold: 5 });
  const { contentComponent, leftIcon, rightIcon, inputOnFocus } = useFeedLayout(type, (p)=>history.push(p), ()=>{}, infoRoom);

  const isNative = Capacitor.isNativePlatform();

  const handleQR = () => history.push(isNative ? '/social-qr-native' : '/social-qr-web');

  return (
    <div className={`${type === "camera" ? "h-screen" : "bg-white h-screen flex flex-col"} `}>
      {(type === 'search' || type === 'search-result' || type === undefined) && (
        <FeedHeader
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          inputOnFocus={inputOnFocus}
          goTo={(p)=>history.push(p)}
          setSearch={setSearch}
          search={search}
          handleQR={handleQR}
          type={type || "recent"}
        />
      )}
      
      {type === undefined && (
      // bên trong SocialFeed.tsx – thay cả khối <div className="px-4 py-3">...</div>
<div className="px-4 py-3">
  {/* scroller ngang */}
  <div className="overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="px-4 flex items-center gap-6 whitespace-nowrap">
      {['Everyone', 'Your friends', 'For you', '#foodvideo', '#healthy'].map((label) => {
        const isHash = label.startsWith('#');
        const active = activeTab === label;

        // style theo Figma (đổi màu tại đây)
        const base = 'flex-none inline-flex items-center h-9 text-sm font-medium transition-colors';
        const textIdle = 'text-[#111827]';            // màu text bình thường
        const pillActive = 'px-3 rounded-full bg-[#ECEEF1] text-[#0B0F1A]'; // nền + text khi active tag
        const textLink = 'text-[#0B0F1A]';            // màu tag chưa active
        const hover = 'hover:opacity-80';

        const cls =
          base + ' ' + hover + ' ' +
          (isHash
            ? (active ? pillActive : textLink)
            : (active ? 'text-[#0B0F1A]' : textIdle));

        return (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={cls}
            type="button"
          >
            <span className="whitespace-nowrap">{t(label)}</span>

            {/* Khi là tag và đang active -> hiện nút × */}
            {isHash && active && (
              <span
                onClick={(e) => { e.stopPropagation(); setActiveTab('Everyone'); }}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#D1D5DB] text-[#111827] text-[10px] leading-none"
                aria-label="Clear"
              >
                ×
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
</div>

      )}
      
      {type === undefined ? (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-16"
        >
          <SocialFeedList className="bg-white" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {contentComponent}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
