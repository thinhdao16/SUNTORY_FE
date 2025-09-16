import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import FeedHeader from './FeedHeader';
import { useFeedLayout } from './useFeedLayout';
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const Feed: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { type, storyId, infoRoom } = useParams<{ type?: string; storyId?: string; infoRoom?: string }>();
  const [search, setSearch] = useState('');

  const goTo = (path: string) => history.push(path);
  const { contentComponent, leftIcon, rightIcon, inputOnFocus } = useFeedLayout(type, goTo, () => {}, infoRoom);
  
  const isNative = Capacitor.isNativePlatform();
  
  const handleQR = () => {
    if (isNative) {
      goTo('/social-qr-native');
    } else {
      goTo('/social-qr-web');
    }
  };
  
  return (
    <>
      <div className={`${type === "camera" ? "h-screen" : "bg-white min-h-screen"} `}>
        {(type === 'search' || type === 'search-result' || type === undefined) && (
          <FeedHeader
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            inputOnFocus={inputOnFocus}
            goTo={goTo}
            setSearch={setSearch}
            search={search}
            handleQR={handleQR}
            type={type || "recent"}
          />
        )}
        
        {/* Tab navigation for main story view */}
        {type === undefined && (
          <div className="px-4 pt-2 pb-4">
            <div className="flex bg-gray-100 rounded-full p-1">
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => history.push('/social-feed')}
                className="flex-1 py-2 px-4 text-center font-medium text-sm bg-white rounded-full shadow-sm"
              >
                {t("Everyone")}
              </motion.button>
              
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => {}}
                className="flex-1 py-2 px-4 text-center font-medium text-sm text-gray-600"
              >
                {t("Your friends")}
              </motion.button>
              
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => {}}
                className="flex-1 py-2 px-4 text-center font-medium text-sm text-gray-600"
              >
                {t("For you")}
              </motion.button>
              
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => {}}
                className="flex-1 py-2 px-4 text-center font-medium text-sm text-gray-600"
              >
                {t("#healthy")}
              </motion.button>
            </div>
          </div>
        )}
        
        {contentComponent}
      </div>
    </>
  );
}

export default Feed;
