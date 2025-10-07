import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import SocialChatHeader from './SocialChatHeader';
import { useSocialChatLayout } from './useSocialChatLayout';
import { motion } from "framer-motion";
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';


function ChatSocial() {
  const { t } = useTranslation();
  const history = useHistory();
  const { type, roomId, infoRoom } = useParams<{ type?: string; roomId?: string; infoRoom?: string }>();
  const goTo = (path: string) => history.push(path);
  const { setSearch, clearSearch, search, notificationCounts } = useSocialChatStore();
  const { contentComponent, leftIcon, rightIcon, inputOnFocus } = useSocialChatLayout(
    type,
    goTo,
    clearSearch,
    infoRoom
  );
  const isNative = Capacitor.isNativePlatform();
  const handleQR = () => {
    if (isNative) {
      history.push('/social-qr-native');
    } else {
      history.push('/social-qr-web');
    }
  };

  return (
    <>
      <div className={`${type === "camera" ? "h-screen" : "bg-white"} `}>
        {(type === 'search' || type === 'search-result' || type === undefined || type === "recent/search-result" || type === "list-request" || type === "recent") && (
          <SocialChatHeader
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
        {(type === undefined || type === 'list-request') && (
          <div className="px-4">
            <div className="flex justify-center bg-netural-50 rounded-full border-[1px] border-neutral-50">
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => history.push('/social-chat')}
                className={`p-2 w-full flex  justify-center items-center gap-2 font-semibold rounded-full text-sm transition-colors duration-200 ${type === undefined ? 'bg-white shadow' : ''}`}
              >
                {t("Chats")}
                {notificationCounts.unreadRoomsCount > 0 && (
                  <button className={` ${type === undefined ? 'bg-error-500' : 'bg-error-500'} flex items-center justify-center min-w-[16px] min-h-[16px] aspect-square p-1 rounded-full text-white text-[8.53px]`}>
                    {notificationCounts.unreadRoomsCount > 99 ? '99+' : notificationCounts.unreadRoomsCount}
                  </button>
                )}
              </motion.button>

              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => history.push('/social-chat/list-request')}
                className={` p-2 w-full flex  justify-center items-center gap-2 font-semibold rounded-full text-sm transition-colors duration-200 ${type === 'list-request' ? 'bg-white shadow' : ''}`}
              >
                {t("Suggestions")}
              </motion.button>
            </div>

          </div>
        )}
        {contentComponent}
      </div>
    </>
  );
}

export default ChatSocial;
