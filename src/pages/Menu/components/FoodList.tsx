import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonSkeletonText, IonCard, IonCardContent, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chevronBack } from 'ionicons/icons';
import { FoodModel } from '@/services/menu/menu-types';
import { getMenuFoodList } from '@/services/menu/menu-service';
import FoodDetailModal from '@/components/common/bottomSheet/FoodDetailModal';

interface LocationState {
    menuId?: number;
}

const FoodList: React.FC = () => {
    const history = useHistory();
    const location = useLocation<LocationState>();
    const { t } = useTranslation();
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
    const mockFoods: FoodModel[] = [
        {
            id: 1,
            name: 'Cheese Burger',
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&crop=center',
            price: 120000,
            description: 'Juicy beef patty with melted cheese',
            calories: 650,
            carbohydrates: 45
        },
        {
            id: 2,
            name: 'Cheese Sandwich',
            imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop&crop=center',
            price: 85000,
            description: 'Grilled sandwich with melted cheese',
            calories: 420,
            carbohydrates: 32
        },
        {
            id: 3,
            name: 'Chicken Burger',
            imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=300&h=200&fit=crop&crop=center',
            price: 135000,
            description: 'Crispy chicken breast with fresh vegetables',
            calories: 580,
            carbohydrates: 42
        },
        {
            id: 4,
            name: 'Spicy Chicken',
            imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop&crop=center',
            price: 155000,
            description: 'Hot and spicy chicken wings',
            calories: 720,
            carbohydrates: 12
        },
        {
            id: 5,
            name: 'Hotdog',
            imageUrl: 'https://images.unsplash.com/photo-1612392062798-2306f3441ce8?w=300&h=200&fit=crop&crop=center',
            price: 70000,
            description: 'Classic hotdog with mustard and ketchup',
            calories: 380,
            carbohydrates: 28
        },
        {
            id: 6,
            name: 'Fruit Salad',
            imageUrl: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=300&h=200&fit=crop&crop=center',
            price: 80000,
            description: 'Fresh mixed fruits with honey dressing',
            calories: 150,
            carbohydrates: 38
        }
    ];

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
                    setFoods(mockFoods);
                    setHasNextPage(false);
                }
            }
        } catch (err) {
            if (!isLoadMore) {
                setFoods(mockFoods);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setFoods([]);
        setPage(0);
        if (menuId) {
            loadFoods(menuId, 0, pageSize, false);
        } else {
            setFoods(mockFoods);
            setLoading(false);
        }
    }, [menuId]);

    const handleBack = () => {
        history.goBack();
    };

    const handleInfiniteScroll = async (event: CustomEvent<void>) => {
        if (!loadingMore && hasNextPage && page + 1 < maxPages) {
            const nextPage = page + 1;
            setPage(nextPage);

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadFoods(6, nextPage, pageSize, true);
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
        setIsModalOpen(false);
        setSelectedFood(null);
    };

    const renderFoodItem = (food: FoodModel, index: number) => (
        <div
            key={`food-${food.id}-${index}`}
            className="bg-white rounded-xl overflow-hidden cursor-pointer"
            onClick={() => {
                setSelectedFood(food);
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
            <div className="p-1">
                <h3 className="text-gray-900 mb-1 line-clamp-1" style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '21px',
                    letterSpacing: '0%'
                }}>
                    {food.name}
                </h3>
            </div>
        </div>
    );

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '56px',
                        paddingTop: 'env(safe-area-inset-top, 0)'
                    }}>
                        <IonButton
                            fill="clear"
                            onClick={handleBack}
                            style={{ margin: 0, padding: '8px', minWidth: 'auto' }}
                        >
                            <IonIcon icon={chevronBack} className="text-gray-700" />
                        </IonButton>
                        <div style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: '600',
                            marginLeft: '-48px'
                        }}>
                            {t('Your Dish Images')}
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="pb-24">
                    {loading ? (
                        renderSkeleton()
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {foods.map((food, index) => renderFoodItem(food, index))}
                        </div>
                    )}

                    {!loading && foods.length === 0 && !error && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">
                                {t('No food found')}
                            </p>
                            <IonButton
                                fill="outline"
                                onClick={() => history.push('/menu-translation/scan-menu')}
                            >
                                {t('Scan new menu')}
                            </IonButton>
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
            </IonContent>

            {/* Food Detail Modal */}
            <FoodDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                food={selectedFood ? {
                    id: selectedFood.id.toString(),
                    name: selectedFood.name,
                    image: selectedFood.imageUrl,
                    description: selectedFood.description || 'A delicious dish with fresh ingredients.',
                    calories: selectedFood.calories || 0,
                    carbohydrates: selectedFood.carbohydrates || 0,
                    fat: selectedFood.fat || 0,
                    sugar: selectedFood.sugar || 0,
                    fiber: selectedFood.fiber || 0,
                    protein: 0
                } : null}
            />
        </IonPage>
    );
};

export default FoodList;
