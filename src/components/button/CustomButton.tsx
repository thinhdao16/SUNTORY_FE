import React from "react";
import { useHistory } from "react-router-dom";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    imgSrc?: string;
    imgAlt?: string;
    imgClassName?: string;
    navigateTo?: string;
    back?: boolean;
    icon?: React.ReactNode; // Thêm prop icon
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
    icon, // Nhận prop icon
    ...rest
}) => {
    const history = useHistory();

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
        <button className={className} onClick={handleClick} {...rest}>
            {icon
                ? icon
                : imgSrc
                    ? <img src={imgSrc} alt={imgAlt} className={imgClassName} />
                    : null}
            {children}
        </button>
    );
};

export default CustomButton;