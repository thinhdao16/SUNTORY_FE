import React from "react";
import { t } from "@/lib/globalT";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useHistory } from "react-router";
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { chevronForwardOutline, arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
import WeightUpdateModal from "@/components/common/bottomSheet/WeightUpdateModal";
import HeightUpdateModal from "@/components/common/bottomSheet/HeightUpdateModal";
import DietLifeStyleModal from "@/components/common/bottomSheet/DietLifeStyleModal";
import AllergiesUpdateModal from "@/components/common/bottomSheet/AllergiesUpdateModal";
import HealthConditionUpdateModal from "@/components/common/bottomSheet/HealthConditionUpdateModal";

interface AllergyItem {
    allergyId: number;
    name: string;
}

interface HealthConditionItem {
    healthConditionId: number;
    name: string;
}

const AiProfileInformation: React.FC = () => {
    const history = useHistory();
    const { data: userInfo, refetch } = useAuthInfo();
    const [isWeightUpdateModalOpen, setIsWeightUpdateModalOpen] = useState(false);
    const [isHeightUpdateModalOpen, setIsHeightUpdateModalOpen] = useState(false);
    const [isDietLifeStyleModalOpen, setIsDietLifeStyleModalOpen] = useState(false);
    const [isAllergiesUpdateModalOpen, setIsAllergiesUpdateModalOpen] = useState(false);
    const [isHealthConditionsUpdateModalOpen, setIsHealthConditionsUpdateModalOpen] = useState(false);
    const [allergies, setAllergies] = useState<AllergyItem[]>([]);
    const [healthConditions, setHealthConditions] = useState<HealthConditionItem[]>([]);
    const [weightUnit, setWeightUnit] = useState('kg');
    const [heightUnit, setHeightUnit] = useState('cm');
    const [diet, setDiet] = useState({
        id: 0,
        name: '',
    });
    const [translateY, setTranslateY] = useState(0);
    const handleTouchStart = () => { };
    const handleTouchMove = () => { };
    const handleTouchEnd = () => { setTranslateY(0); };

    useEffect(() => {
        refetch();
        const weightUnit =
            userInfo?.currentMeasurement?.find((a: any) => a?.weightUnit)?.weightUnit?.symbol
            ?? userInfo?.currentMeasurement?.find((a: any) => a?.weightUnitId)?.weightUnit?.symbol
            ?? 'kg';

        const heightUnit =
            userInfo?.currentMeasurement?.find((a: any) => a?.heightUnit)?.heightUnit?.symbol
            ?? userInfo?.currentMeasurement?.find((a: any) => a?.heightUnitId)?.heightUnit?.symbol
            ?? 'cm';
        const dietStyle: { id: number, name: string }[] = userInfo?.groupedLifestyles?.find(
            (g: any) => g.category?.name === "Diet"
        )?.lifestyles.map((item: any) => ({
            id: item.id,
            name: item.name,
        }));

        const allergies: AllergyItem[] = userInfo?.allergies?.map((item: any) => ({
            allergyId: item.allergy.id || item.id,
            name: item.allergy.name
        })) || [];

        const healthConditions: HealthConditionItem[] = userInfo?.healthConditions?.map((item: any) => ({
            healthConditionId: item.healthCondition?.id || item.id,
            name: item.healthCondition?.name || item.name
        })) || [];

        //set state
        if (weightUnit) setWeightUnit(weightUnit);
        if (heightUnit) setHeightUnit(heightUnit);
        if (dietStyle) setDiet({
            id: dietStyle[0].id,
            name: dietStyle[0].name,
        });
        if (allergies) setAllergies(allergies);
        if (healthConditions) setHealthConditions(healthConditions);
    }, [userInfo]);

    return (
        <PageContainer>
            <IonHeader className="ion-no-border" style={{ '--background': '#EDF1FC', '--ion-background-color': '#ffffff' } as any}>
                <IonToolbar style={{ '--background': '#EDF1FC', '--ion-background-color': '#EDF1FC' } as any}>
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/profile-setting')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-black font-bold text-2xl" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-center font-semibold text-lg">
                        {t('AI health profile')}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <div className="min-h-screen max-h-[calc(100vh-200px)] overflow-y-auto bg-white flex flex-col px-6 pb-24" style={{ backgroundColor: '#EDF1FC' }}>
                <div className=" bg-white flex flex-col">
                    <div className="pb-20" style={{ backgroundColor: '#EDF1FC' }}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsWeightUpdateModalOpen(true)}
                            >
                                <span className="font-semibold text-[15px] text-gray-900">{t('Weight')}</span>
                                <div className="flex items-center gap-2 text-neutral-800 max-w-[60%]">
                                    <span className="text-[15px] whitespace-nowrap overflow-hidden text-ellipsis" title={userInfo?.weight ? `${userInfo.weight} ${weightUnit}` : ''}>{userInfo?.weight ? `${userInfo.weight} ${weightUnit}` : ""}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsHeightUpdateModalOpen(true)}
                            >
                                <span className="font-semibold text-[15px] text-gray-900">{t('Height')}</span>
                                <div className="flex items-center gap-2 text-neutral-800 max-w-[60%]">
                                    <span className="text-[15px] whitespace-nowrap overflow-hidden text-ellipsis" title={userInfo?.height ? `${userInfo.height} ${heightUnit}` : ''}>{userInfo?.height ? `${userInfo.height} ${heightUnit}` : ""}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsDietLifeStyleModalOpen(true)}
                            >
                                <span className="font-semibold text-[15px] text-gray-900">{t('Current diet')}</span>
                                <div className="flex items-center gap-2 text-neutral-800 max-w-[60%]">
                                    <span className="text-[15px] whitespace-nowrap overflow-hidden text-ellipsis" title={t(diet.name)}>{t(diet.name)}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsAllergiesUpdateModalOpen(true)}
                            >
                                <span className="font-semibold text-[15px] text-gray-900">{t('Food allergies')}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsHealthConditionsUpdateModalOpen(true)}
                            >
                                <span className="font-semibold text-[15px] text-gray-900">{t('Health Status')}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <WeightUpdateModal
                isOpen={isWeightUpdateModalOpen}
                currentWeight={userInfo?.weight || undefined}
                onClose={() => setIsWeightUpdateModalOpen(false)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
            <HeightUpdateModal
                isOpen={isHeightUpdateModalOpen}
                currentHeight={userInfo?.height || undefined}
                onClose={() => setIsHeightUpdateModalOpen(false)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                currentHeightUnit={heightUnit}
            />
            <DietLifeStyleModal
                isOpen={isDietLifeStyleModalOpen}
                onClose={() => setIsDietLifeStyleModalOpen(false)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                currentDiet={diet.id}
            />
            <AllergiesUpdateModal
                isOpen={isAllergiesUpdateModalOpen}
                onClose={() => setIsAllergiesUpdateModalOpen(false)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                allergies={allergies}
            />
            <HealthConditionUpdateModal
                isOpen={isHealthConditionsUpdateModalOpen}
                onClose={() => setIsHealthConditionsUpdateModalOpen(false)}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                healthConditions={healthConditions}
            />
        </PageContainer>
    );
};

export default AiProfileInformation;
