import { useAuthStore } from "@/store/zustand/auth-store";
import { openSidebarWithAuthCheck, useUiStore } from "@/store/zustand/ui-store";
import { handleImageError } from "@/utils/image-utils";
import { IonContent, IonPage } from "@ionic/react";
import React, { useState } from "react";
import { IoMenuOutline, IoChevronForward, IoChevronBack } from "react-icons/io5";
import { useHistory, useParams } from "react-router-dom";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import i18n from "@/config/i18n";
import { ProfileHeader } from "./ProfileHeader";
import AccountEdit from "./AccountEdit/AccountEdit";
import HealthInformationEdit from "./HealthInformationEdit/HealthInformationEdit";

const healthOptions = [
    { label: t("Basic Info"), path: "/health-information/progress-1" },
    { label: t("Health Info"), path: "/health-information/progress-2" },
    { label: t("Allergy Info"), path: "/health-information/progress-3" },
    { label: t("Medicine Info"), path: "/health-information/progress-4" },
];

const languageOptions = [
    { label: "English", code: "en" },
    { label: "Tiếng Việt", code: "vi" },
    { label: "中文", code: "zh" },
];

const Profile: React.FC = () => {
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [languageLoading, setLanguageLoading] = useState(false);
    const { section, type } = useParams<{ section?: string, type: string }>();
    const history = useHistory();
    const handleLogout = () => {
        useAuthStore.getState().logout();
        window.location.href = "/login";
    };
    const handleChangeLanguage = (status: boolean, lang?: string) => {
        setShowLanguageOptions(status);
    };
    const menuItems = [
        { label: t("Account"), onClick: () => history.replace("/profile/account"), },
        // {
        //     label: t("Update Health Information"),
        //     onClick: () => history.replace("/profile/health"),
        // },
        { label: t("Change Password"), onClick: () => history.push("/change-password") },
        { label: t("Language"), onClick: () => handleChangeLanguage(true, "en") },
        // { label: t("Help & Feedback"), onClick: () => { } },
        { label: t("Logout"), onClick: () => { handleLogout() } },
    ];
    const { data: userInfo } = useAuthInfo();

    const renderSectionContent = () => {
        switch (section) {
            case "account":
                return <AccountEdit />;
            case "health": return <HealthInformationEdit />;
            // case "allergy": return <AllergyInfoEdit />;
            // ...thêm các section khác nếu cần...
            default:
                return (
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.label}>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between py-3 text-left text-[15px] text-gray-700 hover:bg-gray-50 rounded-lg transition"
                                    onClick={item.onClick}
                                >
                                    <span>{item.label}</span>
                                    <IoChevronForward className="text-lg text-gray-400" />
                                </button>
                            </li>
                        ))}
                    </ul>
                );
        }
    };
    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="min-h-screen bg-white flex flex-col px-6" style={{ paddingTop: "var(--safe-area-inset-top)" }}>
                    <div className="flex items-center h-12 mb-2">
                        {section ? (
                            <button
                                className="flex items-center gap-2 text-main font-medium"
                                onClick={() => history.push("/profile")}
                            >
                                <img src="logo/back.svg" alt="Back" className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                className="mr-auto"
                                onClick={openSidebarWithAuthCheck}
                            >
                                <img src="logo/nav_bar_home_history.svg" alt="Menu" className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                    {userInfo && <ProfileHeader userInfo={userInfo} />}
                    <hr className="my-4 border-netural-200" />
                    {renderSectionContent()}
                    {showLanguageOptions && (
                        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-lg p-6 w-72">
                                <div className="font-semibold mb-3 text-center">{t("Language")}</div>
                                <ul>
                                    {languageOptions.map((opt) => (
                                        <li key={opt.code}>
                                            <button
                                                className="w-full py-2 text-left hover:bg-gray-100 rounded transition text-gray-700"
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
            </IonContent>
        </IonPage>
    );
};

export default Profile;
