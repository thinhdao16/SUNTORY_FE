import React from "react";
import { useTranslation } from "react-i18next";
import BottomSheet from "./BottomSheet";
import { PrivacyPostType } from "@/types/privacy";
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react"
import FriendIcon from "@/icons/logo/social-feed/friend-default.svg?react"
import LockIcon from "@/icons/logo/social-feed/lock-default.svg?react"
interface PrivacyBottomSheetProps {
    isOpen: boolean;
    closeModal: () => void;
    selectedPrivacy: PrivacyPostType;
    onSelectPrivacy: (privacy: PrivacyPostType) => void;
}

const PrivacyBottomSheet: React.FC<PrivacyBottomSheetProps> = ({
    isOpen,
    closeModal,
    selectedPrivacy,
    onSelectPrivacy
}) => {
    const { t } = useTranslation();

    const privacyOptions = [
        {
            id: PrivacyPostType.Public,
            label: t("Everyone"),
            icon: <GlobalIcon />
        },
        {
            id: PrivacyPostType.Friend,
            label: t("Friends"),
            icon: <FriendIcon />
        },
        {
            id: PrivacyPostType.Private,
            label: t("Private"),
            icon: <LockIcon />
        }
    ];
    const handleSelect = (privacyId: PrivacyPostType) => {
        onSelectPrivacy(privacyId);
        closeModal();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={closeModal}
            title={null}
            showCloseButton={false}
            classNameContainer="!bg-netural-50"
        >
            <div className="space-y-0 bg-white rounded-2xl px-4">
                {privacyOptions.map((option, index) => (
                    <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={`w-full flex items-center justify-between py-4 transition-colors ${
                            index !== privacyOptions.length - 1 ? 'border-b border-gray-100' : ''
                        } hover:bg-gray-50`}
                    >
                        <div className="font-medium text-gray-900 text-left">{option.label}</div>
                        <div className="flex-shrink-0">{option.icon}</div>
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
};

export default PrivacyBottomSheet;
