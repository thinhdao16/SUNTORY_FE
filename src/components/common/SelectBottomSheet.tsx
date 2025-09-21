import React from "react";
import BottomSheet from "./BottomSheet";

interface SelectOption {
    id: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
}

interface SelectBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: SelectOption[];
    selectedValue?: string;
    onSelect: (value: string) => void;
    showCheckmark?: boolean;
}

const SelectBottomSheet: React.FC<SelectBottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
    showCheckmark = true
}) => {
    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => !option.disabled && handleSelect(option.id)}
                        disabled={option.disabled}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            option.disabled
                                ? "opacity-50 cursor-not-allowed"
                                : selectedValue === option.id
                                ? "bg-blue-50 border-2 border-blue-200"
                                : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                    >
                        {option.icon && (
                            <div className="text-2xl">{option.icon}</div>
                        )}
                        <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">{option.label}</div>
                            {option.description && (
                                <div className="text-sm text-gray-500">{option.description}</div>
                            )}
                        </div>
                        {showCheckmark && selectedValue === option.id && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
};

export default SelectBottomSheet;
