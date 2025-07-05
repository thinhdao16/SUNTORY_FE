import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useChatStore } from "@/store/zustand/chat-store";
import { TopicType } from "@/constants/topicType";
import { useSignalRChatStore } from "@/store/zustand/signalr-chat-store";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import HomeIcon from "@/icons/logo/footer/home.svg?react";
import HomeActiveIcon from "@/icons/logo/footer/home_active.svg?react";
import ChatIcon from "@/icons/logo/footer/chat.svg?react";
import ChatActiveIcon from "@/icons/logo/footer/chat_active.svg?react";
import ProfileIcon from "@/icons/logo/footer/profile.svg?react";
import ProfileActiveIcon from "@/icons/logo/footer/profile_active.svg?react";
import TranslationIcon from "@/icons/logo/footer/translation.svg?react";
import TranslationActiveIcon from "@/icons/logo/footer/translation_active.svg?react";
import { useKeyboardResize } from "@/pages/Chat/hooks/useKeyboardResize";

interface TabItem {
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconActive: React.FC<React.SVGProps<SVGSVGElement>>;
    path: string;
    activePath?: string | ((pathname: string) => boolean);
    className?: string;
    classNameIcon?: string;
}

const BottomTabBar: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const history = useHistory();
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const { keyboardResizeScreen } = useKeyboardResize();

    const tabs: TabItem[] = [
        {
            label: "Home",
            icon: HomeIcon,
            iconActive: HomeActiveIcon,
            path: "/home",
            activePath: "/home",
            classNameIcon: "h-6",
        },
        {
            label: "JetAI",
            icon: ChatIcon,
            iconActive: ChatActiveIcon,
            path: `/chat/${TopicType.Chat}`,
            activePath: (pathname: string) => pathname.startsWith("/chat"),
            className: "gap-[5px]",
            classNameIcon: "h-6",
        },
        // {
        //     label: "Translation",
        //     icon: TranslationIcon,
        //     iconActive: TranslationActiveIcon,
        //     path: "/translate",
        //     activePath: (pathname: string) => pathname.startsWith("/translate"),
        //     classNameIcon: "h-6",
        // },
        {
            label: t("Profile"),
            icon: ProfileIcon,
            iconActive: ProfileActiveIcon,
            path: "/profile",
            activePath: (pathname: string) => pathname.startsWith("/profile"),
            classNameIcon: "h-6",
        },
    ];

    const clearAll = () => {
        useChatStore.getState().clearPendingMessages();
        useChatStore.getState().clearMessages();
        useChatStore.getState().setStopMessages(true);
        useSignalRChatStore.getState().setMessages([]);
    };

    useEffect(() => {
        let initialHeight = window.innerHeight;

        const isDesktop = () => window.innerWidth > 1024;

        const handleResize = () => {
            if (isDesktop()) {
                setKeyboardOpen(false);
                return;
            }
            const heightDiff = initialHeight - window.innerHeight;
            setKeyboardOpen(heightDiff > 150);
        };

        const handleFocus = () => {
            if (!isDesktop()) setKeyboardOpen(true);
        };
        const handleBlur = () => {
            if (!isDesktop()) setKeyboardOpen(false);
        };

        window.addEventListener("resize", handleResize);

        document.addEventListener("focusin", (e) => {
            if (
                (e.target instanceof HTMLInputElement &&
                    e.target.type !== "button" &&
                    e.target.type !== "submit") ||
                e.target instanceof HTMLTextAreaElement
            ) {
                handleFocus();
            }
        });
        document.addEventListener("focusout", (e) => {
            if (
                (e.target instanceof HTMLInputElement &&
                    e.target.type !== "button" &&
                    e.target.type !== "submit") ||
                e.target instanceof HTMLTextAreaElement
            ) {
                handleBlur();
            }
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("focusin", handleFocus);
            document.removeEventListener("focusout", handleBlur);
        };
    }, []);

    return (
        <AnimatePresence>
            {!keyboardOpen && !keyboardResizeScreen && (
                <motion.div
                    key="bottom-tab-bar"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 bg-white shadow-[0px_-3px_10px_0px_#0000000D] flex justify-between pt-4 pb-6 px-8 z-[101] rounded-t-3xl"
                >
                    {tabs.map((tab) => {
                        const isActive =
                            typeof tab.activePath === "function"
                                ? tab.activePath(location.pathname)
                                : location.pathname === tab.activePath;
                        const Icon = isActive ? tab.iconActive : tab.icon;
                        return (
                            <button
                                key={tab.label}
                                onClick={() => {
                                    clearAll();
                                    history.push(tab.path);
                                    useChatStore.getState().setIsSending(false);
                                }}
                                className={`flex flex-col items-center gap-2 justify-end text-sm ${tab.className
                                    } ${isActive ? "text-main" : "text-black"}`}
                            >
                                <Icon className={tab.classNameIcon} />
                                <span className="text-[8px] font-bold ">{t(tab.label)}</span>
                            </button>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BottomTabBar;
