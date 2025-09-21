import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import QRIcon from '@/icons/logo/social-chat/qr.svg?react';
import UserPlusIcon from '@/icons/logo/social-chat/user-plus.svg?react';
import PartnerIcon from '@/icons/logo/social-chat/partner.svg?react';
import GroupIcon from '@/icons/logo/social-chat/group.svg?react';
import React from 'react';

interface SocialChatHeaderProps {
    leftIcon: React.ReactNode;
    rightIcon: React.ReactNode;
    inputOnFocus: () => void;
    goTo: (path: string) => void;
    setSearch: (value: string) => void;
    search: string;
    handleQR: () => void;
    type: string
}

const SocialChatHeader = ({ leftIcon, rightIcon, inputOnFocus, goTo, setSearch, search, handleQR, type }: SocialChatHeaderProps) => (
    <div className="flex items-center justify-between py-6 px-4">
        {type === "search" && (
                <>
                {leftIcon}
                </>
        )}

        <div className="flex items-center flex-grow bg-chat-to rounded-lg px-4 py-2 mr-2 gap-2">
            {type !== "search" && leftIcon}
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search")}
                className="bg-transparent outline-none  flex-grow"
                onFocus={inputOnFocus}
            />
            {rightIcon}
        </div>
        <div className="justify-center flex items-center gap-3 ">
            <button type='button' onClick={handleQR}>
                <QRIcon />

            </button>
            <Popover className="flex">
                {({ close }) => (
                    <>
                        <PopoverButton className="focus:outline-none ">
                            <UserPlusIcon />
                        </PopoverButton>

                        <PopoverPanel
                            anchor="bottom end"
                            className="w-50 bg-white shadow-[0px_2px_2px_2px_#0000001A] transition duration-200 ease-in-out [--anchor-gap:--spacing(2)] data-closed:-translate-y-1 data-closed:opacity-0 rounded-lg"
                        >
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        close();
                                        goTo('/social-partner/add');
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-netural-500 border-b-[0.5px] border-netural-50 transition"
                                >
                                    {t("Add Partner")}
                                    <PartnerIcon />
                                </button>
                                <button
                                    onClick={() => {
                                        close();
                                        goTo('/social-group/add');
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-netural-500 border-b-[0.5px] border-netural-50 transition"
                                >
                                    {t("Add Group")}
                                    <GroupIcon />
                                </button>
                            </div>
                        </PopoverPanel>
                    </>
                )}
            </Popover>

        </div>
    </div>
);

export default SocialChatHeader;