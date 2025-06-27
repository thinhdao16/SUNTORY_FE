import React from "react";

export const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
    fallbackSrc: string
) => {
    event.currentTarget.src = fallbackSrc;
};