import React, { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";

interface RatingProps {
    initialRating?: number;
    onChange?: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({ initialRating = 0, onChange }) => {
    const [rating, setRating] = useState(initialRating);

    const handleClick = (value: number) => {
        setRating(value);
        if (onChange) onChange(value);
    };

    return (
        <div className="flex justify-center mt-3 gap-4">
            {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;
                return starValue <= rating ? (
                    <FaStar
                        key={index}
                        className="text-yellow-400 text-4xl cursor-pointer"
                        onClick={() => handleClick(starValue)}
                    />
                ) : (
                    <FaRegStar
                        key={index}
                        className="text-gray-300 text-4xl  cursor-pointer"
                        onClick={() => handleClick(starValue)}
                    />
                );
            })}
        </div>
    );
};

export default Rating;