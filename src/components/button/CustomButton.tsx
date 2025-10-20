import { LanguageSwitcher, useLanguageSwitcher } from "@/pages/Home";
import React from "react";
import { useHistory } from "react-router-dom";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    imgSrc?: string;
    imgAlt?: string;
    imgClassName?: string;
    navigateTo?: string;
    back?: boolean;
    icon?: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
    imgSrc,
    imgAlt = "",
    imgClassName = "",
    navigateTo,
    back = false,
    className = "",
    children,
    onClick,
    icon,
    ...rest
}) => {
    const history = useHistory();
    const languageSwitcher = useLanguageSwitcher();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (back) {
            history.goBack();
        } else if (navigateTo) {
            history.push(navigateTo);
        }
        if (onClick) {
            onClick(e);
        }
    };
    return (
        <div className={`${className}`}>
            <div className={`w-full flex justify-between items-center `}>
                <button onClick={handleClick} {...rest}>
                    {icon
                        ? icon
                        : imgSrc
                            ? <img src={imgSrc} alt={imgAlt} className={imgClassName} />
                            : null}
                </button>
                <LanguageSwitcher {...languageSwitcher} isFeeching={false} classNameButton="border border-main" />
                {children}
            </div>
        </div>
    );
};

export default CustomButton;