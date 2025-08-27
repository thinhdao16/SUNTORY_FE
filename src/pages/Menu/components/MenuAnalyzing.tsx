import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import MenuIcon from "@/icons/logo/menu/menu-icon.svg?react";
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { menuAnalyzing } from '@/services/menu/menu-service';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';
import { useMenuSignalR } from '@/hooks/useMenuSignalR';

interface LocationState {
    base64Img: string;
}

const MenuAnalyzing: React.FC = () => {
    const location = useLocation<LocationState>();
    const history = useHistory();
    const { t } = useTranslation();
    const base64Img = location.state?.base64Img || "";
    const [totalFood, setTotalFood] = useState(0);
    const [menuId, setMenuId] = useState(0);
    const foodSuccess = useMenuTranslationStore(state => state.foodSuccess);
    const setFoodSuccess = useMenuTranslationStore(state => state.setFoodSuccess);
    // State cho Step 1: Analyzing Menu Content
    const [analyzingMenuContentProgress, setAnalyzingMenuContentProgress] = useState(0);
    const [isActiveAnalyzingMenuContent, setIsActiveAnalyzingMenuContent] = useState(true);
    const [isCompletedAnalyzingMenuContent, setIsCompletedAnalyzingMenuContent] = useState(false);

    // State cho Step 2: Interpreting Nutritional Data
    const [interpretingNutritionalDataProgress, setInterpretingNutritionalDataProgress] = useState(0);
    const [isActiveInterpretingNutritionalData, setIsActiveInterpretingNutritionalData] = useState(false);
    const [isCompletedInterpretingNutritionalData, setIsCompletedInterpretingNutritionalData] = useState(false);

    // State cho Step 3: Generating Dish Images
    const [generatingDishImagesProgress, setGeneratingDishImagesProgress] = useState(0);
    const [isActiveGeneratingDishImages, setIsActiveGeneratingDishImages] = useState(false);
    const [isCompletedGeneratingDishImages, setIsCompletedGeneratingDishImages] = useState(false);

    // Ref để quản lý interval trong analyzeMenu
    const analyzeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useMenuSignalR(menuId.toString());
    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
    };

    const analyzeMenu = async () => {
        try {
            const formData = new FormData();
            const file = base64ToFile(base64Img, "gallery.png");
            formData.append("file", file);
            const result = await menuAnalyzing(formData);
            console.log("result", result);
            if (result?.data != null) {
                setMenuId(result.data.id);
                setTotalFood(result.data.totalFood);
                setAnalyzingMenuContentProgress(100);
                setIsActiveAnalyzingMenuContent(false);
                setIsCompletedAnalyzingMenuContent(true);
            }
            else {
                setAnalyzingMenuContentProgress(100);
                setInterpretingNutritionalDataProgress(100);
                setGeneratingDishImagesProgress(100);
            }

        } catch (error) {
            setIsActiveAnalyzingMenuContent(false);
            setIsCompletedAnalyzingMenuContent(true);
        }
    }

    // Effect cho Step 1: Analyzing Menu Content
    useEffect(() => {
        // Reset food success when start a new analyzing
        setFoodSuccess(0);
        const interval = setInterval(() => {
            setAnalyzingMenuContentProgress(prev => {
                // if >= 80 (or 100), keep it and stop interval to avoid going back to 80
                if (prev >= 80) {
                    clearInterval(interval);
                    return prev;
                }
                const next = Math.min(prev + 1, 80);
                if (next >= 80) {
                    clearInterval(interval);
                }
                return next;
            });
        }, 100);
        analyzeMenu();
        return () => {
            clearInterval(interval);
            if (analyzeIntervalRef.current) {
                clearInterval(analyzeIntervalRef.current);
                analyzeIntervalRef.current = null;
            }
        };
    }, [setFoodSuccess]);

    // Effect cho Step 2: Interpreting Nutritional Data
    useEffect(() => {
        if (isCompletedAnalyzingMenuContent) {
            const startTimeout = setTimeout(() => {
                setIsActiveInterpretingNutritionalData(true);

                const interval = setInterval(() => {
                    setInterpretingNutritionalDataProgress(prev => {
                        const newProgress = Math.min(prev + 4, 100);
                        if (newProgress >= 100) {
                            clearInterval(interval);
                            setIsActiveInterpretingNutritionalData(false);
                            setIsCompletedInterpretingNutritionalData(true);
                        }
                        return newProgress;
                    });
                }, 120);
                return () => clearInterval(interval);
            }, 1000);

            return () => {
                clearTimeout(startTimeout);
            };
        }
    }, [isCompletedAnalyzingMenuContent]);

    // Effect cho Step 3: Generating Dish Images
    const navigatedRef = useRef(false);

    useEffect(() => {
        if (totalFood === 0) return;
        // set generating dish images progress
        setIsActiveGeneratingDishImages(true);
        //calculate progress
        const currentProgress = (foodSuccess / totalFood) * 100;
        setGeneratingDishImagesProgress(
            foodSuccess >= totalFood ? 100 : Math.min(Number(currentProgress.toFixed(2)), 99.9)
        );

        if (
            foodSuccess >= totalFood &&
            isCompletedAnalyzingMenuContent &&
            isCompletedInterpretingNutritionalData &&
            menuId > 0 &&
            !navigatedRef.current
        ) {
            // make sure progress is 100%
            setGeneratingDishImagesProgress(100);
            setIsActiveGeneratingDishImages(false);
            setIsCompletedGeneratingDishImages(true);
            setTimeout(() => {
                navigatedRef.current = true;
                history.push('/food-list', { menuId });
                useMenuTranslationStore.getState().setIsConnected(false);
            }, 1500);
        }

    }, [
        foodSuccess,
        totalFood,
        isCompletedAnalyzingMenuContent,
        isCompletedInterpretingNutritionalData,
        history,
        menuId
    ]);

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <div className="flex flex-col min-h-full">
                    {/* Top Section - Icon */}
                    <div className="flex items-center justify-center pt-16 mb-8">
                        <div className="text-center">
                            <MenuIcon className="w-32 h-32 mx-auto" />
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div className="text-center mb-12 px-4">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            {t('Analyzing...')}
                        </h1>
                        <p className="text-base text-gray-600 leading-relaxed max-w-xs mx-auto">
                            {t('We are currently analyzing your menu.')}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex-1 px-6">
                        {/* Step 1: Analyzing Menu Content */}
                        <div className="mb-8">
                            <div className="flex items-center mb-3">
                                <h3 className={`text-base font-semibold`}>
                                    {t('Analyzing Menu Content')}
                                </h3>
                            </div>
                            <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-3" style={{ height: '55px', borderRadius: '16px' }}>
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${isActiveAnalyzingMenuContent ? 'bg-green-500' :
                                            isCompletedAnalyzingMenuContent ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                        style={{ width: `${analyzingMenuContentProgress}%`, height: '55px', borderRadius: '16px' }}
                                    />
                                </div>
                                <div className="absolute left-4 top-2 mt-1">
                                    <span className="text-sm font-semibold text-light-blue-600" style={{ fontSize: '25px', color: '#FFFFFF' }}>
                                        {analyzingMenuContentProgress}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Interpreting Nutritional Data */}
                        <div className="mb-8">
                            <div className="flex items-center mb-3">
                                <h3 className={`text-base text-black`}>
                                    {t('Interpreting Nutritional Data')}
                                </h3>
                            </div>
                            <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full" style={{ height: '12px', borderRadius: '16px' }}>
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${isActiveInterpretingNutritionalData ? 'bg-green-500' :
                                            isCompletedInterpretingNutritionalData ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                        style={{ width: `${interpretingNutritionalDataProgress}%`, height: '12px', borderRadius: '16px' }}
                                    />
                                </div>
                                {isActiveInterpretingNutritionalData && (
                                    <div className="absolute right-0 top-4 mt-1">
                                        <span className="text-sm font-semibold text-green-600">
                                            {interpretingNutritionalDataProgress}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Generating Dish Images */}
                        <div className="mb-8">
                            <div className="flex items-center mb-3">
                                <h3 className={`text-base text-black`}>
                                    {t('Generating Dish Images')}
                                </h3>
                            </div>
                            <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full" style={{ height: '12px', borderRadius: '16px' }}>
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${isActiveGeneratingDishImages ? 'bg-green-500' :
                                            isCompletedGeneratingDishImages ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                        style={{ width: `${generatingDishImagesProgress}%`, height: '12px', borderRadius: '16px' }}
                                    />
                                </div>
                                {isActiveGeneratingDishImages && (
                                    <div className="absolute right-0 top-4 mt-1">
                                        <span className="text-sm font-semibold text-green-600">
                                            {generatingDishImagesProgress}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MenuAnalyzing;