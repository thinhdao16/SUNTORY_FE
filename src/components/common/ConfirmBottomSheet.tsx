import React from "react";
import { useTranslation } from "react-i18next";
import BottomSheet from "./BottomSheet";

interface ConfirmBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmButtonColor?: string;
}

const ConfirmBottomSheet: React.FC<ConfirmBottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmButtonColor = "bg-red-500 hover:bg-red-600"
}) => {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            showCloseButton={false}
        >
            {/* Message */}
            <div className="mb-6">
                <p className="text-gray-600 text-center">{message}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                    {cancelText || t("Cancel")}
                </button>
                <button
                    onClick={handleConfirm}
                    className={`flex-1 py-3 px-4 ${confirmButtonColor} text-white font-medium rounded-xl transition-colors`}
                >
                    {confirmText || t("Confirm")}
                </button>
            </div>
        </BottomSheet>
    );
};

export default ConfirmBottomSheet;
