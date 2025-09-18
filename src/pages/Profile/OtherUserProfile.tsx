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

import BackIcon from "@/icons/logo/back-default.svg?react";
import CoppyIcon from "@/icons/logo/coppy-default.svg?react";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"

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
    const [userInfo, setUserInfo] = useState<any>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friend'>('none');
    const [isLoading, setIsLoading] = useState(true);

    const targetUserId = parseInt(userId);

    useEffect(() => {
        if (user?.id === targetUserId) {
            history.replace('/my-profile');
            return;
        }
    }, [user?.id, targetUserId, history]);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setIsLoading(true);
            
                setUserInfo({
                    id: targetUserId,
                    name: "Dug",
                    code: "dugdog159",
                    avatarLink: null,
                    friendNumber: 56,
                    country: { code: "VN" }
                });
                setFriendshipStatus('none'); 
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (targetUserId && user?.id !== targetUserId) {
            fetchUserInfo();
        }
    }, [targetUserId, user?.id]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        history.replace(`/profile/${userId}/${tab}`);
    };

    const handleSendFriendRequest = async () => {
        try {
         
            setFriendshipStatus('pending');
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    };

    const handleAcceptFriendRequest = async () => {
        try {
        
            setFriendshipStatus('friend');
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        }
    };

    const handleDeclineFriendRequest = async () => {
        try {
         
            setFriendshipStatus('none');
        } catch (error) {
            console.error('Failed to decline friend request:', error);
        }
    };

    const handleSendMessage = () => {
        // TODO: Navigate to chat with this user
        history.push(`/social-chat/${userId}`);
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
        switch (friendshipStatus) {
            case 'none':
                return (
                    <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                        <button
                            className="flex-1 rounded-xl bg-blue-500 py-2 text-white font-medium"
                            onClick={handleSendFriendRequest}
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

            case 'pending':
                return (
                    <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                        <button
                            className="flex-1 rounded-xl bg-blue-500 py-2 text-white font-medium"
                            onClick={handleAcceptFriendRequest}
                        >
                            {t('Accept')}
                        </button>
                        <button
                            className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                            onClick={handleDeclineFriendRequest}
                        >
                            {t('Decline')}
                        </button>
                    </div>
                );

            case 'friend':
                return (
                    <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                        <button
                            className="flex-1 rounded-xl bg-blue-500 py-2 text-white font-medium"
                            onClick={handleSendMessage}
                        >
                            {t('Message')}
                        </button>
                        <button
                            className="flex-1 rounded-xl border border-gray-300 py-2 text-gray-700"
                        >
                            {t('Friend')}
                        </button>
                    </div>
                );

            default:
                return null;
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
                            <span className="text-lg font-semibold ml-4">
                                {userInfo?.name}
                            </span>
                        </IonButtons>
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
                                            className={`fi fi-${userInfo?.country?.code.toLowerCase()} fis`}
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
                                            friends
                                        </p>
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
            </IonPage>
        </PageContainer>
    );
};

export default OtherUserProfile;
