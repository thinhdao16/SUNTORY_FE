import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import MenuIcon from "@/icons/logo/menu/menu-icon.svg?react";
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { menuAnalyzing } from '@/services/menu/menu-service';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';

interface LocationState {
    base64Img: string;
    menuId?: number;
}

const MenuAnalyzing: React.FC = () => {
    const location = useLocation<LocationState>();
    const history = useHistory();
    const { t } = useTranslation();
    const base64Img = location.state?.base64Img || "";
    const [totalFood, setTotalFood] = useState(0);
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
    // Refs để quản lý timeout hoàn tất step 2 và 3 sau 2s
    const step2TimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const step3TimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            if (result?.data != null) {
                setTotalFood(result.data.totalFood);
                setAnalyzingMenuContentProgress(100);
                setIsActiveAnalyzingMenuContent(false);
                setIsCompletedAnalyzingMenuContent(true);
                // Khi analyzeMenu xong, sau 2s đẩy Step 2 và 3 lên 100%
                setIsActiveInterpretingNutritionalData(true);
                setIsActiveGeneratingDishImages(true);
                if (step2TimeoutRef.current) clearTimeout(step2TimeoutRef.current);
                if (step3TimeoutRef.current) clearTimeout(step3TimeoutRef.current);
                step2TimeoutRef.current = setTimeout(() => {
                    setInterpretingNutritionalDataProgress(100);
                    setIsActiveInterpretingNutritionalData(false);
                    setIsCompletedInterpretingNutritionalData(true);
                }, 2000);
                step3TimeoutRef.current = setTimeout(() => {
                    setGeneratingDishImagesProgress(100);
                    setIsActiveGeneratingDishImages(false);
                    setIsCompletedGeneratingDishImages(true);
                    // Điều hướng sang danh sách món ăn sau khi hoàn tất Step 3 và truyền menuId
                    history.push('/food-list', { menuId: result.data.id });
                }, 2000);
            }
            else {
                setIsCompletedInterpretingNutritionalData(true);
                setIsCompletedGeneratingDishImages(true);
                setAnalyzingMenuContentProgress(100);
                setInterpretingNutritionalDataProgress(100);
                setGeneratingDishImagesProgress(100);

                setTimeout(() => {
                    history.push('/food-list');
                }, 1500);
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
            if (step2TimeoutRef.current) {
                clearTimeout(step2TimeoutRef.current);
                step2TimeoutRef.current = null;
            }
            if (step3TimeoutRef.current) {
                clearTimeout(step3TimeoutRef.current);
                step3TimeoutRef.current = null;
            }
        };
    }, [setFoodSuccess]);

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

                    {/* Bottom Spacer để tránh bị vướng với BottomTabBar */}
                    <div className="h-20"></div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MenuAnalyzing;