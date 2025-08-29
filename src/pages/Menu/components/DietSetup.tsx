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
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);

    // Diet options data từ healthMasterData
    const dietOptions: DietOption[] = useMemo(() => {
        const group = healthMasterData?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Diet"
        );

        return group?.lifestyles.map((item: any, index: number) => ({
            id: (item?.id != null && item?.id !== undefined)
                ? String(item.id)
                : String(item.name.toLowerCase().replace(/\s+/g, '-')),
            name: item.name,
            description: item.description || `${item.name} diet for your health journey.`,
            icon: '🥗'
        })) || [];
    }, [healthMasterData]);

    const handleRadioChange = (selectedValue: string) => {
        if (selectedValue === selectedDietRef.current) {
            selectedDietRef.current = '';
            setSelectedDiet('');
            setDiet('');
        } else {
            selectedDietRef.current = selectedValue;
            setSelectedDiet(selectedValue);
            setDiet(selectedValue);
        }
    };

    const handleContinue = () => {
        const payload = {
            lifestyleId: selectedDiet,
            allergies: allergies.map((item: AllergyItem) => ({
                allergyId: item.allergyId,
                name: item.name,
            }))
        };
        history.push('/menu-translation/confirm-setup', { payload: payload });
    };
    
    useEffect(() => {
        if (diet && healthMasterData?.groupedLifestyles) {
            const group = healthMasterData.groupedLifestyles.find(
                (g: any) => g.category?.name === "Diet"
            );
            const dietItem = group?.lifestyles.find((item: any) => String(item.id) === String(diet));
            if (dietItem) {
                const dietId = (dietItem?.id != null && dietItem?.id !== undefined)
                    ? String(dietItem.id)
                    : String(dietItem.name.toLowerCase().replace(/\s+/g, '-'));
                if (diet)
                {
                    setSelectedDiet(String(diet));
                    selectedDietRef.current = String(diet);
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
           setSelectedDiet(String(diet));
        }
    }, [diet]);

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <div className="flex flex-col min-h-screen">
                    {/* Main Content Area */}
                    <div className="flex-1 space-y-6">
                        {/* Progress */}
                        <div className="flex items-center gap-3 px-2 pt-2">
                            <div className="flex-1 h-2 rounded-full bg-blue-200" />
                            <div className="flex-1 h-2 rounded-full bg-blue-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-center text-xl font-semibold px-4">{t('Your current diet')}</h1>

                        {/* Diet Options */}
                        <div className="space-y-4">
                            {dietOptions.map((option) => (
                                <IonItem
                                    key={option.id}
                                    lines="none"
                                    className="rounded-xl border border-gray-200 w-full overflow-hidden"
                                    style={{
                                        '--background': '#ffffff',
                                        '--min-height': '120px',
                                        '--padding-start': '12px',
                                        '--inner-padding-end': '12px',
                                        '--inner-padding-top': '0px',
                                        '--inner-padding-bottom': '0px',
                                    } as any}
                                    button={true}
                                    detail={false}
                                    onClick={() => handleRadioChange(option.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleRadioChange(option.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-4 py-4 w-full h-full">
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
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-auto pt-8 pb-4 px-4 space-y-4">
                        {/* Back Button */}
                        <div className="flex items-center justify-between">
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
                                    margin: 0,
                                    flexShrink: 0
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
                                <IonButton 
                                    expand="block" 
                                    shape="round" 
                                    onClick={() => handleContinue()} 
                                    className="h-14"
                                    style={{
                                        '--background': '#1152F4',
                                        '--background-hover': '#2563eb',
                                        '--color': 'white',
                                        'font-weight': '600'
                                    }}
                                >
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