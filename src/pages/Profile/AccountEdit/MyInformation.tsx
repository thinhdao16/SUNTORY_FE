/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { t } from "@/lib/globalT";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";

import dayjs from "dayjs";
import { useHistory } from "react-router";
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { chevronForwardOutline, arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
import CountryListModal from "@/components/common/bottomSheet/CountryListModal";
import NameUpdateListModal from "@/components/common/bottomSheet/NameUpdateListModal";
import GenderUpdateModal from "@/components/common/bottomSheet/GenderUpdateModal";
import YearOfBirthUpdateModal from "@/components/common/bottomSheet/YearOfBirthUpdateModal";
import LanguageListModal from "@/components/common/bottomSheet/LanguageListModal";

const MyInformation: React.FC = () => {
    const history = useHistory();
    const { data: userInfo } = useAuthInfo();
    // Country bottom sheet state/handlers
    const [isCountryListModalOpen, setIsCountryListModalOpen] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const [isNameUpdateListModalOpen, setIsNameUpdateListModalOpen] = useState(false);
    const [isGenderUpdateModalOpen, setIsGenderUpdateModalOpen] = useState(false);
    const [isYearOfBirthUpdateModalOpen, setIsYearOfBirthUpdateModalOpen] = useState(false);
    const [isLanguageListModalOpen, setIsLanguageListModalOpen] = useState(false);
    // Minimal handlers to satisfy props; implement drag later if needed
    const handleTouchStart = () => { };
    const handleTouchMove = () => { };
    const handleTouchEnd = () => { setTranslateY(0); };
    const handleCountrySelect = (code: string) => {
        // TODO: hook update if needed; for now just close
        setIsCountryListModalOpen(false);
    };
    const handleLanguageSelect = (code: string) => {
        setIsLanguageListModalOpen(false);
    };

    const birthdayInputRef = useRef<HTMLInputElement>(null);
    const minDate = dayjs().subtract(120, "year").format("YYYY-MM-DD");
    const maxDate = dayjs().subtract(6, "year").format("YYYY-MM-DD");
    const {
        formState: { errors },
    } = useForm({
        defaultValues: {
            firstname: userInfo?.firstname || "",
            lastname: userInfo?.lastname || "",
            dateOfBirth: userInfo?.dateOfBirth
                ? dayjs(userInfo.dateOfBirth).format("YYYY-MM-DD")
                : "",
            gender: userInfo?.gender === 1 ? t('Male') : userInfo?.gender === 2 ? t('Female') : t('Other'),
            height: userInfo?.height?.toString() || "",
            weight: userInfo?.weight?.toString() || "",
        },
    });

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
                        {t('My information')}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <div className="min-h-screen max-h-[calc(100vh-100px)] overflow-y-auto bg-[#EDF1FC] px-6 py-4 pb-24">
                <div className="space-y-4">
                    {/* Personal Information Block */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50"
                            onClick={() => {
                                setIsNameUpdateListModalOpen(true);
                            }}
                        >
                            <span className="text-black font-semibold text-[15px]">{t('Name')}</span>
                            <div className="flex items-center gap-2 max-w-[60%]">
                                <span className="text-black whitespace-nowrap overflow-hidden text-ellipsis">{userInfo?.firstname} {userInfo?.lastname}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-400 text-xl" />
                            </div>
                        </button>
                        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                            <span className="text-gray-500 font-semibold text-[15px]">{t('Email')}</span>
                            <span className="text-gray-500 max-w-[60%] whitespace-nowrap overflow-hidden text-ellipsis text-[15px]">{userInfo?.email}</span>
                        </div>
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50"
                            onClick={() => {
                                setIsGenderUpdateModalOpen(true);
                            }}
                        >
                            <span className="text-black font-semibold text-[15px]">{t('Gender')}</span>
                            <div className="flex items-center gap-2 max-w-[60%]">
                                <span className="text-black whitespace-nowrap overflow-hidden text-ellipsis text-[15px]">
                                    {userInfo?.gender === 1 ? t('Male') : userInfo?.gender === 2 ? t('Female') : t('Other')}
                                </span>
                                <IonIcon icon={chevronForwardOutline} className="text-400 text-xl" />
                            </div>
                        </button>
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50"
                            onClick={() => {
                                setIsYearOfBirthUpdateModalOpen(true);
                            }}
                        >
                            <span className="text-black font-semibold text-[15px]">{t('Year of birth')}</span>
                            <div className="flex items-center gap-2 max-w-[60%]">
                                <span className="text-black whitespace-nowrap overflow-hidden text-ellipsis text-[15px]">
                                    {userInfo?.dateOfBirth ? new Date(userInfo.dateOfBirth).getFullYear() : ''}
                                </span>
                                <IonIcon icon={chevronForwardOutline} className="text-400 text-xl" />
                            </div>
                        </button>
                    </div>

                    {/* Regional Settings Block */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-gray-100 hover:bg-gray-50"
                            onClick={() => setIsCountryListModalOpen(true)}
                        >
                            <span className="text-black font-semibold text-[15px]">{t('Country')}</span>
                            <div className="flex items-center gap-2 max-w-[60%]">
                                <span className="text-black whitespace-nowrap overflow-hidden text-ellipsis text-[15px]">{userInfo?.country?.name}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-400 text-xl" />
                            </div>
                        </button>
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50"
                            onClick={() => setIsLanguageListModalOpen(true)}
                        >
                            <span className="text-black font-semibold text-[15px]">{t('Language')}</span>
                            <div className="flex items-center gap-2 max-w-[60%]">
                                <span className="text-black whitespace-nowrap overflow-hidden text-ellipsis text-[15px]">{t(userInfo?.language?.name ?? '')}</span>
                                <IonIcon icon={chevronForwardOutline} className="text-400 text-xl" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            <CountryListModal
                isOpen={isCountryListModalOpen}
                onClose={() => setIsCountryListModalOpen(false)}
                selectedCode={userInfo?.country?.code}
                onSelect={handleCountrySelect}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
            <NameUpdateListModal
                isOpen={isNameUpdateListModalOpen}
                onClose={() => setIsNameUpdateListModalOpen(false)}
                currentFirstName={userInfo?.firstname || ''}
                currentLastName={userInfo?.lastname || ''}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
            <GenderUpdateModal
                isOpen={isGenderUpdateModalOpen}
                onClose={() => setIsGenderUpdateModalOpen(false)}
                translateY={translateY}
                currentGender={userInfo?.gender}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
            <YearOfBirthUpdateModal
                isOpen={isYearOfBirthUpdateModalOpen}
                onClose={() => setIsYearOfBirthUpdateModalOpen(false)}
                translateY={translateY}
                currentYearOfBirth={userInfo?.dateOfBirth ? new Date(userInfo.dateOfBirth).getFullYear() : null}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
            <LanguageListModal
                isOpen={isLanguageListModalOpen}
                onClose={() => setIsLanguageListModalOpen(false)}
                translateY={translateY}
                selectedCode={userInfo?.language?.code}
                onSelect={handleLanguageSelect}
            />
        </PageContainer>
    );
};

export default MyInformation;