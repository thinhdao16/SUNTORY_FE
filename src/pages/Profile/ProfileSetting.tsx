import { IonButtons, IonButton, IonHeader, IonToolbar, IonTitle, IonIcon } from "@ionic/react";
import React, { useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import i18n from "@/config/i18n";
import MyInformation from "./AccountEdit/MyInformation";
import HealthInformationEdit from "./HealthInformationEdit/HealthInformationEdit";
import PageContainer from "@/components/layout/PageContainer";
import ChangePassword from "../Auth/ChangePassword/ChangePassword";
import { useLogout } from "./hooks/useLogout";
import { arrowBack, chevronForwardOutline, peopleOutline, personAddOutline, lockClosedOutline, helpCircleOutline, logOutOutline, personCircleOutline, starOutline } from "ionicons/icons";
import { t } from "@/lib/globalT";


const languageOptions = [
    { label: "English", code: "en" },
    { label: "Tiếng Việt", code: "vi" },
    { label: "中文", code: "zh" },
];

const Profile: React.FC = () => {
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [languageLoading, setLanguageLoading] = useState(false);
    const { section } = useParams<{ section?: string, type: string }>();
    const history = useHistory();
    const handleLogout = useLogout();
    const handleChangeLanguage = (status: boolean, lang?: string) => {
        setShowLanguageOptions(status);
    };

    return (
        <PageContainer className="">
            <IonHeader className="ion-no-border" style={{ '--background': '#EDF1FC', '--ion-background-color': '#ffffff' } as any}>
                <IonToolbar style={{ '--background': '#EDF1FC', '--ion-background-color': '#EDF1FC' } as any}>
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/my-profile')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-gray-700 font-bold text-2xl" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-center font-semibold text-lg">
                        {section === "account"
                            ? t('My information')
                            : section === "health"
                                ? t('AI health profile')
                                : section === "change-password"
                                    ? t('Reset password')
                                    : t('Settings and privacy')
                        }
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <div className="min-h-screen max-h-[calc(100vh-200px)] overflow-y-auto bg-white flex flex-col px-6 pb-24"
                style={{ backgroundColor: '#EDF1FC' }}
            >
                <div className=" bg-white flex flex-col">
                    <div className="pb-20" style={{ backgroundColor: '#EDF1FC' }}>
                        <div className="space-y-4">
                            {/* Block 0: Profile info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/my-information')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={personCircleOutline} className="text-gray-700 text-xl" />
                                        <span>{t('My information')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                                <hr className="border-gray-100" />
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/ai-profile-setting')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={starOutline} className="text-gray-700 text-xl" />
                                        <span>{t('AI health profile')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                            </div>

                            {/* Block 1: Friends */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/friend-list')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={peopleOutline} className="text-gray-700 text-xl" />
                                        <span>{t('Friend list')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                                <hr className="border-gray-100" />
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/friend-request-sent')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={personAddOutline} className="text-gray-700 text-xl" />
                                        <span>{t('Friend request sent')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                            </div>

                            {/* Block 2: Settings */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/change-password')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={lockClosedOutline} className="text-gray-700 text-xl" />
                                        <span>{t('Reset password')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                                <hr className="border-gray-100" />
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-gray-800 hover:bg-gray-50 transition"
                                    onClick={() => history.push('/profile/help')}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={helpCircleOutline} className="text-gray-700 text-xl" />
                                        <span>{t('Help & Feedbacks')}</span>
                                    </div>
                                    <IonIcon icon={chevronForwardOutline} className="text-gray-400 text-xl" />
                                </button>
                                <hr className="border-gray-100" />
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-[15px] text-left text-[15px] text-red-500 hover:bg-red-50 transition"
                                    onClick={() => { handleLogout() }}
                                >
                                    <div className="flex items-center gap-3">
                                        <IonIcon icon={logOutOutline} className="text-red-500 text-xl" />
                                        <span className="font-medium">{t('Log out')}</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    {showLanguageOptions && (
                        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-lg p-6 w-72">
                                <div className="font-semibold mb-3 text-center">{t("Language")}</div>
                                <ul>
                                    {languageOptions.map((opt) => (
                                        <li key={opt.code}>
                                            <button
                                                className={`w-full py-2 text-left rounded transition ${i18n.language === opt.code
                                                    ? " text-main font-semibold"
                                                    : "text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                onClick={async () => {
                                                    setLanguageLoading(true);
                                                    await i18n.changeLanguage(opt.code);
                                                    setLanguageLoading(false);
                                                    setShowLanguageOptions(false);
                                                }}
                                                disabled={languageLoading}
                                            >
                                                {opt.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className="mt-4 w-full py-2 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    onClick={() => setShowLanguageOptions(false)}
                                    disabled={languageLoading}
                                >
                                    {t("Cancel")}
                                </button>
                            </div>
                        </div>
                    )}
                    {languageLoading && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
                            <div className="loader border-4 border-white border-t-main rounded-full w-12 h-12 animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Profile;
