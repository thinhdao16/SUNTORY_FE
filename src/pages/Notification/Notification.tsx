import { IonButton, IonHeader, IonToolbar, IonButtons, IonIcon, IonTitle } from "@ionic/react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import NotificationList from "./components/NotificationList";
import { arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
import { useState, useEffect } from "react";
import FriendRequest from "./components/FriendRequest";
import { useNotificationStore } from "@/store/zustand/notify-store";

function Notification() {
    const history = useHistory();
    const lastActionTime = useNotificationStore((state) => state.lastActionTime);
    const [activeTab, setActiveTab] = useState<'notifications' | 'friend-requests'>('notifications');
    const [refreshKey, setRefreshKey] = useState(0);

    // Trigger refresh when lastActionTime changes
    useEffect(() => {
        if (lastActionTime > 0) {
            setRefreshKey(prev => prev + 1);
        }
    }, [lastActionTime]);

    return (
        <PageContainer className="!overflow-hidden">
            <div className="h-screen flex flex-col">
                <IonHeader className="ion-no-border border-b border-gray-200 flex-shrink-0" style={{ '--background': 'white', justifyContent: 'center'} as any}>
                    <IonToolbar style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                        <IonButtons slot="start">
                            <IonButton
                                fill="clear"
                                onClick={() => history.goBack()}
                                className="pl-4"
                            >
                                <IonIcon icon={arrowBack} className="text-black font-bold text-2xl" />
                            </IonButton>
                        </IonButtons>
                        <IonTitle className="text-center font-bold" style={{ fontSize: '15px', textColor: 'black' }}>
                            {t('Notification')}
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton className="opacity-0 pointer-events-none pr-4" fill="clear" style={{ textColor: 'black', fontSize: '15px' }}>
                                <IonIcon icon={arrowBack} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                {/* Tab Buttons */}
                <div className="px-4 py-3 bg-white no-border flex-shrink-0">
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
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'notifications' && <NotificationList key={refreshKey}/>}
                    {activeTab === 'friend-requests' && <FriendRequest key={refreshKey} activeTab = {activeTab}/>}
                </div>
            </div>
        </PageContainer>
    );
}

export default Notification;