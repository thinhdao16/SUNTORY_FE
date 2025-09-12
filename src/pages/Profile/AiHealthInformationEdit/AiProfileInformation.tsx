import React from "react";
import { t } from "@/lib/globalT";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useHistory } from "react-router";
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { chevronForwardOutline, arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
import WeightUpdateModal from "@/components/common/bottomSheet/WeightUpdateModal";
import HeightUpdateModal from "@/components/common/bottomSheet/HeightUpdateModal";

const AiProfileInformation: React.FC = () => {
    const history = useHistory();
    const { data: userInfo, refetch } = useAuthInfo();
    const [isWeightUpdateModalOpen, setIsWeightUpdateModalOpen] = useState(false);
    const [isHeightUpdateModalOpen, setIsHeightUpdateModalOpen] = useState(false);
    const [weightUnit, setWeightUnit] = useState('kg');
    const [heightUnit, setHeightUnit] = useState('cm');
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
        console.log("userInfo", userInfo);
        if (weightUnit) setWeightUnit(weightUnit);
        if (heightUnit) setHeightUnit(heightUnit);
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
                            <IonIcon icon={arrowBack} className="text-gray-700 font-bold text-2xl" />
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
                                <span>{t('Weight')}</span>
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <span className="text-sm">{userInfo?.weight ? `${userInfo.weight} ${weightUnit}` : ""}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => setIsHeightUpdateModalOpen(true)}
                            >
                                <span>{t('Height')}</span>
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <span className="text-sm">{userInfo?.height ? `${userInfo.height} ${heightUnit}` : ""}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => history.push('/health-information')}
                            >
                                <span>{t('Current diet')}</span>
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <span className="text-sm">{t('Balanced')}</span>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </div>
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => history.push('/health-information')}
                            >
                                <span>{t('Food allergies')}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                            </button>
                            <hr className="border-gray-100" />
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                onClick={() => history.push('/health-information')}
                            >
                                <span>{t('Health Status')}</span>
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
            />
        </PageContainer>
    );
};

export default AiProfileInformation;
