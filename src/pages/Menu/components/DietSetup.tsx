import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IonPage, IonContent, IonButton, IonIcon, IonRadio, IonRadioGroup, IonItem } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chevronBackOutline } from 'ionicons/icons';
import { useHealthMasterDataStore } from '@/store/zustand/health-master-data-store';
import { useHealthMasterData } from '@/hooks/common/useHealth';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';

interface AllergyItem {
    allergyId: number;
    name: string;
}

interface LocationState {
    allergies?: AllergyItem[];
    dietStyle?: number;
}

interface DietOption {
    id: string;
    name: string;
    description: string;
    icon: string;
}

const DietSetup: React.FC = () => {
    useHealthMasterData();
    const history = useHistory();
    const location = useLocation<LocationState>();
    const { t } = useTranslation();
    const [selectedDiet, setSelectedDiet] = useState<string>('');
    const selectedDietRef = useRef<string>('');
    const { diet, setDiet } = useMenuTranslationStore();

    // Lấy allergies từ location state
    const allergies = location.state?.allergies || [];
    const dietStyle = location.state?.dietStyle || 0;
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);

    // Diet options data từ healthMasterData
    const dietOptions: DietOption[] = useMemo(() => {
        const group = healthMasterData?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Diet"
        );

        return group?.lifestyles.map((item: any, index: number) => ({
            id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
            name: item.name,
            description: item.description || `${item.name} diet for your health journey.`,
            icon: '🥗'
        })) || [];
    }, [healthMasterData]);

    const handleRadioChange = (selectedValue: string) => {
        if (selectedValue === selectedDietRef.current) {
            selectedDietRef.current = '';
            setSelectedDiet('');
        } else {
            selectedDietRef.current = selectedValue;
            setSelectedDiet(selectedValue);
            setDiet(selectedValue);
        }
    };

    const handleContinue = () => {
        const payload = {
            lifestyleId: selectedDiet,
            allergies: allergies
        };
        history.push('/menu-translation/confirm-setup', { payload: payload });
    };

    useEffect(() => {
        if (dietStyle && healthMasterData?.groupedLifestyles) {
            const group = healthMasterData.groupedLifestyles.find(
                (g: any) => g.category?.name === "Diet"
            );
            const dietItem = group?.lifestyles.find((item: any) => item.id == dietStyle);
            if (dietItem) {
                const dietId = dietItem.id || dietItem.name.toLowerCase().replace(/\s+/g, '-');
                if (diet)
                {
                    setSelectedDiet(diet);
                    selectedDietRef.current = diet;
                }
                else {
                    setSelectedDiet(dietId);
                    setDiet(dietId);
                    selectedDietRef.current = dietId;
                }
            }
        }
    }, []);

    useEffect(() => {   
        if (diet) {
           setSelectedDiet(diet);
        }
    }, [diet]);

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <div className="relative flex flex-col min-h-full pb-24">
                    {/* Progress */}
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="flex-1 h-2 rounded-full bg-blue-200" />
                        <div className="flex-1 h-2 rounded-full bg-blue-600" />
                    </div>

                    {/* Title */}
                    <h1 className="text-center text-xl font-semibold mt-6 mb-8">{t('Your current diet')}</h1>

                    {/* Diet Options */}
                    <div className="space-y-4">
                        {dietOptions.map((option) => (
                            <IonItem
                                key={option.id}
                                lines="none"
                                className="rounded-xl border border-gray-200"
                                style={{ '--background': '#ffffff', height: '120px' } as any}
                                button
                                onClick={() => handleRadioChange(option.id)}
                            >
                                <div className="flex items-start gap-4 py-4 w-full">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-15 h-15 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
                                        {option.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 w-207">
                                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                                            {t(option.name)}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {t(option.description)}
                                        </p>
                                    </div>

                                    {/* Tick */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedDiet === option.id
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-gray-300'
                                            }`}>
                                            {selectedDiet === option.id && (
                                                <span className="text-white text-base">✓</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </IonItem>
                        ))}
                    </div>

                    {/* Bottom actions */}
                    <div className="fixed bottom-0 left-0 right-0">
                        {/* Bottom actions */}
                        <div className="absolute bottom-2 left-0 right-0 px-4 pb-8 bg-white flex items-center justify-between">
                            <IonButton
                                fill="clear"
                                onClick={() => history.push('/menu-translation/allergies-setup')}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    margin: 0
                                }}
                            >
                                <IonIcon 
                                    icon={chevronBackOutline} 
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '20px'
                                    }}
                                />
                            </IonButton>
                            <div className="flex-1 ml-4">
                                <IonButton expand="block" shape="round" onClick={() => handleContinue()} style={{
                                    background: '#1152F4',
                                    color: 'white',
                                    height: '44px',
                                    borderRadius: '16px',
                                    border: '100'
                                }}>
                                    {t('Continue')}
                                </IonButton>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DietSetup;