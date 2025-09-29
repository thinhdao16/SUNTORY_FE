import React, { useEffect, useRef, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    food: {
        id: string;
        name: string;
        originalName: string;
        image: string;
        description: string;
        calories: number;
        fat: number;
        protein: number;
        carbohydrates: number;
        fiber: number;
        sugar: number;
        advice: string;
        ingredients: string[];
    } | null;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ isOpen, onClose, food, translateY, handleTouchStart, handleTouchMove, handleTouchEnd, showOverlay = true }) => {
    const { t } = useTranslation();
    if (!isOpen || !food) return null;
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    console.log("ingredients: ", food.ingredients);

    const SHEET_MAX_VH = 85; 
    const HEADER_PX = 56; 

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-151 h-full flex justify-center items-end ${showOverlay ? 'bg-black/50' : 'bg-transparent'}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <div
                        className="w-full rounded-t-3xl shadow-lg bg-white overflow-hidden"
                        style={{ 
                            maxHeight: `${SHEET_MAX_VH}vh`, 
                            marginTop: 16, 
                            transform: `translateY(${translateY}px)`, 
                            touchAction: 'none',
                            transition: 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            willChange: 'transform'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Header (drag handle area) */}
                        <div
                            className="px-2"
                            style={{ minHeight: HEADER_PX, display: 'flex', alignItems: 'center', touchAction: 'none' }}
                        >
                            <IonButton
                                fill="clear"
                                onClick={onClose}
                                style={{ width: 56, height: HEADER_PX, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden'
                                }}
                            >
                                {food.name}
                            </div>
                            {/* Right spacer to balance the close button so title stays centered */}
                            <div style={{ width: 56, height: HEADER_PX }} />
                        </div>

                        {/* Scrollable Body */}
                        <div
                            style={{
                                maxHeight: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                overflowY: 'auto'
                            }}
                        >
                            {/* Image */}
                            <div className="px-4 pt-2">
                                <div className="bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center mx-auto">
                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        className="w-full h-full object-contain rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="px-5 py-5 pb-24">
                                <h2 className="text-base font-semibold text-gray-900 mb-2 text-left">1. {t('Dish Name')}: {food.name} ({food.originalName})</h2>
                                <p className="text-gray-600 text-sm leading-6 mb-6">{food.description}</p>
                                <div className='border-b border-gray-200 mb-6'></div>
                                <div className="mb-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-3">{'2. ' + t('Nutrition at a Glance')}</h2>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Calories')}:</span><span className="text-gray-500">{food.calories}</span><span className="text-gray-500">kcal</span></div>
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Fat')}:</span><span className="text-gray-500">{food.fat}</span><span className="text-gray-500">g</span></div>
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Protein')}:</span><span className="text-gray-500">{food.protein}</span><span className="text-gray-500">g</span></div>
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Carbohydrates')}:</span><span className="text-gray-500">{food.carbohydrates}</span><span className="text-gray-500">g</span></div>
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Fiber')}:</span><span className="text-gray-500">{food.fiber}</span><span className="text-gray-500">g</span></div>
                                        <div className="flex gap-1"><span className="font-semibold text-gray-900">{t('Sugar')}:</span><span className="text-gray-500">{food.sugar}</span><span className="text-gray-500">g</span></div>
                                    </div>
                                </div>
                                <div className='border-b border-gray-200 mb-6'></div>
                                <div className="mb-2">  
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">{'3. ' + t('What\'s Inside')}</h3>
                                    {
                                        food.ingredients.map((ingredient, index) => (
                                            <div key={index} className="text-black">
                                                <span className="font-semibold mr-1">•</span>
                                                <span className="font-normal">{ingredient}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className='border-b border-gray-200 mb-6'></div>
                                <div className="mb-2">  
                                    <h3 className="text-base font-semibold text-gray-900 mb-3">{'3. ' + t('Advice')}</h3>
                                    {/* Render advice với hỗ trợ **bold** và xuống dòng */}
                                    {(() => {
                                        const formatAdviceToHtml = (text: string) => {
                                            if (!text) return '';
                                            // Escape HTML trước khi chèn
                                            const escaped = text
                                                .replace(/&/g, '&amp;')
                                                .replace(/</g, '&lt;')
                                                .replace(/>/g, '&gt;');
                                            // **bold** -> <strong>
                                            const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                            // \n -> <br/>
                                            const withBreaks = bolded.replace(/\n/g, '<br/>');
                                            return withBreaks;
                                        };
                                        return (
                                            <div className="rounded-xl border p-4 mb-6" style={{ borderColor: '#1FB356' , backgroundColor: '#E9FFD9'}}>
                                                <div className="font-semibold text-gray-900 mb-2">{t('Recommendations')}:</div>
                                                <div
                                                    className="text-gray-700 text-sm leading-6"
                                                    dangerouslySetInnerHTML={{ __html: formatAdviceToHtml(food.advice) }}
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FoodDetailModal;
