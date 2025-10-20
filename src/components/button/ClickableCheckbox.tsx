import React from "react";

interface ClickableCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: React.ReactNode;
    className?: string;
    labelClassName?: string;
    id?: string;
}

const ClickableCheckbox: React.FC<ClickableCheckboxProps> = ({
    checked,
    onChange,
    label,
    className = "flex items-center justify-between px-4 py-3 rounded-xl bg-success-500 cursor-pointer select-none",
    labelClassName = "text-netural-500",
    id = undefined,
}) => {
    return (
        <div
            className={className}
            onClick={() => onChange(!checked)}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === " " || e.key === "Enter") {
                    onChange(!checked);
                }
            }}
        >
            <span className={labelClassName}>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                id={id}
                className="accent-blue-600 w-5 h-5 rounded border-gray-300 pointer-events-none"
                tabIndex={-1}
                readOnly
            />
        </div>
    );
};

export default ClickableCheckbox;