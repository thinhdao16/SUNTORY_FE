import React, { useEffect } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChatSidebarProps } from "./ChatSidebar-types";
import { useUserChatsByTopicSearch } from "@/pages/Chat/hooks/useChat";
import { useChatStore } from "@/store/zustand/chat-store";
import { groupChatsByDate } from "@/utils/group-chats-by-date";
import dayjs from "dayjs";

const sidebarVariants: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 35 },
  },
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onSearch,
  onNewChat,
  onSelectChat,
  userName = "John",
  isOpen = true,
  onClose,
  sessionId,
  history
}) => {
  const [search, setSearch] = React.useState("");
  const { isLoading } = useUserChatsByTopicSearch(undefined, search);
  const chats = useChatStore((s) => s.chats);
  const groupedChats = React.useMemo(
    () => {
      const grouped = groupChatsByDate(chats);
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => dayjs(b.createDate).valueOf() - dayjs(a.createDate).valueOf());
      });
      return Object.fromEntries(
        Object.entries(grouped)
          .sort(([dateA], [dateB]) => labelToTimestamp(dateB) - labelToTimestamp(dateA))
      );
    },
    [chats]
  );
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);


  return (
    <>
      {isOpen && (
        <motion.div
          className="w-[300px] max-w-full h-full bg-white "
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ paddingTop: "var(--safe-area-inset-top)" }}
        >
          <div className="flex flex-col h-full w-full  py-5">
            <div className="px-6">
              <div className="flex gap-2 mb-4 ">
                <div className="flex-1 flex items-center bg-[#EDF1FC] rounded-lg px-3">
                  <img
                    src="/logo/chat/search.svg"
                    alt={t("search")}
                    className="w-4 h-4 mr-2"
                  />
                  <input
                    type="text"
                    placeholder={t("Search")}
                    value={search}
                    onChange={handleSearch}
                    className="bg-transparent outline-none flex-1 py-2 placeholder:text-netural-300"
                  />
                </div>
                <button className="bg-main rounded-lg px-3 py-2" onClick={onNewChat}>
                  <img
                    src="/logo/chat/filter.svg"
                    alt={t("new chat")}
                  />
                </button>
              </div>
              <button
                className="flex items-center gap-2 bg-[#EDF1FC] rounded-lg px-3 py-2 mb-4 w-full "
                onClick={onNewChat}
              >
                <img src="/logo/chat/new_chat.svg" alt={t("new chat")} className="w-4 h-4" />
                <span className="text-netural-300 font-medium">{t("New Chat")}</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-6 pl-2">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loader border-2 border-main border-t-transparent rounded-full w-8 h-8 animate-spin"></span>
                </div>
              ) : (
                Object.entries(groupedChats).map(([label, chats]) => (
                  <div className=" py-3" key={label}>
                    <div className="text-sm text-netural-300 font-semibold py-2 pl-4">{t(label)}</div>
                    {chats.map((item: any) => (
                      <div
                        key={item.fakeId ?? item.id}
                        className={
                          "cursor-pointer hover:bg-gray-50 rounded-lg py-2 pl-4" +
                          (sessionId && item.code === sessionId
                            ? " bg-netural-50 "
                            : "")
                        }
                        onClick={() => onSelectChat?.(item)}
                      >
                        <span
                          className="font-medium block max-w-[250px] truncate"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 pl-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-main">
                {userName?.[0]?.toUpperCase() || "J"}
              </div>
              <span className="font-medium">{userName}</span>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

function labelToTimestamp(label: string) {
  if (label === "Today") return dayjs().valueOf();
  if (label === "Yesterday") return dayjs().subtract(1, "day").valueOf();
  // "5 days ago"
  const match = label.match(/^(\d+)\s+days\s+ago$/);
  if (match) return dayjs().subtract(Number(match[1]), "day").valueOf();
  // Nếu là ISO date
  if (dayjs(label).isValid()) return dayjs(label).valueOf();
  return 0;
}

export default ChatSidebar;
