import React, { useRef, useState, useEffect, useCallback } from "react";
import { IonContent, IonPage, IonIcon, IonButton, IonTitle, IonButtons, IonHeader, IonToolbar } from "@ionic/react";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import { useUploadAvatar } from "./hooks/useProfile";
import PageContainer from "@/components/layout/PageContainer";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PullToRefresh from "@/components/common/PullToRefresh";
import { useRefreshCallback } from "@/contexts/RefreshContext";
import UserPostsList from "./components/UserPostsList";
import UserMediaGrid from "./components/UserMediaGrid";
import { ProfileTabType } from "./hooks/useUserPosts";

import { cameraOutline, copyOutline, createOutline } from "ionicons/icons";
import EditProfileIcon from "@/icons/logo/edit-profile.svg?react";
import BackIcon from "@/icons/logo/back-default.svg?react";
import CoppyIcon from "@/icons/logo/coppy-default.svg?react";
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"

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
          className={`flex-1 py-3 text-center font-bold text-md relative ${activeTab === tab.key
            ? "text-gray-900"
            : "text-gray-500"
            }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-0.5 bg-black rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};


const MyProfile: React.FC = () => {
  const { tabName } = useParams<{ tabName?: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { data: userInfo, refetch } = useAuthInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadAvatar();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file, {
      onSuccess: () => {
        refetch?.();
      },
    });
  };
  const history = useHistory();

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Scroll to top like Facebook
    if (contentRef.current) {
      contentRef.current.scrollToTop(300);
    }
    
    try {
      await refetch?.();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Register refresh callback for bottom tab bar
  useRefreshCallback('/my-profile', handleRefresh);

  useEffect(() => {
    const validTabs = ["posts", "media", "likes", "reposts"];
    if (tabName && validTabs.includes(tabName)) {
      setActiveTab(tabName);
    } else if (tabName && !validTabs.includes(tabName)) {
      history.replace("/my-profile/posts");
    } else if (!tabName) {
      history.replace("/my-profile/posts");
    }
  }, [tabName, history]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    history.push(`/my-profile/${tab}`);
  };

  const renderTabContent = () => {
    const tabType = getTabType(activeTab);
    const targetUserId = userInfo?.id;

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

  return (
    <PageContainer>
      <IonPage style={{ '--background': 'white', paddingBottom: '52px' } as any}>
        <IonHeader className="ion-no-border" style={{ '--background': '#EDF1FC', justifyContent: 'center' } as any}>
          <IonToolbar style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
            <IonTitle slot="" >
              {/* <BackIcon onClick={() => history.goBack()} /> */}
              <span className="font-bold pl-4 " style={{ fontSize: '15px', color: 'black' }}>
                {t('My profile')}
              </span  >
            </IonTitle>
            <IonButtons slot="end" onClick={() => history.push('/social-feed/create')}>
              <IonButton fill="clear" style={{ textColor: 'black', fontSize: '15px' }}>
                <EditProfileIcon />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent 
          ref={contentRef}
          style={{ '--background': 'white', height: '100%' } as any}
        >
          {/* Facebook-style refresh loading indicator */}
          {refreshing && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm text-gray-600">{t('Refreshing...')}</span>
                </div>
              </div>
            </div>
          )}
          
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="bg-white">
            <hr className="border-gray-100" />
            {userInfo && (
              <div className="px-4 pt-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 ">
                      <h1 className="text-[20px] font-bold text-gray-900 overflow-hidden max-w-[200px] truncate">{userInfo?.name}</h1>
                      <span className={`fi fi-${userInfo?.country?.code.toLowerCase()} fis`} style={{ width: 20, height: 20, borderRadius: 9999 }} ></span>
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <p
                        className="text-black overflow-hidden max-w-[110px] truncate text-[15px]">
                        @{userInfo?.code}
                      </p>
                      <CoppyIcon className="" onClick={() => { navigator.clipboard.writeText(userInfo.code || "") }} />
                    </div>
                    <div className="flex items-center space-x-1 mb-4" onClick={() => {
                      history.push('/friend-list');
                    }}>
                      <p className="font-medium">
                        {userInfo?.friendNumber}
                      </p>
                      <p className="mb-0 font-sans"
                      >
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
                    {!uploadAvatarMutation.isLoading && (
                      <div
                        className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-md hover:shadow-xl bg-white/90 backdrop-blur cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        style={{
                          width: '36px',
                          height: '36px',
                          top: '46px',
                          left: '-10px'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        title={t('Update avatar') as unknown as string}
                      >
                        <IonIcon
                          icon={cameraOutline}
                          className="text-transform-uppercase text-black"
                          style={{
                            width: '20px',
                            height: '20px',
                          }}
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          aria-label="Upload avatar"
                        />
                      </div>
                    )}
                    {uploadAvatarMutation.isLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[20px] z-10">
                        <div className="loader border-4 border-white border-t-main rounded-full w-8 h-8 animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 mt-4 px-2">
                  <button className="w-full rounded-xl border border-netural-50 py-2 text-netural-500" onClick={() => history.push('/profile-setting')}>
                    {t('Edit profile')}
                  </button>
                  <button className="w-full rounded-xl border border-netural-50 py-2 text-netural-500" onClick={() => history.push('/share-profile')}>
                    {t('Share profile')}
                  </button>
                </div>
              </div>
            )}
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            <div className="flex-1">
              {renderTabContent()}
            </div>
          </div>
          <div style={{ height: 'calc(112px + env(safe-area-inset-bottom, 0px))' }} />
          </PullToRefresh>
        </IonContent>
      </IonPage>
    </PageContainer>
  );
};

export default MyProfile;
