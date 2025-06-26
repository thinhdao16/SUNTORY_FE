import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { t } from "@/lib/globalT";
import { useChatStore } from "@/store/zustand/chat-store";
import { TopicType } from "@/constants/topicType";
interface TabItem {
    label: string;
    icon: string;
    iconActive: string;
    path: string;
    activePath?: string | ((pathname: string) => boolean);
    className?: string;
    classNameIcon?: string;
}

const tabs: TabItem[] = [
    {
        label: t("Home"),
        icon: "logo/footer/home.svg",
        iconActive: "logo/footer/home_active.svg",
        path: "/home",
        activePath: "/home",
        classNameIcon: "h-6",
    },
    {
        label: t("Chat"),
        icon: "logo/footer/chat.svg",
        iconActive: "logo/footer/chat_active.svg",
        path: `/chat/${TopicType.Chat}`,
        activePath: (pathname: string) => pathname.startsWith("/chat"),
        className: "gap-[5px]",
        classNameIcon: "h-6",
    },
    // {
    //     label: t("Translation"),
    //     icon: "logo/footer/translation.svg",
    //     iconActive: "logo/footer/translation_active.svg",
    //     path: "/translate",
    //     activePath: (pathname: string) => pathname.startsWith("/translate"),
    //     classNameIcon: "h-6",
    // },
    {
        label: t("Profile"),
        icon: "logo/footer/profile.svg",
        iconActive: "logo/footer/profile_active.svg",
        path: "/profile",
        activePath: "/profile",
        classNameIcon: "h-6",
    },
];

const BottomTabBar: React.FC = () => {
    const location = useLocation();
    const history = useHistory();

    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const clearPendingMessages = useChatStore((s) => s.clearPendingMessages);

    useEffect(() => {
        let initialHeight = window.innerHeight;

        const handleResize = () => {
            const heightDiff = initialHeight - window.innerHeight;
            setKeyboardOpen(heightDiff > 150);
        };

        const handleFocus = () => setKeyboardOpen(true);
        const handleBlur = () => setKeyboardOpen(false);

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

    if (keyboardOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0px_-3px_10px_0px_#0000000D] flex justify-between pt-4 pb-6 px-8 z-[101] rounded-t-3xl">
            {tabs.map((tab) => {
                const isActive =
                    typeof tab.activePath === "function"
                        ? tab.activePath(location.pathname)
                        : location.pathname === tab.activePath;
                return (
                    <button
                        key={tab.label}
                        onClick={() => {
                            clearPendingMessages();
                            history.push(tab.path);
                            useChatStore.getState().setIsSending(false);
                        }}
                        className={`flex flex-col items-center gap-2 justify-end text-sm ${tab.className
                            } ${isActive ? "text-main" : "text-black"}`}
                    >
                        <img
                            src={isActive ? tab.iconActive : tab.icon}
                            className={tab.classNameIcon}
                        />
                        <span className="text-[8px] font-bold ">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomTabBar;
