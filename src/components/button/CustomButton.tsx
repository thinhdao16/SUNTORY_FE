import React from "react";
import { useHistory } from "react-router-dom";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    imgSrc?: string;
    imgAlt?: string;
    imgClassName?: string;
    navigateTo?: string;
    back?: boolean; // Thêm prop này
}

const CustomButton: React.FC<CustomButtonProps> = ({
    imgSrc,
    imgAlt = "",
    imgClassName = "",
    navigateTo,
    back = false, // Mặc định không back
    className = "",
    children,
    onClick,
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
            {imgSrc && <img src={imgSrc} alt={imgAlt} className={imgClassName} />}
            {children}
        </button>
    );
};

export default CustomButton;