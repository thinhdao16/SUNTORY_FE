import React, { useEffect } from 'react';
import { IonPage, IonContent, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { arrowBack, chevronBack } from 'ionicons/icons';
import PhotoIcon from "@/icons/logo/menu/take-photo.svg?react";
import { base64FromPath, usePhotoGallery } from '@/pages/TakePhoto/usePhotoGallery';
import { useLocation } from 'react-router-dom';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';

interface LocationState {
    base64Img?: string;
}

const ScanMenu: React.FC<{ isNative?: boolean, isDesktop?: boolean }> = ({ isNative, isDesktop }) => {
    const history = useHistory();
    const { t } = useTranslation();
    const location = useLocation<LocationState>();
    const { chooseFromGallery } = usePhotoGallery();
    const { isUseCamera, setIsUseCamera } = useMenuTranslationStore();

    const base64Img = location.state?.base64Img;

    const handleChooseFromGallery = async () => {
        const imgData = await chooseFromGallery();
        let base64Img = imgData?.base64 || (imgData?.webPath && await base64FromPath(imgData.webPath));
        if (base64Img) {
            history.push("/menu-translation/menu-analyzing", { base64Img: base64Img });
        }
    };

    const handleTakePhoto = async () => {
        setIsUseCamera(true);
        history.push("/camera");
    };

    useEffect(() => {
        if (base64Img) {
            history.push("/menu-translation/menu-analyzing", { base64Img: base64Img });
        }
        else { return; }
    }, [base64Img]);

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/menu-translation')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-gray-700 font-bold text-2xl" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-center font-semibold text-lg">
                        {t('Scan Menu')}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={chevronBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="flex flex-col h-full">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col items-center justify-center px-8">
                        {/* Scan Icon */}
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <PhotoIcon className="w-24 h-24" />
                            </div>
                        </div>

                        {/* Title and Description */}
                        <div className="text-center mb-12">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('Take photos of your menu pages')}
                            </h1>
                            <p className="text-gray-600 text-base leading-relaxed max-w-sm">
                                {t('You can upload multiple photos to capture the full menu.')}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pb-8 px-4 space-y-4">
                        {/* Take Photo Button */}
                        <IonButton
                            expand="block"
                            shape="round"
                            onClick={handleTakePhoto}
                            className="h-14"
                            style={{
                                '--background': '#1152F4',
                                '--background-hover': '#2563eb',
                                '--color': 'white',
                                'font-weight': '600'
                            }}
                        >
                            {t('Take Photo')}
                        </IonButton>

                        {/* Choose from Gallery Button */}
                        <IonButton
                            expand="block"
                            fill="outline"
                            shape="round"
                            onClick={handleChooseFromGallery}
                            className="h-14"
                            style={{
                                '--border-color': '#1152F4',
                                '--color': '#1152F4',
                                'font-weight': '600'
                            }}
                        >
                            {t('Choose from Gallery')}
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ScanMenu;
