import { useState, useEffect, useRef, useCallback } from 'react';

interface UseBatchedTypingEffectOptions {
    charDelay?: number;
    batchSize?: number;
    batchDelay?: number;
}

export const useBatchedTypingEffect = (
    text: string,
    isComplete: boolean,
    options: UseBatchedTypingEffectOptions = {}
) => {
    const {
        charDelay = 8,
        batchSize = 2, // Reduced to 2 for more granular typing
        batchDelay = 25 // Slightly faster for responsiveness
    } = options;

    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const timeoutRef = useRef<number | undefined>(undefined);
    const targetTextRef = useRef('');
    const currentPositionRef = useRef(0);

    // Update target when new text comes in
    useEffect(() => {
        targetTextRef.current = text;

        // If this is the first text or we have new text to type
        if (text.length > currentPositionRef.current && !isTyping) {
            // Small delay for new streams to avoid immediate rush
            const delay = currentPositionRef.current === 0 ? 50 : 0;
            setTimeout(() => startBatchedTyping(), delay);
        }
    }, [text]);

    // Complete immediately when done
    useEffect(() => {
        if (isComplete) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setDisplayText(text);
            setIsTyping(false);
            currentPositionRef.current = text.length;
        }
    }, [isComplete, text]);

    const startBatchedTyping = useCallback(() => {
        if (isTyping) return; // Already typing

        setIsTyping(true);

        const typeBatch = () => {
            const currentTarget = targetTextRef.current;
            const currentPos = currentPositionRef.current;

            // Check if we're done
            if (currentPos >= currentTarget.length || isComplete) {
                setIsTyping(false);
                return;
            }

            // Type a batch of characters
            const endPos = Math.min(currentPos + batchSize, currentTarget.length);
            const nextText = currentTarget.substring(0, endPos);

            setDisplayText(nextText);
            currentPositionRef.current = endPos;

            // Continue if more to type
            if (endPos < currentTarget.length) {
                timeoutRef.current = setTimeout(typeBatch, batchDelay);
            } else {
                setIsTyping(false);
            }
        };

        typeBatch();
    }, [isTyping, isComplete, batchSize, batchDelay]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        displayText,
        isTyping
    };
};
