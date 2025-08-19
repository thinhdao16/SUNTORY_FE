import { useHistory, useParams } from 'react-router-dom';
import SocialChatHeader from './SocialChatHeader';
import { useSocialChatLayout } from './useSocialChatLayout';
import { motion } from "framer-motion";
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { Capacitor } from '@capacitor/core';
import { useKeyboardResize } from '@/hooks/useKeyboardResize';
function ChatSocial() {
  const history = useHistory();
  const { type } = useParams<{ type?: string }>();
  const goTo = (path: string) => history.push(path);
  const { setSearch, clearSearch, search } = useSocialChatStore();
  const { contentComponent, leftIcon, rightIcon, inputOnFocus } = useSocialChatLayout(type, goTo, clearSearch);
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
        {(type === 'search' || type === 'search-result' || type === undefined || type === "recent/search-result" || type === "list-request") && (
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
          <div className="px-6">
            <div className="flex justify-center bg-netural-50 rounded-full border-[1px] border-neutral-50">
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => history.push('/social-chat')}
                className={`p-2 w-full font-semibold rounded-full mr-2 text-sm transition-colors duration-200 ${type === undefined ? 'bg-white shadow' : ''}`}
              >
                {t("Chat List")}
              </motion.button>
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => history.push('/social-chat/list-request')}
                className={`p-2 w-full font-semibold rounded-full text-sm transition-colors duration-200 ${type === 'list-request' ? 'bg-white shadow' : ''}`}
              >
                {t("Request List")}
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
