import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import FeedHeader from './FeedHeader';
import { useFeedLayout } from './useFeedLayout';
import { motion } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const Feed: React.FC = () => {
  const history = useHistory();
  const { type, feedId, infoFeed, tabName } = useParams<{ type?: string; feedId?: string; infoFeed?: string; tabName?: string }>();
  
  const actualTabName = type === 'recent' ? feedId : tabName;
  const [search, setSearch] = useState('');
  const { contentComponent, leftIcon, rightIcon, inputOnFocus } = useFeedLayout(type, (p) => history.push(p), () => { }, infoFeed, actualTabName);
  const isNative = Capacitor.isNativePlatform();
  const handleQR = () => history.push(isNative ? '/social-qr-native' : '/social-qr-web');
  
  return (
    <>
    <div className={`${type === "camera" ? "h-screen" : "bg-white h-screen flex flex-col"} `}>
      {( type === 'search-result' || type === undefined || type === "recent") && (
        <FeedHeader
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          inputOnFocus={inputOnFocus}
          goTo={(p) => history.push(p)}
          setSearch={setSearch}
          search={search}
          handleQR={handleQR}
          type={type || "recent"}
        />
      )}

        {contentComponent}
    </div>
    </>
  );
}

export default Feed;
