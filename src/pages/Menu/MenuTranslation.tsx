import React from 'react';
import { IonPage, IonContent, IonButton, IonIcon, IonHeader, IonToolbar, IonButtons, IonTitle } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from "@/icons/logo/menu/menu-icon.svg?react";
import AllergiesSetup from './components/AllergiesSetup';
import DietSetup from './components/DietSetup';
import AnalyzingSetup from './components/AnalyzingSetup';
import ScanMenu from './components/ScanMenu';
import MenuAnalyzing from './components/MenuAnalyzing';
import { arrowBack, chevronBack } from 'ionicons/icons';

const MenuTranslation: React.FC = () => {
    const history = useHistory();
    const { section } = useParams<{ section?: string }>();
    const { t } = useTranslation();

    const menuItems = [
        { label: t("Allergies Setup"), onClick: () => history.push("/menu-translation/allergies-setup"), chevron: true },
        { label: t("Diet Setup"), onClick: () => history.push("/menu-translation/diet-setup"), chevron: true },
        { label: t("Confirm Setup"), onClick: () => history.push("/menu-translation/analyzing-setup"), chevron: true },
        { label: t("Scan Menu"), onClick: () => history.push("/menu-translation/scan-menu"), chevron: true },
        { label: t("Menu Analyzing"), onClick: () => history.push("/menu-translation/menu-analyzing"), chevron: true },
    ];

    const renderSectionContent = () => {
        switch (section) {
            case "allergies-setup":
                return <AllergiesSetup />;
            case "diet-setup": return <DietSetup />;
            case "confirm-setup": return <AnalyzingSetup />;
            case "scan-menu": return <ScanMenu />;
            case "menu-analyzing": return <MenuAnalyzing />;
            default:
                return <></>
        }
    };
    return (
        <IonPage>
            <IonContent className="ion-padding">
                {renderSectionContent()}
                <div className="flex justify-between items-left">
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/home')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-gray-700 font-bold text-2xl" />
                        </IonButton>
                    </IonButtons>
                </div>
                <div className="flex flex-col">
                    {/* Top Section - Icon */}
                    <div className="flex-1 flex items-center justify-center pt-16">
                        <div className="text-center">
                            <MenuIcon className="w-36 h-36 mx-auto" />
                        </div>
                    </div>

                    {/* Middle Section - Title & Description */}
                    <div className="flex-1 flex flex-col justify-center px-8 min-h-[20vh]">
                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6 leading-tight">
                            {t('Menu Visualization & Translation')}
                        </h1>
                        <p className="text-lg text-gray-600 text-center leading-relaxed max-w-sm mx-auto">
                            {t('Just a moment! Share a few details to get accurate, personalized results.')}
                        </p>
                    </div>

                    {/* Bottom Section - Action Buttons */}
                    <div className="absolute bottom-2 left-0 right-0 px-6 pb-8 bg-white">
                        <div className="space-y-4">
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
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MenuTranslation;