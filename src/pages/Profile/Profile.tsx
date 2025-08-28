import { useAuthStore } from "@/store/zustand/auth-store";
import { openSidebarWithAuthCheck } from "@/store/zustand/ui-store";
import { IonContent, IonPage } from "@ionic/react";
import React, { useState } from "react";
import { IoChevronForward } from "react-icons/io5";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useAuthInfo } from "../Auth/hooks/useAuthInfo";
import i18n from "@/config/i18n";
import { ProfileHeader } from "./ProfileHeader";
import AccountEdit from "./AccountEdit/AccountEdit";
import HealthInformationEdit from "./HealthInformationEdit/HealthInformationEdit";
import BackIcon from "@/icons/logo/back.svg?react";
import NavBarHomeHistoryIcon from "@/icons/logo/nav_bar_home_history.svg?react";
import PageContainer from "@/components/layout/PageContainer";
import ChangePassword from "../Auth/ChangePassword/ChangePassword";
import { useLogout } from "./hooks/useLogout";


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
    const location = useLocation<{ from?: string }>();
    const handleLogout = useLogout();
    const handleChangeLanguage = (status: boolean, lang?: string) => {
        setShowLanguageOptions(status);
    };
    const shortLang = i18n.language?.split("-")[0] || "en";

    const currentLang = languageOptions.find(opt => opt.code === shortLang)?.label || shortLang;


    // Thêm trường chevron vào từng item
    const menuItems = [
        { label: t("Account"), onClick: () => history.replace("/profile/account"), chevron: true },
        // { label: t("Update Health Information"), onClick: () => history.replace("/profile/health"), chevron: true },
        { label: t("Change Password"), onClick: () => history.push("/profile/change-password"), chevron: true },
        { label: `${t("Language")} (${currentLang})`, onClick: () => handleChangeLanguage(true, "en"), chevron: true },
        // { label: t("Help & Feedback"), onClick: () => { }, chevron: false },
        { label: t("Logout"), onClick: () => { handleLogout() }, chevron: false },
    ];
    const { data: userInfo, refetch, isLoading } = useAuthInfo();
    const renderSectionContent = () => {
        switch (section) {
            case "account":
                return <AccountEdit />;
            case "health": return <HealthInformationEdit />;
            case "change-password": return <ChangePassword />;
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
                                    {item.chevron && <IoChevronForward className="text-lg text-gray-400" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                );
        }
    };
    return (
        <PageContainer className="">
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-[9999]">
                    <div className="loader border-4 border-white border-t-main rounded-full w-12 h-12 animate-spin"></div>
                </div>
            )}
            <div className="min-h-screen max-h-[calc(100vh-200px)] overflow-y-auto bg-white flex flex-col px-6 pb-24"
            // style={{ paddingTop: "var(--safe-area-inset-top)" }}
            >
                <div className="flex items-center h-16 mb-2">
                    {section ? (
                        <button
                            className="flex items-center gap-2 text-main font-medium"
                            onClick={() => {
                                const from = location.state?.from;
                                if (from === "home") {
                                    history.replace("/");
                                } else {
                                    history.replace("/profile");
                                }
                            }}
                        >
                            <BackIcon aria-label="Back" />
                        </button>
                    ) : (
                        <button
                            className="mr-auto"
                            onClick={openSidebarWithAuthCheck}
                        >
                            <NavBarHomeHistoryIcon aria-label="Menu" />
                        </button>
                    )}
                </div>
                {userInfo && <ProfileHeader userInfo={userInfo} refetchAuthInfo={refetch} />}
                <hr className="my-4 border-netural-200" />
                <div className=" bg-white flex flex-col">
                    <div className="pb-20">
                        {renderSectionContent()}
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
