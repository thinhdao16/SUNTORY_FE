import React, { ReactNode } from "react";
import { IonModal } from "@ionic/react";
import "./BottomSheet.css";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | null;
    showCloseButton?: boolean;
    children: ReactNode;
    className?: string;
    maxWidth?: string;
    classNameContainer?:string
}

const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    showCloseButton = true,
    children,
    className = "",
    maxWidth = "450px",
    classNameContainer,
}) => {
    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            backdropDismiss
            canDismiss
            breakpoints={[0, 1]}
            initialBreakpoint={1}
            className={`bottom-sheet ${className}`}
        >
            <div 
                className={`bg-white rounded-t-[20px] p-6 w-full mx-auto shadow-lg ${classNameContainer}`}
                style={{ maxWidth }}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            {title && (
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {title}
                                </h3>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="pb-4">
                    {children}
                </div>
            </div>
        </IonModal>
    );
};

export default BottomSheet;
