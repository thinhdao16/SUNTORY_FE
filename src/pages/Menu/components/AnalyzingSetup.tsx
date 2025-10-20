import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from "@/icons/logo/menu/menu-icon.svg?react";
import { useLocation } from 'react-router-dom';
import { updateHealthCondition } from '@/services/auth/auth-service';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';

interface LocationState {
    payload: any;
}

const AnalyzingSetup: React.FC = () => {
    const history = useHistory();
    const [progress, setProgress] = useState(0);
    const location = useLocation<LocationState>();
    const { setDiet, setSavedAllergiesStore, setSelectedAllergiesStore } = useMenuTranslationStore();

    const data = location.state?.payload;

    // Call API and handle response
    const handleUpdateHealth = async () => {
        try {
            const payload: any = {
                lifestyleId: data?.lifestyleId || "0",
                allergies: data?.allergies || []
            };
            console.log(payload);
            const result = await updateHealthCondition(payload);
            if (result.data === true) {
                // Animate to 100%
                const finalInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(finalInterval);
                            setTimeout(() => {
                                // Reset 3 state sau khi lưu và trước khi điều hướng
                                setDiet("0");
                                setSavedAllergiesStore([]);
                                setSelectedAllergiesStore([]);
                                history.push("/menu-translation/scan-menu");
                            }, 1000);
                            return 100;
                        }
                        return prev + 2;
                    });
                }, 30);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        // Start progress animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 75) {
                    clearInterval(interval);
                    return 75;
                }
                return prev + 1;
            });
        }, 50); // Update every 50ms for smooth animation
        handleUpdateHealth();
        return () => clearInterval(interval);
    }, [data]);

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <div className="flex flex-col">
                    {/* Top Section - Icon */}
                    <div className="flex-1 flex items-center justify-center pt-16">
                        <div className="text-center">
                            <MenuIcon className="w-36 h-36 mx-auto" />
                        </div>
                    </div>

                    {/* Middle Section - Title & Description */}
                    <div className="flex-1 flex flex-col justify-center px-8 min-h-[20vh]">
                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6 leading-tight">
                            {t('Analyzing health data...')}
                        </h1>
                        <p className="text-lg text-gray-600 text-center leading-relaxed max-w-sm mx-auto mb-12">
                            {t('We are currently analyzing your health data to provide you with the most accurate and personalized insights to support your well-being.')}
                        </p>
                    </div>

                    {/* Progress Section */}
                    <div className="flex-1 flex justify-center items-center pb-20">
                        <div className="relative w-48 h-48">
                            {/* Background Circle */}
                            <svg className="w-48 h-48" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="#e5e7eb"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                    style={{
                                        transition: 'stroke-dashoffset 0.3s ease-in-out',
                                        transform: 'rotate(90deg) scaleX(-1)',
                                        transformOrigin: '50% 50%'
                                    }}
                                />
                            </svg>
                            {/* Percentage Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-bold text-gray-900">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </IonContent>
        </IonPage>
    );
};

export default AnalyzingSetup;