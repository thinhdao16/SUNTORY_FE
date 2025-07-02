import ChatSidebar from "@/components/sidebar/ChatSidebar";
import { useUiStore } from "@/store/zustand/ui-store";
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHistory, useLocation } from "react-router";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { TopicType } from "@/constants/topicType";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";
import NavBarHomeIcon from "@/icons/logo/nav_bar_home.svg?react";

const ChatSidebarLayout: React.FC = () => {
  const { isChatSidebarOpen, closeChatSidebar } = useUiStore();
  const { data: userInfo } = useAuthInfo();
  const history = useHistory();
  const location = useLocation();
  const match = location.pathname.match(/\/chat\/[^/]+\/([^/]+)/);
  const sessionId = match ? match[1] : undefined;

  const handleNewChat = () => {
    closeChatSidebar();
    history.push(`/chat/${TopicType.Chat}`);
  }
  const handleSelectChat = (chat: { type: string; code: string; topic: string }) => {
    closeChatSidebar();
    history.push(`/chat/${chat.topic}/${chat.code}`);
  };
  useEffect(() => {
    if (isChatSidebarOpen) {
      document.body.classList.add("overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [isChatSidebarOpen]);


  return (
    <div className="min-h-[100vh] w-[100vw] relative">
      <AnimatePresence>
        {isChatSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-[102] flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="absolute top-12 right-6">
              <div
              // style={{
              //   paddingTop: "var(--safe-area-inset-top, 0px)",
              // }}
              >
                {location.pathname === "/home" ? (
                  <NavBarHomeIcon />
                ) : (
                  <NavBarHomeHistoryIcon />
                )}
              </div>
            </div>
            <div
              className="absolute inset-0 bg-[#f0f0f0]/85"
              onClick={closeChatSidebar}
            />
            <div className="relative z-10 max-w-full h-full w-[300px]">
              <ChatSidebar
                history={[]}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                userName={userInfo?.name || "User"}
                isOpen={true}
                onClose={closeChatSidebar}
                sessionId={sessionId}
                userAvatar={userInfo?.avatarLink}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSidebarLayout;
