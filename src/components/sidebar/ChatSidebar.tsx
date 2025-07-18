import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChatSidebarProps } from "./ChatSidebar-types";
import { useUserChatsByTopicSearch } from "@/pages/Chat/hooks/useChat";
import { useChatStore } from "@/store/zustand/chat-store";
import { groupChatsByDate } from "@/utils/group-chats-by-date";
import dayjs from "dayjs";
import { TopicType, TopicTypeLabel } from "@/constants/topicType";

// Import SVG as React component
import SearchIcon from "@/icons/logo/chat/search.svg?react";
import BotIcon from "@/icons/logo/AI.svg?react";
import NewChatIcon from "@/icons/logo/chat/new_chat.svg?react";
import MedicalSupportIcon from "@/icons/logo/chat/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/chat/contract_translation.svg?react";
import DrugInstructionsIcon from "@/icons/logo/chat/product_information.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/chat/food_discovery.svg?react";
import "./ChatSidebar.module.css"
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
  currentTopicType,
  onClose,
  sessionId,
  history,
  userAvatar = "",
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicType | "all">(50);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isJetAIExpanded, setIsJetAIExpanded] = useState(false);

  const { isLoading } = useUserChatsByTopicSearch(
    selectedTopic === "all" ? undefined : selectedTopic,
    search
  );
  const chats = useChatStore((s) => s.chats);

  const topicOptions = [
    { value: "all", label: t("All") },
    ...Object.entries(TopicTypeLabel).map(([key, label]) => ({
      value: key,
      label: t(label),
    })),
  ];

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

  const quickAccessItems = [
    {
      icon: MedicalSupportIcon,
      label: "Medical Support",
      topicType: TopicType.MedicalSupport,
    },
    {
      icon: DocumentTranslationIcon,
      label: "Document Translation",
      topicType: TopicType.DocumentTranslation,
    },
    {
      icon: DrugInstructionsIcon,
      label: "Drug Instructions",
      topicType: TopicType.DrugInstructions,
    },
    {
      icon: FoodDiscoveryIcon,
      label: "Food Discovery",
      topicType: TopicType.FoodDiscovery,
    },

  ];

  return (
    <>
      {isOpen && (
        <motion.div
          className="w-[300px] max-w-full h-full bg-white flex flex-col"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ paddingTop: "var(--safe-area-inset-top)" }}
          onAnimationComplete={() => setShowAvatar(true)}
        >
          {/* Fixed Header Section */}
          <div className="flex-shrink-0 px-4 py-5">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 flex items-center bg-[#EDF1FC] rounded-lg pl-3">
                <SearchIcon className="w-4 h-4 mr-2" aria-label={t("search")} />
                <input
                  type="text"
                  placeholder={t("Search")}
                  value={search}
                  onChange={handleSearch}
                  className="bg-transparent outline-none flex-1 py-2 placeholder:text-netural-300"
                />
              </div>
              <button onClick={onNewChat}>
                <NewChatIcon className="w-7 h-7" aria-label={t("new chat")} />
              </button>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="flex flex-col gap-2">
              {/* JETAI Button with expand/collapse */}
              <div className="w-full">
                <button
                  className={`flex items-center justify-between text-left w-full px-1 py-2 rounded-md transition ${String(TopicType.Chat) === String(currentTopicType) ? "bg-chat-to" : "bg-white hover:bg-gray-50"
                    }`}
                  onClick={() => {
                    setIsJetAIExpanded(!isJetAIExpanded);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <BotIcon className="flex-shrink-0 w-[30px] h-[30px]" />
                    <span className="font-medium uppercase">{t("JETAI")}</span>
                  </div>
                  {/* Collapse/Expand Arrow */}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isJetAIExpanded ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Chat History */}
                {isJetAIExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-chat-to rounded-xl mt-2 max-h-[200px] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <span className="loader border-2 border-main border-t-transparent rounded-full w-8 h-8 animate-spin"></span>
                        </div>
                      ) : (
                        Object.entries(groupedChats).map(([label, chats]) => (
                          <div className="py-3 space-y-2" key={label}>
                            <div className="text-sm text-netural-300 font-semibold pl-4">
                              {t(label)}
                            </div>
                            {chats.map((item: any) => (
                              <div
                                key={item.fakeId ?? item.id}
                                className={
                                  "cursor-pointer hover:bg-gray-50 rounded-lg py-2 pl-4 mr-2" +
                                  (sessionId && item.code === sessionId
                                    ? " bg-netural-50 "
                                    : "")
                                }
                                onClick={() => onSelectChat?.(item)}
                              >
                                <span
                                  className="font-medium block max-w-[220px] truncate text-sm"
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
                  </motion.div>
                )}
              </div>

              {/* Other Quick Access Items */}
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const isActive = String(item.topicType) === String(currentTopicType);

                return (
                  <button
                    key={item.topicType}
                    className={`flex items-center gap-3 text-left w-full px-1 py-2 rounded-md transition ${isActive ? "bg-chat-to" : "bg-white hover:bg-gray-50"
                      }`}
                    onClick={() => {
                      history.push(`/chat/${item.topicType}`);
                      onClose?.();
                    }}
                  >
                    <Icon className="flex-shrink-0 w-[30px] h-[30px]" />
                    <span className="font-medium uppercase text-sm">{t(item.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fixed Footer Section */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                history.push("/profile");
                onClose?.();
              }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-main overflow-hidden">
                {userAvatar && showAvatar ? (
                  <>
                    {!avatarLoaded && (
                      <img
                        src="/default-avatar.png"
                        alt="default"
                        className="w-full h-full object-cover rounded-full absolute"
                        style={{ zIndex: 1 }}
                      />
                    )}
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover rounded-full relative"
                      style={{ zIndex: 2 }}
                      onLoad={() => setAvatarLoaded(true)}
                      onError={() => setAvatarLoaded(false)}
                    />
                  </>
                ) : (
                  userName?.[0]?.toUpperCase() || "J"
                )}
              </div>
              <span className="font-medium text-sm">{userName}</span>
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
