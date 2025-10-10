import React, { useRef, useState, useEffect } from "react";
import { IonContent, IonPage, IonIcon, IonButton, IonTitle, IonButtons, IonHeader, IonToolbar } from "@ionic/react";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import PageContainer from "@/components/layout/PageContainer";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserPostsList from "./components/UserPostsList";
import UserMediaGrid from "./components/UserMediaGrid";
import { ProfileTabType } from "./hooks/useUserPosts";
import { useAuthStore } from "@/store/zustand/auth-store";
import { otherUserProfile } from "@/services/auth/auth-service";
import { useAcceptFriendRequest, useRejectFriendRequest, useSendFriendRequest, useUnfriend, useCancelFriendRequest } from "../SocialPartner/hooks/useSocialPartner";
import { useSocialSignalR } from "@/hooks/useSocialSignalR";
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { useQuery, useQueryClient } from 'react-query';
import { useCreateAnonymousChat } from "@/pages/SocialChat/hooks/useSocialChat";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";

import BackIcon from "@/icons/logo/back-default.svg?react";
import CoppyIcon from "@/icons/logo/coppy-default.svg?react";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import { useToastStore } from "@/store/zustand/toast-store";
import BottomSheet from "@/components/common/BottomSheet";
interface OtherUserProfileParams {
    userId: string;
    tab?: string;
}

const getTabType = (tabName: string): ProfileTabType => {
    switch (tabName) {
        case 'posts':
            return ProfileTabType.Posts;
        case 'media':
            return ProfileTabType.Media;
        case 'likes':
            return ProfileTabType.Likes;
        case 'reposts':
            return ProfileTabType.Reposts;
        default:
            return ProfileTabType.Posts;
    }
};

const TabNavigation: React.FC<{
    activeTab: string;
    onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();
    const tabs = [
        { key: "posts", label: t("Posts") },
        { key: "media", label: t("Media") },
        { key: "likes", label: t("Likes") },
        { key: "reposts", label: t("Reposts") }
    ];

    return (
        <div className="flex border-b border-gray-200 z-99 sticky top-0 bg-white">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === tab.key
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

const OtherUserProfile: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { userId, tab } = useParams<OtherUserProfileParams>();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState(tab || "posts");
    const [isFriendOptionsOpen, setIsFriendOptionsOpen] = useState(false);
    const [isCancelRequestOpen, setIsCancelRequestOpen] = useState(false);
    const [isRespondOptionsOpen, setIsRespondOptionsOpen] = useState(false);
    const { showToast } = useToastStore();
    const deviceInfo = useDeviceInfo();
    const queryClient = useQueryClient();
    const { setRoomChatInfo } = useSocialChatStore();
    const createAnonymousChatMutation = useCreateAnonymousChat();

    const targetUserId = parseInt(userId);

    const { data: userInfo, isLoading, refetch } = useQuery(
        ['otherUserProfile', targetUserId],
        () => otherUserProfile({ userId: targetUserId }),
        {
            enabled: !!targetUserId && user?.id !== targetUserId,
            select: (data) => ({
                id: targetUserId,
                name: data?.firstname + " " + data?.lastname,
                code: data?.code,
                avatarLink: data?.avatarLink,
                friendNumber: data?.friendNumber,
                country: { code: data?.country?.code },
                isFriend: data?.isFriend,
                isRequestSender: data?.isRequestSender,
                isRequestReceiver: data?.isRequestReceiver,
                roomChat: data?.roomChat,
                friendRequest: data?.friendRequest
            }),
            onError: (error) => {
                console.error('Failed to fetch user info:', error);
            }
        }
    );

    const sendFriendRequestMutation = useSendFriendRequest(showToast);
    const acceptFriendRequestMutation = useAcceptFriendRequest(showToast);
    const rejectFriendRequestMutation = useRejectFriendRequest(showToast);
    const cancelFriendRequestMutation = useCancelFriendRequest(showToast);
    const unfriendMutation = useUnfriend(showToast);

    const refetchUserData = async () => {
        if (targetUserId && user?.id !== targetUserId) {
            await refetch();
        }
    };

    useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: "",
        refetchRoomData: refetchUserData,
        autoConnect: true,
        enableDebugLogs: false,
    });

    useEffect(() => {
        if (user?.id === targetUserId) {
            history.replace('/my-profile');
            return;
        }
    }, [user?.id, targetUserId, history]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        history.replace(`/profile/${userId}/${tab}`);
    };

    const handleSendFriendRequest = async () => {
        try {
            await sendFriendRequestMutation.mutateAsync(targetUserId);
            showToast(t("Friend request sent."), 1000, "success");
        } catch (error) {
            console.error('Failed to send friend request:', error);
            showToast(t("Failed to send friend request"), 1000, "error");
        }
    };

    const handleAcceptFriendRequest = async () => {
        try {
            await acceptFriendRequestMutation.mutateAsync(userInfo?.friendRequest?.id || targetUserId);
            showToast(t("Friend request accepted."), 1000, "success");
            setIsRespondOptionsOpen(false);
        } catch (error) {
            console.error('Failed to accept friend request:', error);
            showToast(t("Failed to accept friend request"), 1000, "error");
        }
    };

    const handleDeclineFriendRequest = async () => {
        try {
            await rejectFriendRequestMutation.mutateAsync(userInfo?.friendRequest?.id || targetUserId);
            showToast(t("Friend request declined."), 1000, "success");
            setIsRespondOptionsOpen(false);
        } catch (error) {
            console.error('Failed to decline friend request:', error);
            showToast(t("Failed to decline friend request"), 1000, "error");
        }
    };

    const handleCancelFriendRequest = async () => {
        try {
            await cancelFriendRequestMutation.mutateAsync(userInfo?.friendRequest?.id || targetUserId);
            setIsCancelRequestOpen(false);
        } catch (error) {
            console.error('Failed to cancel friend request:', error);
        }
    };

    const handleUnfriend = async () => {
        try {
            await unfriendMutation.mutateAsync({ friendUserId: targetUserId });
            setIsFriendOptionsOpen(false);
        } catch (error) {
            console.error('Failed to unfriend:', error);
        }
    };

    const handleSendMessage = async () => {
        try {
            if (userInfo?.roomChat?.code) {
                setRoomChatInfo(userInfo?.roomChat);
                history.push(`/social-chat/t/${userInfo?.roomChat?.code}`);
            } else {
                setRoomChatInfo({
                    id: 0,
                    code: "",
                    title: userInfo?.name || "Anonymous",
                    avatarRoomChat: userInfo?.avatarLink || "/favicon.png",
                    type: 0,
                    status: 0,
                    createDate: new Date().toISOString(),
                    updateDate: new Date().toISOString(),
                    unreadCount: 0,
                    lastMessageInfo: null,
                    participants: [],
                    topic: null,
                    chatInfo: null,
                });
                history.push(`/social-chat/t`);
                const chatData = await createAnonymousChatMutation.mutateAsync(targetUserId);
                if (chatData?.chatCode) {
                    history.replace(`/social-chat/t/${chatData.chatCode}`);
                }
            }
        } catch (error) {
            console.error("Tạo phòng chat thất bại:", error);
        }
    };
    const renderTabContent = () => {
        const tabType = getTabType(activeTab);

        switch (activeTab) {
            case "posts":
                return (
                    <UserPostsList
                        tabType={ProfileTabType.Posts}
                        targetUserId={targetUserId}
                    />
                );
            case "media":
                return (
                    <UserMediaGrid
                        tabType={ProfileTabType.Media}
                        targetUserId={targetUserId}
                    />
                );
            case "likes":
                return (
                    <UserPostsList
                        tabType={ProfileTabType.Likes}
                        targetUserId={targetUserId}
                    />
                );
            case "reposts":
                return (
                    <UserPostsList
                        tabType={ProfileTabType.Reposts}
                        targetUserId={targetUserId}
                    />
                );
            default:
                return null;
        }
    };

    const renderActionButtons = () => {
        if (userInfo?.isFriend) {
            return (
                <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                    <button
                        className="flex-1 rounded-xl  py-2 text-main bg-primary-50"
                        onClick={() => setIsFriendOptionsOpen(true)}
                    >
                        {t('Friend')}
                    </button>
                    <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                        onClick={handleSendMessage}
                    >
                        {t('Message')}
                    </button>
                </div>
            );
        } else if (userInfo?.isRequestReceiver) {
            return (
                <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                    <button
                        className="flex-1 rounded-xl bg-main py-2 text-white font-medium"
                        onClick={() => setIsRespondOptionsOpen(true)}
                    >
                        {t('Respond')}
                    </button>
                    <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                        onClick={handleSendMessage}
                    >
                        {t('Message')}
                    </button>
                </div>
            );
        } else if (userInfo?.isRequestSender) {
            return (
                <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                    <button
                        className="flex-1 rounded-xl border border-red-300 py-2 text-red-600 font-medium"
                        onClick={() => setIsCancelRequestOpen(true)}
                    >
                        {t('Cancel request')}
                    </button>
                    <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                        onClick={handleSendMessage}
                    >
                        {t('Message')}
                    </button>
                </div>
            );
        } else {
            return (
                <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                    <button
                        className="flex-1 rounded-xl bg-main py-2 text-white font-medium"
                        onClick={handleSendFriendRequest}
                        disabled={sendFriendRequestMutation.isLoading}
                    >
                        {t('Add Friend')}
                    </button>
                    <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                        onClick={handleSendMessage}
                    >
                        {t('Message')}
                    </button>
                </div>
            );
        }
    };

    if (isLoading) {
        return (
            <PageContainer>
                <IonPage style={{ '--background': 'white', paddingBottom: '52px' } as any}>
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </IonPage>
            </PageContainer>
        );
    }

    if (!userInfo) {
        return (
            <PageContainer>
                <IonPage style={{ '--background': 'white', paddingBottom: '52px' } as any}>
                    <div className="flex justify-center items-center h-full">
                        <div className="text-gray-500">{t('User not found')}</div>
                    </div>
                </IonPage>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <IonPage style={{ '--background': 'white', paddingBottom: '52px' } as any}>
                <IonHeader className="ion-no-border" style={{ '--background': '#EDF1FC', '--ion-background-color': '#ffffff' } as any}>
                    <IonToolbar style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                        <IonButtons slot="start" className="pl-4">
                            <BackIcon onClick={() => history.goBack()} />
                        </IonButtons>
                        <div>
                            <span className="font-semibold max-w-[250px] truncate text-black pl-2" >
                                {userInfo?.name}
                            </span>
                        </div>
                    </IonToolbar>
                </IonHeader>
                <IonContent style={{ '--background': 'white', height: '100%' } as any}>
                    <div className="bg-white">
                        <hr className="border-gray-100" />
                        <div className="px-4 pt-4 pb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h1 className="text-[25px] font-bold text-gray-900 overflow-hidden max-w-[150px] truncate">
                                            {userInfo?.name}
                                        </h1>
                                        <span
                                            className={`fi fi-${userInfo?.country?.code?.toLowerCase() || 'us'} fis`}
                                            style={{ width: 20, height: 20, borderRadius: 9999 }}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-1 mb-2">
                                        <p className="text-black overflow-hidden max-w-[110px] truncate text-[15px]">
                                            @{userInfo?.code}
                                        </p>
                                        <CoppyIcon
                                            className="cursor-pointer"
                                            onClick={() => { navigator.clipboard.writeText(userInfo.code || "") }}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-1 mb-4">
                                        <p className="font-medium">
                                            {userInfo?.friendNumber}
                                        </p>
                                        <p className="mb-0 font-sans">
                                            {t("friends")}</p>
                                    </div>
                                </div>

                                <div className="relative ml-4">
                                    <img
                                        src={userInfo.avatarLink || avatarFallback}
                                        alt={userInfo?.name || 'User Avatar'}
                                        className="w-24 h-24 rounded-4xl object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = avatarFallback;
                                        }}
                                    />
                                </div>
                            </div>

                            {renderActionButtons()}
                        </div>
                        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                        <div className="flex-1">
                            {renderTabContent()}
                        </div>
                    </div>
                    <div style={{ height: 'calc(112px + env(safe-area-inset-bottom, 0px))' }} />
                </IonContent>

                <BottomSheet
                    isOpen={isFriendOptionsOpen}
                    onClose={() => setIsFriendOptionsOpen(false)}
                    title={userInfo?.name}
                >
                    <div className="p-4 space-y-3">
                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={handleUnfriend}
                            disabled={unfriendMutation.isLoading}
                        >
                            <span className="font-medium">{t('Unfriend')}</span>
                        </button>

                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setIsFriendOptionsOpen(false)}
                        >
                            <span className="font-medium">{t('Cancel')}</span>
                        </button>
                    </div>
                </BottomSheet>

                <BottomSheet
                    isOpen={isCancelRequestOpen}
                    onClose={() => setIsCancelRequestOpen(false)}
                    title={t("Cancel Friend Request")}
                >
                    <div className="p-4 space-y-3 ">
                        <p className="text-gray-600 text-center mb-4">
                            {t("Are you sure you want to cancel your friend request to")} {userInfo?.name}?
                        </p>

                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={handleCancelFriendRequest}
                            disabled={cancelFriendRequestMutation.isLoading}
                        >
                            <span className="font-medium">{t('Cancel request')}</span>
                        </button>

                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setIsCancelRequestOpen(false)}
                        >
                            <span className="font-medium">{t('Keep request')}</span>
                        </button>
                    </div>
                </BottomSheet>

                {/* Respond Options Bottom Sheet */}
                <BottomSheet
                    isOpen={isRespondOptionsOpen}
                    onClose={() => setIsRespondOptionsOpen(false)}
                    title={t("Friend Request")}
                >
                    <div className="p-4 space-y-3">
                        <p className="text-gray-600 text-center mb-4">
                            {userInfo?.name} {t("sent you a friend request")}
                        </p>

                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            onClick={handleAcceptFriendRequest}
                            disabled={acceptFriendRequestMutation.isLoading}
                        >
                            <span className="font-medium">{t('Accept')}</span>
                        </button>

                        <button
                            className="w-full flex items-center justify-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={handleDeclineFriendRequest}
                            disabled={rejectFriendRequestMutation.isLoading}
                        >
                            <span className="font-medium">{t('Decline')}</span>
                        </button>
                    </div>
                </BottomSheet>
            </IonPage>
        </PageContainer>
    );
};

export default OtherUserProfile;
