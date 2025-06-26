
interface RadioButtonGroupProps<T extends string = string> {
    options: T[];
    value: T;
    onChange: (val: T) => void;
    className?: string;
    buttonClassName?: string;
}

function RadioButtonGroup<T extends string = string>({
    options,
    value,
    onChange,
    className = "",
    buttonClassName = "",
}: RadioButtonGroupProps<T>) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
            {options.map((option) => (
                <button
                    type="button"
                    key={option}
                    className={`rounded-xl text-sm p-3 h-[60px] ${value === option ? "bg-main text-white" : "text-netural-400 bg-[#f0f0f0]"} ${buttonClassName}`}
                    onClick={() => onChange(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

export default RadioButtonGroup;