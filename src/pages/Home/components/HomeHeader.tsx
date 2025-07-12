import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openSidebarWithAuthCheck } from '@/store/zustand/ui-store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserStatsCard } from './UserStatsCard';
import { useLanguageSwitcher } from '../hooks/useLanguageSwitcher';
import { useUserStats } from '../hooks/useUserStats';

import NavBarHomeIcon from "@/icons/logo/nav_bar_home.svg?react";
import VectorRightIcon from "@/icons/logo/vector_right.svg?react";

interface HomeHeaderProps {
    userInfo: any;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userInfo }) => {
    const history = useHistory();
    const { t } = useTranslation();
    const languageSwitcher = useLanguageSwitcher();
    const { age, height, weight, bmi } = useUserStats(userInfo);

    return (
        <div className="relative rounded-b-3xl overflow-hidden px-6 pt-4 h-[318px]">
            <div
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    backgroundImage: 'url("background/background_radi_home_header.svg")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <button onClick={() => openSidebarWithAuthCheck()}>
                        <NavBarHomeIcon />
                    </button>

                    <LanguageSwitcher {...languageSwitcher} />
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex items-start gap-2 mt-6">
                        {userInfo?.id ? (
                            <div className="text-white text-2xl font-semibold truncate max-w-[250px] min-w-0">
                                {t("Hi,")} {userInfo?.lastname || userInfo?.email || t("Guest")}
                            </div>
                        ) : (
                            <div className="text-white text-2xl font-semibold truncate min-w-0">
                                {t("Welcome")}
                            </div>
                        )}
                    </div>

                    {userInfo?.id ? (
                        <a
                            className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap"
                            onClick={() => history.push("/profile/")}
                            style={{ cursor: "pointer" }}
                        >
                            <span>{t("Update Profile")}</span>
                            <span className="bg-white rounded-full flex items-center justify-center h-[13px] w-[13px]">
                                <VectorRightIcon className="w-[8px]" />
                            </span>
                        </a>
                    ) : (
                        <a
                            className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis"
                            onClick={() => history.push("/login")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap block">{t("Login")}</span>
                        </a>
                    )}
                </div>

                <UserStatsCard bmi={bmi} age={age} height={height} weight={weight} />
            </div>
        </div>
    );
};
