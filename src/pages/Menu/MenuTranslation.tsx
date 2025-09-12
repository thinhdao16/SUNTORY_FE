import React from 'react';
import { IonPage, IonContent, IonButton, IonIcon, IonHeader, IonToolbar, IonButtons, IonTitle, IonFooter } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from "@/icons/logo/menu/menu-icon.svg?react";
import AllergiesSetup from './components/AllergiesSetup';
import DietSetup from './components/DietSetup';
import AnalyzingSetup from './components/AnalyzingSetup';
import ScanMenu from './components/ScanMenu';
import { arrowBack, chevronBack } from 'ionicons/icons';

const MenuTranslation: React.FC = () => {
    const history = useHistory();
    const { section } = useParams<{ section?: string }>();
    const { t } = useTranslation();

    // Khi có section con, chỉ render trang con tương ứng để tránh chồng lấp UI
    if (section) {
        switch (section) {
            case "allergies-setup":
                return <AllergiesSetup />;
            case "diet-setup":
                return <DietSetup />;
            case "confirm-setup":
                return <AnalyzingSetup />;
            case "scan-menu":
                return <ScanMenu />;
            default:
                return <></>;
        }
    }
    
    return (
        <IonPage>
            <IonHeader className="ion-no-border" style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                <IonToolbar style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/home')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-gray-700 font-bold text-2xl" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-center font-semibold text-lg">
                        {t('Menu Translation')}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={chevronBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                <div className="flex flex-col min-h-full pb-28 bg-white">
                    {/* Top Section - Icon */}
                    <div className="flex items-center justify-center pt-16 mb-8">
                        <div className="text-center">
                            <MenuIcon className="mx-auto" style={{ width: 'clamp(96px, 22vw, 160px)', height: 'clamp(96px, 22vw, 160px)' }} />
                        </div>
                    </div>

                    {/* Middle Section - Title & Description */}
                    <div className="flex flex-col justify-center px-8 mb-16">
                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6 leading-tight">
                            {t('Menu Visualization & Translation')}
                        </h1>
                        <p className="text-lg text-gray-600 text-center leading-relaxed max-w-sm mx-auto">
                            {t('Just a moment! Share a few details to get accurate, personalized results.')}
                        </p>
                    </div>
                </div>
            </IonContent>
            <IonFooter className="ion-no-border" style={{ '--background': '#ffffff', '--ion-background-color': '#ffffff' } as any}>
                <div className="pt-4 pb-6 px-6 space-y-4 bg-white">
                    <IonButton
                        expand="block"
                        shape="round"
                        onClick={() => history.push('/menu-translation/allergies-setup')}
                        style={{
                            borderRadius: '16px',
                            border: '100',
                            height: '44px',
                        }}
                    >
                        {t('Continue')}
                    </IonButton>
                    <IonButton
                        expand="block"
                        onClick={() => history.push('/menu-translation/scan-menu')}
                        fill="clear"
                        style={{
                            height: '44px',
                            borderRadius: '22px',
                            border: '1px solid #A3A8AF',
                            backgroundColor: 'white',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}
                    >
                        {t('Skip for now')}
                    </IonButton>
                </div>
            </IonFooter>
        </IonPage>
    );
};

export default MenuTranslation;