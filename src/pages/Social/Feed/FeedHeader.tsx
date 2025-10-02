import React from 'react';
import { useTranslation } from 'react-i18next';
import NewAction from "@/icons/logo/new_action.svg?react"
import { useAuthStore } from '@/store/zustand/auth-store';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";

interface FeedHeaderProps {
    leftIcon: React.ReactNode;
    rightIcon: React.ReactNode;
    inputOnFocus: () => void;
    goTo: (path: string) => void;
    setSearch: (value: string) => void;
    search: string;
    handleQR: () => void;
    type: string
}

const FeedHeader = ({ leftIcon, rightIcon, inputOnFocus, goTo, setSearch, search, handleQR, type }: FeedHeaderProps) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    return (
        <div className="flex items-center justify-between px-4 py-2 gap-3">
            {type === "search" ? (
                <>
                    {leftIcon}
                </>
            ) : (
                <img
                    src={user?.avatarLink || avatarFallback}
                    alt={user?.name}
                    className="w-9 h-9  rounded-2xl object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = avatarFallback;
                    }}
                />
            )}

            <div className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 gap-2">
                {type !== "search" && leftIcon}
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("Search")}
                    className="bg-transparent outline-none  flex-grow"
                    onFocus={inputOnFocus}
                />
                {rightIcon}
            </div>
            <div className="justify-center flex items-center">
                {type !== "search" && <button
                    type='button'
                    onClick={() => goTo('/social-feed/create')}
                    className="rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <NewAction className='w-6 h-6' />
                </button> }
            </div>
        </div>
    );
};

export default FeedHeader;