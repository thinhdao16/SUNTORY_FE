import React from "react";

interface MultiSelectButtonGroupProps<T extends string = string> {
    options: { label: string; value: T }[];
    value: T[];
    onChange: (val: T[]) => void;
    className?: string;
    buttonClassName?: string;
}

function MultiSelectButtonGroup<T extends string = string>({
    options,
    value,
    onChange,
    className = "",
    buttonClassName = "",
}: MultiSelectButtonGroupProps<T>) {
    return (
        <div className={`grid grid-cols-2 gap-2 ${className}`}>
            {options.map((option) => {
                const selected = value.includes(option.value);
                return (
                    <button
                        type="button"
                        key={option.value}
                        className={`rounded-xl text-sm h-[60px] p-3 ${selected ? "bg-main text-white" : "text-netural-400 bg-[#f0f0f0]"} ${buttonClassName}`}
                        onClick={() => {
                            const newValue = selected
                                ? value.filter((v) => v !== option.value)
                                : [...value, option.value];
                            onChange(newValue);
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default MultiSelectButtonGroup;