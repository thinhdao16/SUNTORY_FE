import { IonButton, IonHeader, IonToolbar, IonButtons, IonIcon, IonTitle } from "@ionic/react";
import { useHistory } from "react-router-dom";
import NotificationList from "./components/NotificationList";
import { arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
import React from "react";
import { useState, useEffect, useRef } from "react";
import FriendRequest from "./components/FriendRequest";
import { useNotificationStore } from "@/store/zustand/notify-store";
import WaveIcon from '@/icons/logo/social/wave-icon.svg?react';
import NotificationBottomModal from "@/components/common/bottomSheet/NotificationBottomModal";
import { handleTouchStart as handleTouchStartUtil, handleTouchMove as handleTouchMoveUtil, handleTouchEnd as handleTouchEndUtil } from '@/utils/translate-utils';

function Notification() {
    const history = useHistory();
    const lastActionTime = useNotificationStore((state) => state.lastActionTime);
    const [activeTab, setActiveTab] = useState<'notifications' | 'friend-requests'>('notifications');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notificationIds, setNotificationIds] = useState<number[] | null>(null);
    const [translateY, setTranslateY] = useState(0);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const [hideBottomTabBar, setHideBottomTabBar] = useState(false);
    const [isReadAll, setIsReadAll] = useState(false);
    const screenHeightRef = useRef(window.innerHeight);
    const velocityThreshold = 0.4;

    const handleTouchStart = (e: React.TouchEvent) => {
        handleTouchStartUtil(e, startYRef, startTimeRef);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        handleTouchMoveUtil(e, startYRef, screenHeightRef, setTranslateY);
    };
    const handleTouchEnd = () => {
        handleTouchEndUtil(
            translateY,
            startYRef,
            startTimeRef,
            screenHeightRef,
            velocityThreshold,
            () => setIsOpen(false),
            setTranslateY
        );
    };

    // Trigger refresh when lastActionTime changes
    useEffect(() => {
        if (lastActionTime > 0) {
            setRefreshKey(prev => prev + 1);
        }
    }, [lastActionTime]);

    return (
        <PageContainer className="!overflow-hidden">
            <div className="h-screen flex flex-col">
                <IonHeader className="ion-no-border border-b border-gray-200 flex-shrink-0" style={{ '--background': 'white', justifyContent: 'center' } as any}>
                    <IonToolbar style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                        <IonButtons slot="start">
                            {/* <IonButton
                                fill="clear"
                                onClick={() => history.goBack()}
                                className="pl-4"
                            >
                                <IonIcon icon={arrowBack} className="text-black font-bold text-2xl" />
                            </IonButton> */}
                        </IonButtons>
                        <IonTitle className="text-center font-bold" style={{ fontSize: '15px', textColor: 'black' }}>
                            {t('Notifications')}
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton className="opacity-0 pointer-events-none pr-4" fill="clear" style={{ textColor: 'black', fontSize: '15px' }}>
                                <IonIcon icon={arrowBack} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                {/* Tab Buttons */}
                <div className="px-3 py-3 bg-white no-border flex justify-between items-center">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'notifications'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            {t('Notifications')}
                        </button>
                        <button
                            onClick={() => setActiveTab('friend-requests')}
                            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'friend-requests'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            {t('Friend Requests')}
                        </button>
                    </div>
                    {
                        activeTab === 'notifications' && (
                            <div className="flex items-center space-x-2">
                                <button className="p-2 hover:bg-gray-100 rounded-full" onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(true);
                                }}>
                                    <WaveIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        )
                    }
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'notifications' && <NotificationList key={refreshKey} isReadAll={isReadAll} />}
                    {activeTab === 'friend-requests' && <FriendRequest key={refreshKey} />}
                </div>
            </div>
            <NotificationBottomModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                notificationIds={notificationIds}
                handleMarkAsRead={() => setIsReadAll(true)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                onModalStateChange={(modalOpen) => {
                    setHideBottomTabBar(modalOpen || false);
                }}
                isFromHeader={true}
            />
        </PageContainer>
    );
}

export default Notification;