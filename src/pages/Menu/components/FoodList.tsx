import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent, IonButtons, IonTitle, IonFooter } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { arrowBack, key } from 'ionicons/icons';
import { FoodModel } from '@/services/menu/menu-types';
import NoDishImageIcon from '@/icons/logo/menu/no-dish-image.svg?react';
import { getMenuFoodList } from '@/services/menu/menu-service';
import FoodDetailModal from '@/components/common/bottomSheet/FoodDetailModal';
import {
    handleTouchStart as handleTouchStartUtil,
    handleTouchMove as handleTouchMoveUtil,
    handleTouchEnd as handleTouchEndUtil,
} from '@/utils/translate-utils';
import { useMenuSignalR } from '@/hooks/useMenuSignalR';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';
import { useAuthStore } from '@/store/zustand/auth-store';

interface LocationState {
    menuId?: number;
}

const FoodList: React.FC = () => {
    const history = useHistory();
    const location = useLocation<LocationState>();
    const menuId = location.state?.menuId;
    const [foods, setFoods] = useState<FoodModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string>('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(8);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [maxPages, setMaxPages] = useState(0); // Circuit breaker: max 10 pages
    const [selectedFood, setSelectedFood] = useState<FoodModel | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const [showEmptyState, setShowEmptyState] = useState(false);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const screenHeightRef = useRef(window.innerHeight);
    const velocityThreshold = 0.4;
    const [bottomBarHeight, setBottomBarHeight] = useState(80);
    const user = useAuthStore((state) => state.user);
    const { foodSuccess, foodFailed } = useMenuTranslationStore();

    useMenuSignalR(menuId?.toString() || "", user?.id?.toString() || "");
    
    // Force loading for 45 seconds before showing content
    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 45000); // 45 seconds

        return () => clearTimeout(timeout);
    }, []);

    // Timeout 45 seconds to show empty state
    useEffect(() => {
        if (!loading && foods.length === 0) {
            const timeout = setTimeout(() => {
                setShowEmptyState(true);
            }, 1000); // 1 second after loading stops

            return () => clearTimeout(timeout);
        } else if (foods.length > 0) {
            setShowEmptyState(false);
        }
    }, [loading, foods.length]);

    useEffect(() => {
        if (menuId) {
            loadFoods(menuId, 0, pageSize, false);
        }
    }, [foodSuccess, foodFailed]);


    const loadFoods = async (
        historyId: number,
        currentPage: number,
        pageSize: number,
        isLoadMore: boolean = false
    ) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            const response = await getMenuFoodList(historyId, currentPage, pageSize);
            const data = response.data?.data || [];
            const totalRecs = response.data?.totalRecords || 0;

            if (data.length > 0) {
                if (isLoadMore) {
                    setFoods(prevFoods => {
                        const existingIds = new Set(prevFoods.map(food => food.id));
                        const newFoods = data.filter((food: FoodModel) => !existingIds.has(food.id));
                        return [...prevFoods, ...newFoods];
                    });
                } else {
                    setFoods(data);
                }

                const calculatedMaxPages = Math.ceil(totalRecs / pageSize);
                setTotalRecords(totalRecs);
                setMaxPages(calculatedMaxPages);

                const currentTotalLoaded = isLoadMore
                    ? foods.length + data.length
                    : data.length;

                const hasMore = currentTotalLoaded < totalRecs;
                setHasNextPage(hasMore);
            } else {
                if (!isLoadMore) {
                    setHasNextPage(false);
                }
            }
        } catch (err) {
            if (!isLoadMore) {
            }
        } finally {
            // Only set loading to false for load more, not for initial load
            if (isLoadMore) {
                setLoadingMore(false);
            }
            // Initial loading will be controlled by the 45-second timeout
        }
    };

    useEffect(() => {
        setFoods([]);
        setPage(0);
        if (menuId) {
            loadFoods(menuId, 0, pageSize, false);
        }
        // Don't set loading to false here, let the 45-second timeout handle it
    }, [menuId]);

    useEffect(() => {
        const updateBottomBarHeight = () => {
            const el = document.getElementById('bottom-tab-bar');
            if (el) {
                const h = el.getBoundingClientRect().height || 60;
                setBottomBarHeight(h);
            } else {
                setBottomBarHeight(60);
            }
        };
        updateBottomBarHeight();
        const ro = (window as any).ResizeObserver ? new (window as any).ResizeObserver(updateBottomBarHeight) : null;
        if (ro) {
            const el = document.getElementById('bottom-tab-bar');
            if (el) ro.observe(el);
        }
        window.addEventListener('resize', updateBottomBarHeight);
        return () => {
            window.removeEventListener('resize', updateBottomBarHeight);
            if (ro) ro.disconnect();
        };
    }, []);

    const handleBack = () => {
        history.goBack();
    };

    const handleInfiniteScroll = async (event: CustomEvent<void>) => {
        if (!loadingMore && hasNextPage && page + 1 < maxPages) {
            const nextPage = page + 1;
            setPage(nextPage);

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadFoods(menuId || 0, nextPage, pageSize, true);
            } catch (error) {
                setHasNextPage(false); // stop infinite scroll nếu lỗi
            }
        } else {
            if (foods.length >= totalRecords) {
                setHasNextPage(false);
            }
        }

        (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    const renderSkeleton = () => (
        <div className="grid grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden">
                    <div className="bg-gray-200 rounded-2xl" style={{
                        width: '155.5px',
                        height: '155.5px'
                    }}>
                        <IonSkeletonText animated style={{ width: '155.5px', height: '155.5px' }} />
                    </div>
                    <div className="p-4">
                        <IonSkeletonText animated style={{ width: '80%', height: '16px' }} />
                        <IonSkeletonText animated style={{ width: '60%', height: '14px', marginTop: '8px' }} />
                        <div className="flex justify-between mt-2">
                            <IonSkeletonText animated style={{ width: '50%', height: '14px' }} />
                            <IonSkeletonText animated style={{ width: '30%', height: '14px' }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );


    const handleCloseModal = () => {
        setShowOverlay(false); // tắt overlay ngay lập tức
        setTranslateY(screenHeightRef.current); // animate panel xuống
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedFood(null);
            setTranslateY(0);
        }, 300);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handleTouchStartUtil(e, startYRef, startTimeRef);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleTouchMoveUtil(e, startYRef, screenHeightRef, setTranslateY);
    };

    const handleTouchEnd = () => {
        handleTouchEndUtil(
            translateY,
            startYRef,
            startTimeRef,
            screenHeightRef,
            velocityThreshold,
            handleCloseModal,
            setTranslateY
        );
    };

    const renderFoodItem = (food: FoodModel, index: number) => (
        <div
            key={`food-${food.id}-${index}`}
            className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm"
            onClick={() => {
                setSelectedFood(food);
                setTranslateY(0);
                setShowOverlay(true);
                setIsModalOpen(true);
            }}
        >
            {/* Image Container */}
            <div className="aspect-square relative overflow-hidden bg-gray-100 rounded-2xl">
                <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDcuNSA5MEwyMDcuNSAxMDBWMTMwSDkyLjVWMTAwTDE0Ny41IDkwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                />
            </div>

            {/* Content Container */}
            <div className="p-3">
                <h3 className="text-black mb-1 line-clamp-1" style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '22px',
                    letterSpacing: '0%'
                }}>
                    {food.name}
                </h3>
                <h3 className="text-gray-600 mb-1 line-clamp-1" style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0%'
                }}>
                    ({food.originalName})
                </h3>
                <h3 className="text-black line-clamp-1" style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '22px',
                    letterSpacing: '0%'
                }}>
                    {`${food.currency || ''} ${food.price}`}
                </h3>
            </div>
        </div>
    );

    return (
        <IonPage className="ion-page" style={{ '--background': 'white' } as any}>
            <IonHeader className="ion-no-border" style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                <IonToolbar style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                    <IonButtons slot="start">
                        <IonButton
                            fill="clear"
                            onClick={() => history.push('/menu-translation')}
                            className="ml-2"
                        >
                            <IonIcon icon={arrowBack} className="text-black font-bold text-xl" />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="text-center font-semibold" style={{ fontSize: '14px' }}>
                        {t('Your Dish Images')}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton className="opacity-0 pointer-events-none" fill="clear">
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                {/* Content */}
                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="pb-24 top-1 bg-white">
                    {loading ? (
                        renderSkeleton()
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {foods.map((food, index) => renderFoodItem(food, index))}
                        </div>
                    )}

                    {!loading && foods.length === 0 && !error && showEmptyState && (
                        <div className="flex flex-col items-center justify-start pt-6 pb-28 px-6 text-center">
                            <div className="mb-6">
                                <NoDishImageIcon className="w-40 h-40" />
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                {t("Oops! Your photo doesn't seem to be food-related or is too blurry.")}
                                <br />
                                {t('Please upload a clear, food-related image.')}
                            </p>
                            {/* Footer chỉ hiện khi danh sách rỗng */}
                            <div className="px-4 bg-white center" style={{ paddingTop: '8px' }}>
                                <IonButton
                                    expand="block"
                                    shape="round"
                                    className="h-12"
                                    style={{
                                        '--background': '#1152F4',
                                        '--background-hover': '#2563eb',
                                        '--ion-background-color': 'white',
                                        '--color': 'white',
                                        'fontWeight': 600,
                                        'borderRadius': '24px',
                                        width: '130%',
                                        transform: 'translateX(-15%)'
                                    }}
                                    onClick={() => history.push('/menu-translation/scan-menu')}
                                >
                                    {t('Retake')}
                                </IonButton>
                            </div>
                        </div>
                    )}

                    {/* Loading More Indicator */}
                    {loadingMore && (
                        <div className="flex justify-center py-4">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-gray-500 text-sm">{t('loading...')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Infinite Scroll */}
                {foods.length > 0 && (
                    <IonInfiniteScroll
                        onIonInfinite={handleInfiniteScroll}
                        threshold="100px"
                        disabled={!hasNextPage || loading}
                        className="pb-16"
                    >
                        <IonInfiniteScrollContent
                            loadingSpinner="bubbles"
                            loadingText={t('loading...')}
                        />
                    </IonInfiniteScroll>
                )}
            </IonContent>

            {/* Food Detail Modal */}
            <FoodDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                translateY={translateY}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                showOverlay={showOverlay}
                food={selectedFood ? {
                    id: selectedFood.id.toString(),
                    name: selectedFood.name,
                    originalName: selectedFood.originalName || '',
                    ingredients: selectedFood.foodComponents?.map((foodComponents) => foodComponents.name) || [],
                    image: selectedFood.imageUrl,
                    description: selectedFood.description || 'A delicious dish with fresh ingredients.',
                    calories: selectedFood.calories || 0,
                    carbohydrates: selectedFood.carbohydrates || 0,
                    fat: selectedFood.fat || 0,
                    sugar: selectedFood.sugar || 0,
                    fiber: selectedFood.fiber || 0,
                    protein: selectedFood.protein || 0,
                    advice: selectedFood.advice || ''
                } : null}
            />
        </IonPage>
    );
};

export default FoodList;
