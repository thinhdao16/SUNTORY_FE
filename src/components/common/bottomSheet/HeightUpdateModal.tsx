import React, { useEffect, useMemo, useState, useRef } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { close, add, remove } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { updateHealthConditionV2 } from "@/services/auth/auth-service";
import { UpdateHealthConditionV2Payload } from "@/services/auth/auth-types";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import { useHealthMasterData } from "@/hooks/common/useHealth";
import { useToastStore } from "@/store/zustand/toast-store";

interface HeightUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    translateY: number;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    showOverlay?: boolean;
    currentHeight?: number;
    currentHeightUnit?: string;
}

const HeightUpdateModal: React.FC<HeightUpdateModalProps> = ({
    isOpen,
    onClose,
    currentHeight,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    showOverlay = true,
    currentHeightUnit
}) => {
    const { t } = useTranslation();
    const { showToast } = useToastStore();
    const { data: userInfo, refetch } = useAuthInfo();
    const { data: masterData } = useHealthMasterData();
    const heightUnits = masterData?.measurementUnits?.find((a: any) => a?.category?.categoryName?.toLowerCase() === 'height');
    const MAX_CM = 305;
    const MAX_FT = 10;
    const [unit, setUnit] = useState<'cm' | 'ft'>(currentHeightUnit?.toLowerCase() === 'ft' ? 'ft' : 'cm');
    const [isSaving, setIsSaving] = useState(false);
    const [valueCm, setValueCm] = useState<number>(() => {
        const num = Number(currentHeight);
        if (!Number.isFinite(num)) return 160;
        
        // If currentHeightUnit is 'ft', convert to cm first
        if (currentHeightUnit?.toLowerCase() === 'ft') {
            const cmValue = Math.round(num * 30.48);
            return Math.max(0, Math.min(MAX_CM, cmValue));
        }
        
        // Otherwise treat as cm
        return Math.max(0, Math.min(MAX_CM, Math.round(num)));
    });
    const [valueFt, setValueFt] = useState<number>(() => {
        const num = Number(currentHeight);
        if (!Number.isFinite(num)) return 5;
        
        // If currentHeightUnit is 'ft', use directly
        if (currentHeightUnit?.toLowerCase() === 'ft') {
            return Math.max(0, Math.min(MAX_FT, Math.round(num)));
        }
        
        // Otherwise convert from cm to ft
        const ftValue = Math.floor(num / 30.48);
        return Math.max(0, Math.min(MAX_FT, ftValue));
    });

    // Enhanced smooth drag system
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [smoothOffset, setSmoothOffset] = useState(0);
    const [totalDistance, setTotalDistance] = useState(0);

    // iOS-style momentum system
    const [velocity, setVelocity] = useState(0);
    const [velocityHistory, setVelocityHistory] = useState<number[]>([]);
    const [lastMoveTime, setLastMoveTime] = useState(0);
    const [lastMoveX, setLastMoveX] = useState(0);
    const [momentumActive, setMomentumActive] = useState(false);

    // Hold functionality
    const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [isHolding, setIsHolding] = useState(false);

    // Animation refs
    const animationFrameRef = useRef<number | null>(null);
    const smoothAnimationRef = useRef<number | null>(null);
    const updateDirectionRef = useRef<((newX: number) => void) | null>(null);

    // Tap detection
    const [tapStartTime, setTapStartTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const SHEET_MAX_VH = 80;
    const HEADER_PX = 56;

    useEffect(() => {
        if (isOpen) {
            // Set unit based on currentHeightUnit or localStorage preference
            const preferredUnit = currentHeightUnit?.toLowerCase() === 'ft' ? 'ft' : 'cm';
            try {
                const storedUnit = localStorage.getItem('heightUnit') as 'cm' | 'ft' | null;
                if (storedUnit === 'cm' || storedUnit === 'ft') {
                    setUnit(storedUnit);
                } else {
                    setUnit(preferredUnit);
                }
            } catch { 
                setUnit(preferredUnit);
            }

            const parsed = Number(currentHeight);
            if (Number.isFinite(parsed)) {
                // Convert based on the actual unit of currentHeight
                if (currentHeightUnit?.toLowerCase() === 'ft') {
                    // currentHeight is in feet, convert to both units
                    const cmValue = Math.round(parsed * 30.48);
                    const ftValue = Math.round(parsed);
                    setValueCm(Math.max(0, Math.min(MAX_CM, cmValue)));
                    setValueFt(Math.max(0, Math.min(MAX_FT, ftValue)));
                } else {
                    // currentHeight is in cm, convert to both units
                    const cmValue = Math.round(parsed);
                    const ftValue = Math.floor(parsed / 30.48);
                    setValueCm(Math.max(0, Math.min(MAX_CM, cmValue)));
                    setValueFt(Math.max(0, Math.min(MAX_FT, ftValue)));
                }
            } else {
                // fallback to previous state to avoid hard reset
                setValueCm(prev => Math.max(0, Math.min(MAX_CM, prev || 160)));
                setValueFt(prev => Math.max(0, Math.min(MAX_FT, prev || 5)));
            }
        }
    }, [isOpen, currentHeight, currentHeightUnit]);

    // Cleanup on unmount to prevent memory leaks on mobile
    useEffect(() => {
        return () => {
            stopAllAnimations();
            if (holdTimer) {
                clearTimeout(holdTimer);
                setHoldTimer(null);
            }
        };
    }, []);

    // Safety check - clear timers when isHolding becomes false
    useEffect(() => {
        if (!isHolding && holdTimer) {
            if (holdTimer) {
                clearTimeout(holdTimer);
                setHoldTimer(null);
            }
        }
    }, [isHolding, holdTimer]);
    const displayValue = unit === 'cm' ? valueCm : valueFt;

    const decrement = () => {
        if (canDecrease()) {
            if (unit === 'cm') setValueCm(prev => Math.max(0, Math.min(MAX_CM, Math.round(prev - 1))));
            else setValueFt(prev => Math.max(0, Math.min(MAX_FT, Math.floor(prev - 1))));
        }
    };
    const increment = () => {
        // Make sure this is a clean increment, not affected by hold logic
        if (unit === 'cm') {
            setValueCm(prev => Math.max(0, Math.min(MAX_CM, Math.round(prev + 1))));
        } else {
            setValueFt(prev => Math.max(0, Math.min(MAX_FT, Math.floor(prev + 1))));
        }
    };

    // Helper function to update height with boundary checking
    const updateHeight = (delta: number) => {
        if (unit === 'cm') {
            setValueCm(prev => {
                const newValue = Math.round(prev + delta);
                const finalValue = Math.max(0, Math.min(MAX_CM, newValue));
                // If we hit the boundary (0) from above, only stop hold timers
                if (finalValue === 0 && prev > 0 && delta > 0) {
                    // Only stop hold timers, don't stop momentum (it might reverse direction)
                    setIsHolding(false);
                    if (holdTimer) {
                        clearTimeout(holdTimer);
                        setHoldTimer(null);
                    }
                    // Don't call stopMomentumOnly() - let momentum continue
                }

                return finalValue;
            });
        } else {
            setValueFt(prev => {
                const newValue = Math.floor(prev + delta);
                const finalValue = Math.max(0, Math.min(MAX_FT, newValue));

                // If we hit the boundary (0) from above, only stop hold timers
                if (finalValue === 0 && prev > 0 && delta > 0) {
                    // Only stop hold timers, don't stop momentum (it might reverse direction)
                    setIsHolding(false);
                    if (holdTimer) {
                        clearTimeout(holdTimer);
                        setHoldTimer(null);
                    }
                    // Don't call stopMomentumOnly() - let momentum continue
                }

                return finalValue;
            });
        }
    };

    // Check if we can decrease (not at minimum)
    const canDecrease = () => {
        const currentValue = unit === 'cm' ? valueCm : valueFt;
        return currentValue > 0;
    };
    // Check if we can increase (not at maximum)
    const canIncrease = () => {
        const currentValue = unit === 'cm' ? valueCm : valueFt;
        return unit === 'cm' ? currentValue < MAX_CM : currentValue < MAX_FT;
    };

    // Continuous increment with direction tracking
    const startContinuousIncrement = (initialDirection: number, initialX: number) => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }

        let currentDirection = initialDirection;
        let lastX = initialX;

        const increment = () => {
            // Check boundaries before continuing
            if (currentDirection > 0 && !canDecrease()) {
                // Stop continuous increment at boundary
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    setHoldTimer(null);
                }
                setIsHolding(false);
                return;
            }

            // SAFETY: Only continue if actively holding AND dragging
            if (!isHolding || !isDragging) {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    setHoldTimer(null);
                }
                setIsHolding(false);
                return;
            }
            updateHeight(currentDirection);
            const newTimer = setTimeout(increment, 80);
            setHoldTimer(newTimer);
        };

        // Function to update direction based on mouse/touch movement
        const updateDirection = (newX: number) => {
            const deltaX = newX - lastX;
            if (Math.abs(deltaX) > 5) { // Threshold to avoid jitter
                currentDirection = deltaX > 0 ? -1 : 1; // Right = decrease, Left = increase
                lastX = newX;
            }
        };

        // Store update function in ref for external access
        updateDirectionRef.current = updateDirection;

        setHoldTimer(setTimeout(increment, 400)); // Initial delay before starting
    };

    // Stop all animations and reset state properly
    const stopAllAnimations = () => {
        setMomentumActive(false);
        setIsHolding(false);

        // Clear all animation frames
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (smoothAnimationRef.current) {
            cancelAnimationFrame(smoothAnimationRef.current);
            smoothAnimationRef.current = null;
        }

        // Clear all timers
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }

        // Reset all animation states
        setSmoothOffset(0);
        setVelocity(0);
        setVelocityHistory([]);
    };

    // Stop only momentum but keep drag interaction possible
    const stopMomentumOnly = () => {
        setMomentumActive(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        // Don't reset velocity/history - allow new drag to start normally
    };

    // Enhanced velocity calculation for better momentum detection
    const getAverageVelocity = () => {
        if (velocityHistory.length === 0) return 0;

        // Optimized for mobile touch - use more samples for better accuracy
        const recent = velocityHistory.slice(-8); // Last 8 samples for mobile
        const weights = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]; // Higher weight for recent

        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < recent.length; i++) {
            const weight = weights[i] || weights[weights.length - 1];
            weightedSum += recent[i] * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };

    // Smooth animation for continuous movement
    const startSmoothAnimation = (targetOffset: number, duration: number = 300) => {
        const startTime = performance.now();
        const startOffset = smoothOffset;
        const deltaOffset = targetOffset - startOffset;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth ease out curve with natural deceleration
            const easeOut = 1 - Math.pow(1 - progress, 2.5); // Gentler curve for smoother feel
            const newOffset = startOffset + deltaOffset * easeOut;

            setSmoothOffset(newOffset);

            if (progress < 1) {
                smoothAnimationRef.current = requestAnimationFrame(animate);
            } else {
                setSmoothOffset(targetOffset);
            }
        };

        smoothAnimationRef.current = requestAnimationFrame(animate);
    };

    // Enhanced momentum with proper stop control
    const applyMomentum = () => {
        const avgVelocity = getAverageVelocity();
        const velocityThreshold = 0.08; // Higher threshold for less momentum trigger

        // Don't start momentum if velocity is too low
        if (Math.abs(avgVelocity) <= velocityThreshold) {
            startSmoothAnimation(0, 150);
            return;
        }

        // Clean stop before starting new momentum
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setMomentumActive(true);
        let currentVelocity = avgVelocity * 80; // Reduced momentum for quicker stop
        const deceleration = 0.92; // Faster deceleration for early stop
        const minVelocity = 0.5; // Higher threshold for earlier stop
        let lastTime = performance.now();
        let accumulatedDistance = 0;
        let isRunning = true; // Local control variable
        const sensitivity = 7; // More balanced sensitivity

        const momentumLoop = (currentTime: number) => {
            // Stop if not running or velocity too low
            if (!isRunning || Math.abs(currentVelocity) < minVelocity) {
                setMomentumActive(false);
                animationFrameRef.current = null;
                startSmoothAnimation(0, 200);
                return;
            }

            // If at boundary 0, reverse momentum direction to "bounce back"
            const currentHeight = unit === 'cm' ? valueCm : valueFt;
            if (currentHeight === 0 && currentVelocity > 0) {
                currentVelocity = -Math.abs(currentVelocity) * 0.3; // Reverse with reduced strength
            }

            const deltaTime = Math.min(currentTime - lastTime, 16); // 60fps for smooth animation
            lastTime = currentTime;

            // Calculate movement with proper physics
            const movement = currentVelocity * (deltaTime / 16);
            accumulatedDistance += movement;

            // Update visual offset for smooth animation
            setSmoothOffset(accumulatedDistance);

            // Check for weight updates
            const heightSteps = Math.floor(Math.abs(accumulatedDistance) / sensitivity);
            if (heightSteps > 0) {
                const direction = accumulatedDistance > 0 ? -1 : 1;

                // Only update if not hitting boundary, or if increasing
                if (!(direction > 0 && !canDecrease())) {
                    // Safe to update
                    let actualSteps = 0;
                    for (let i = 0; i < heightSteps; i++) {
                        // Check before each update
                        if (direction > 0 && !canDecrease()) {
                            break; // Stop if we hit boundary during updates
                        }
                        updateHeight(direction);
                        actualSteps++;
                    }
                }

                // Always reset accumulated distance to continue momentum
                accumulatedDistance = 0;

                // Don't stop momentum when hitting boundary - let it continue
                // The momentum can change direction and become useful again
            }

            // Apply deceleration
            currentVelocity *= deceleration;

            // Continue animation
            animationFrameRef.current = requestAnimationFrame(momentumLoop);
        };

        // Start the momentum loop
        animationFrameRef.current = requestAnimationFrame(momentumLoop);
    };

    // Handle tap for quick weight change
    const handleTap = (clientX: number, containerWidth: number) => {
        const containerRect = document.querySelector('.ruler-container')?.getBoundingClientRect();
        if (!containerRect) return;

        const relativeX = clientX - containerRect.left;
        const centerX = containerRect.width / 2;
        const threshold = 30; // Minimum distance from center to register as tap

        if (Math.abs(relativeX - centerX) > threshold) {
            if (relativeX < centerX) {
                // Left side - decrease
                if (canDecrease()) {
                    updateHeight(1); // Decrease by 1
                    // Visual feedback
                    setSmoothOffset(-20);
                    startSmoothAnimation(0, 150);
                }
                // If at 0, show subtle feedback
                else {
                    setSmoothOffset(-5); // Smaller feedback
                    startSmoothAnimation(0, 200); // Longer animation
                }
            } else {
                // Right side - increase (always allowed)
                updateHeight(-1); // Increase by 1
                // Visual feedback
                setSmoothOffset(20);
                startSmoothAnimation(0, 150);
            }
        }
    };

    // Enhanced touch start handler with tap detection
    const handleRulerTouchStart = (e: React.TouchEvent) => {
        // Don't prevent default to avoid passive listener error
        // The touchAction: 'none' in CSS handles the scroll prevention

        // Light reset - don't stop everything, just momentum
        setMomentumActive(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }

        const clientX = e.touches[0].clientX;
        const startTime = performance.now();

        // Reset states for new interaction
        setIsDragging(true);
        setIsHolding(false);
        setStartX(clientX);
        setCurrentX(clientX);
        setLastMoveX(clientX);
        setLastMoveTime(startTime);
        setTapStartTime(startTime);
        setHasMoved(false);
        setVelocity(0);
        setVelocityHistory([]); // Fresh velocity tracking
        setTotalDistance(0);
        setSmoothOffset(0);

        // Hold timer for continuous increment
        const holdTimeout = setTimeout(() => {
            setIsHolding(true);
            startContinuousIncrement(0, clientX);
        }, 300);
        setHoldTimer(holdTimeout);
    };

    const handleRulerTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        // Don't prevent default to avoid passive listener error
        // The touchAction: 'none' in CSS handles the scroll prevention

        const newX = e.touches[0].clientX;
        const currentTime = performance.now();
        const deltaX = newX - startX;
        const moveDelta = newX - lastMoveX;
        const timeDelta = currentTime - lastMoveTime;

        setCurrentX(newX);

        // Mark as moved if significant movement
        if (Math.abs(deltaX) > 5) {
            setHasMoved(true);
        }

        // Enhanced velocity tracking optimized for mobile touch
        if (timeDelta > 0 && timeDelta < 100) { // Wider window for touch screens
            const instantVelocity = moveDelta / timeDelta;
            setVelocity(instantVelocity);
            // Keep more samples for better momentum detection on mobile
            setVelocityHistory(prev => [...prev.slice(-12), instantVelocity]); // Keep last 13 samples
        }

        setLastMoveX(newX);
        setLastMoveTime(currentTime);

        // Ultra smooth offset with subtle damping for natural feel
        const dampedOffset = deltaX * 0.98; // Very subtle damping for smoother feel
        setSmoothOffset(dampedOffset);
        setTotalDistance(deltaX);

        // Handle hold direction updates
        if (isHolding && updateDirectionRef.current) {
            updateDirectionRef.current(newX);
        } else if (holdTimer && !isHolding) {
            if (holdTimer) {
                clearTimeout(holdTimer);
                setHoldTimer(null);
            }
        }

        // Height updates with smooth sensitivity
        const sensitivity = 10;
        const steps = Math.round(Math.abs(deltaX) / sensitivity);

        if (steps > 0 && Math.abs(deltaX) >= sensitivity) {
            const direction = deltaX > 0 ? -1 : 1;
            const currentHeight = unit === 'cm' ? valueCm : valueFt;

            // Check both boundaries
            if (direction < 0 && !canDecrease()) {
                setStartX(newX);
                setTotalDistance(0);
                setSmoothOffset(0);
            } else if (direction > 0 && !canIncrease()) {
                setStartX(newX);
                setTotalDistance(0);
                setSmoothOffset(0);
            } else {
                updateHeight(direction);
                setStartX(newX);
                setTotalDistance(0);
                setSmoothOffset(0);
            }
        }
    };

    const handleRulerTouchEnd = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }
        setIsDragging(false);
        setIsHolding(false);

        const endTime = performance.now();
        const duration = endTime - tapStartTime;

        // Check if this was a tap (short duration + minimal movement)
        if (duration < 200 && !hasMoved) {
            const containerRect = document.querySelector('.ruler-container')?.getBoundingClientRect();
            if (containerRect) {
                handleTap(currentX, containerRect.width);
                // Always animate back to center for clean state
                startSmoothAnimation(0, 150);
                return; // Don't apply momentum for taps
            }
        }

        // Apply momentum based on velocity history
        applyMomentum();
    };

    const handleRulerMouseDown = (e: React.MouseEvent) => {
        // Light reset - don't stop everything, just momentum
        setMomentumActive(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }

        const clientX = e.clientX;
        const startTime = performance.now();

        // Reset states for new interaction
        setIsDragging(true);
        setIsHolding(false);
        setStartX(clientX);
        setCurrentX(clientX);
        setLastMoveX(clientX);
        setLastMoveTime(startTime);
        setTapStartTime(startTime);
        setHasMoved(false);
        setVelocity(0);
        setVelocityHistory([]); // Fresh velocity tracking
        setTotalDistance(0);
        setSmoothOffset(0);

        const holdTimeout = setTimeout(() => {
            setIsHolding(true);
            startContinuousIncrement(0, clientX);
        }, 300);
        setHoldTimer(holdTimeout);
    };

    const handleRulerMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const currentX = e.clientX;
        const currentTime = Date.now();
        const deltaX = currentX - startX;

        // Enhanced velocity tracking for mouse with momentum support
        const timeDelta = currentTime - lastMoveTime;
        if (timeDelta > 0 && timeDelta < 50) { // Consistent with touch
            const moveDelta = currentX - lastMoveX;
            const instantVelocity = moveDelta / timeDelta;
            setVelocity(instantVelocity);
            // Add to velocity history for momentum
            setVelocityHistory(prev => [...prev.slice(-10), instantVelocity]);

            // Mark as moved for stronger gestures
            if (Math.abs(deltaX) > 5) {
                setHasMoved(true);
            }
        }

        setLastMoveX(currentX);
        setLastMoveTime(currentTime);

        // Ultra smooth ruler offset with minimal resistance for better feel
        const resistance = Math.min(1, Math.abs(deltaX) / 150); // Less resistance for smoother drag
        const smoothOffset = deltaX * (0.95 - resistance * 0.1); // Higher base factor for smoother response
        setSmoothOffset(smoothOffset);

        // Update direction if holding, otherwise clear hold timer
        if (isHolding && updateDirectionRef.current) {
            updateDirectionRef.current(currentX);
        } else if (holdTimer && !isHolding) {
            if (holdTimer) {
                clearTimeout(holdTimer);
                setHoldTimer(null);
            }
        }

        const sensitivity = 12; // iOS-like sensitivity
        const steps = Math.round(deltaX / sensitivity);

        if (Math.abs(steps) >= 1) {
            const direction = -steps;
            const currentHeight = unit === 'cm' ? valueCm : valueFt;

            // Check both boundaries
            if (direction < 0 && !canDecrease()) {
                setStartX(currentX);
                requestAnimationFrame(() => setSmoothOffset(0));
            } else if (direction > 0 && !canIncrease()) {
                setStartX(currentX);
                requestAnimationFrame(() => setSmoothOffset(0));
            } else {
                updateHeight(direction);
                setStartX(currentX);
                requestAnimationFrame(() => setSmoothOffset(0));
            }
        }
    };

    const handleRulerMouseUp = () => {
        // Force clear ALL timers
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }

        // Complete state reset to prevent auto-increment
        setIsDragging(false);
        setIsHolding(false);
        setHasMoved(false);

        const endTime = performance.now();
        const duration = endTime - tapStartTime;

        // Check if this was a tap
        if (duration < 200 && !hasMoved) {
            const containerRect = document.querySelector('.ruler-container')?.getBoundingClientRect();
            if (containerRect) {
                handleTap(currentX, containerRect.width);
                // Clean state after tap
                startSmoothAnimation(0, 150);
                return;
            }
        }

        // Apply momentum only if there was actual movement
        if (hasMoved && velocity !== 0) {
            applyMomentum();
        } else {
            // No movement - clean reset
            startSmoothAnimation(0, 150);
        }
    };

    const handleSave = async () => {
        if (valueCm === 0 || valueFt === 0) {
            showToast(t("Please enter a valid height"), 1000, "error");
            return;
        }
        setIsSaving(true);
        try {
            // Always save in the current unit, not convert to cm
            const payload: UpdateHealthConditionV2Payload = {
                height: unit === 'cm' ? valueCm : valueFt,
                heightUnitId: unit === 'cm' 
                    ? heightUnits?.measurementUnits.find((a: any) => a.symbol === 'cm')?.id 
                    : heightUnits?.measurementUnits.find((a: any) => a.symbol === 'ft')?.id,
                weight: null,
                weightUnitId: null,
                allergies: null,
                lifestyleId: null,
                healthConditions: null,
            };
            await updateHealthConditionV2(payload); 
            await refetch();
            showToast(t("Height updated successfully"), 2000, "success");
            onClose();
        } catch (error) {
            console.error('Error updating height:', error);
            showToast(t("Failed to update height. Please try again."), 2000, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[9999] h-full flex justify-center items-end ${showOverlay ? 'bg-black/50' : 'bg-transparent'}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <div
                        className="w-full rounded-t-4xl shadow-lg bg-white overflow-hidden"
                        style={{
                            height: `${SHEET_MAX_VH}vh`,
                            transform: `translateY(${translateY}px)`,
                            touchAction: 'none',
                            transition: 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            willChange: 'transform'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Header */}
                        <div className="px-2" style={{ minHeight: HEADER_PX, display: 'flex', alignItems: 'center', touchAction: 'none' }}>
                            <div style={{ width: 56, height: HEADER_PX }} />
                            <div className="text-center font-semibold"
                                style={{
                                    flex: 1,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                    overflow: 'hidden',
                                    fontSize: '15px',
                                    color: 'black'
                                }}>{t('My height')}</div>
                            <IonButton fill="clear" onClick={onClose} style={{ width: 56, height: HEADER_PX, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IonIcon icon={close} style={{ width: 24, height: 24, color: '#000000' }} />
                            </IonButton>
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                height: `calc(${SHEET_MAX_VH}vh - ${HEADER_PX}px)`,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto" style={{
                                paddingBottom: '60px',
                                paddingTop: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div className="px-6 pt-2 flex flex-col items-center gap-4">
                                    {/* +/- controls and value */}
                                    <div
                                        className="mt-2 grid items-center"
                                        style={{ gridTemplateColumns: '24px 1fr 24px', columnGap: 24, width: 300 }}
                                    >
                                        {/* Minus button - fixed first column */}
                                        <button
                                            type="button"
                                            onClick={decrement}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${!canDecrease() ? 'opacity-30 cursor-not-allowed bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
                                            disabled={!canDecrease()}
                                            style={{ gridColumn: 1 }}
                                        >
                                            <div className="w-3.5 h-0.5 bg-white rounded-full" />
                                        </button>

                                        {/* Center value - fixed min width to avoid layout shift */}
                                        <div className="flex items-center justify-center" style={{ gridColumn: 2 }}>
                                            <div className="text-3xl font-bold text-center" style={{ minWidth: 80, fontFeatureSettings: 'tnum' }}>
                                                {displayValue}
                                            </div>
                                        </div>

                                        {/* Plus button - fixed third column */}
                                        <button
                                            type="button"
                                            onClick={increment}
                                            className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center transition-all duration-200"
                                            style={{ gridColumn: 3 }}
                                        >
                                            <div className="relative">
                                                <div className="w-3.5 h-0.5 bg-white rounded-full" />
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" style={{ width: 2, height: 14 }} />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Unit toggle */}
                                    <div className="flex items-center" style={{ width: 160, height: 48, padding: 4, borderRadius: 12, border: '1px solid #E5E7EB', justifyContent: 'space-between' }}>
                                        <button
                                            style={{ flex: 1, height: '100%', borderRadius: 8 }}
                                            className={`${unit === 'cm' ? 'bg-[#EEF0F3] font-semibold text-gray-900' : 'bg-white text-gray-700'} text-base`}
                                            onClick={() => {
                                                setUnit('cm');
                                                const newCm = Math.max(0, Math.min(MAX_CM, Math.round(valueFt * 30.48)));
                                                setValueCm(newCm);
                                                try { localStorage.setItem('heightUnit', 'cm'); } catch { }
                                            }}
                                        >
                                            cm
                                        </button>
                                        <div style={{ width: 4 }} />
                                        <button
                                            style={{ flex: 1, height: '100%', borderRadius: 8 }}
                                            className={`${unit === 'ft' ? 'bg-[#EEF0F3] font-semibold text-gray-900' : 'bg-white text-gray-700'} text-base`}
                                            onClick={() => {
                                                setUnit('ft');
                                                const newFt = Math.max(0, Math.min(MAX_FT, Math.floor(valueCm / 30.48)));
                                                setValueFt(newFt);
                                                try { localStorage.setItem('heightUnit', 'ft'); } catch { }
                                            }}
                                        >
                                            ft
                                        </button>
                                    </div>

                                    {/* Interactive ruler */}
                                    <div className="w-full mt-6">
                                        {/* tick bar with animation - shows actual height values */}
                                        <div className="relative h-22 overflow-hidden ruler-container w-full"
                                            style={{
                                                touchAction: 'none',
                                                // Enhanced container smoothness
                                                WebkitOverflowScrolling: 'touch',
                                                overscrollBehavior: 'none',
                                                // Force GPU acceleration for container
                                                transform: 'translateZ(0)',
                                                WebkitTransform: 'translateZ(0)',
                                                // Smooth rendering optimizations
                                                willChange: 'transform',
                                                isolation: 'isolate'
                                            }}>
                                            <div
                                                className="absolute inset-x-0 top-6 px-6 flex items-end justify-between cursor-grab active:cursor-grabbing"
                                                style={{
                                                    transform: `translateX(${smoothOffset}px)`,
                                                    willChange: 'transform',
                                                    transition: isDragging || momentumActive ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                                    backfaceVisibility: 'hidden',
                                                    perspective: '1000px',
                                                    transformStyle: 'preserve-3d',
                                                    // Enhanced mobile optimization for ultra-smooth performance
                                                    WebkitTransform: `translateX(${smoothOffset}px)`,
                                                    WebkitBackfaceVisibility: 'hidden',
                                                    WebkitPerspective: '1000px',
                                                    WebkitTransformStyle: 'preserve-3d',
                                                    // Anti-aliasing for smooth edges
                                                    WebkitFontSmoothing: 'antialiased',
                                                    MozOsxFontSmoothing: 'grayscale',
                                                    // Force GPU layer
                                                    isolation: 'isolate',
                                                    contain: 'layout style paint',
                                                    // Smooth rendering
                                                    textRendering: 'optimizeLegibility'
                                                }}
                                                onTouchStart={handleRulerTouchStart}
                                                onTouchMove={handleRulerTouchMove}
                                                onTouchEnd={handleRulerTouchEnd}
                                                onMouseDown={handleRulerMouseDown}
                                                onMouseMove={isDragging ? handleRulerMouseMove : undefined}
                                                onMouseUp={handleRulerMouseUp}
                                                onMouseLeave={handleRulerMouseUp}
                                            >
                                                {Array.from({ length: 21 }).map((_, i) => {
                                                    const base = unit === 'cm' ? valueCm : valueFt;
                                                    const rounded = Math.round(base);
                                                    const v = rounded - 10 + i;
                                                    const max = unit === 'cm' ? MAX_CM : MAX_FT;
                                                    const isCenter = i === 10;
                                                    const isMajor = (v % 5 === 0); // Major tick every 5 units
                                                    const heightClass = isCenter ? 'h-12' : (isMajor ? 'h-10' : 'h-6');
                                                    const colorClass = isCenter ? 'bg-blue-500' : (isMajor ? 'bg-gray-500' : 'bg-gray-400');
                                                    const widthClass = isCenter ? 'w-[2px]' : 'w-px';

                                                    // Hide tick if value is negative or zero when we want clean boundary
                                                    if (v < 0 || v > max) {
                                                        return <div key={i} style={{ width: '1px', height: '24px', backgroundColor: 'transparent' }} />;
                                                    }

                                                    // Float small ticks (non-major, non-center) slightly above the bottom
                                                    const floatClass = isCenter ? '' : (isMajor ? '' : 'mb-2');
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`${widthClass} ${heightClass} ${colorClass} ${floatClass}`}
                                                            style={{
                                                                // Enhanced smooth rendering for tick marks
                                                                transform: 'translateZ(0)',
                                                                WebkitTransform: 'translateZ(0)',
                                                                willChange: 'transform',
                                                                // Anti-aliasing for smooth edges
                                                                WebkitFontSmoothing: 'antialiased',
                                                                // Smooth transitions for color/size changes
                                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Draggable labels with integrated arrow */}
                                        <div
                                            className="w-full px-6 mt-6 cursor-grab active:cursor-grabbing select-none overflow-hidden"
                                            onTouchStart={handleRulerTouchStart}
                                            onTouchMove={handleRulerTouchMove}
                                            onTouchEnd={handleRulerTouchEnd}
                                            onMouseDown={handleRulerMouseDown}
                                            onMouseMove={isDragging ? handleRulerMouseMove : undefined}
                                            onMouseUp={handleRulerMouseUp}
                                            onMouseLeave={handleRulerMouseUp}
                                            style={{
                                                touchAction: 'none',
                                                // Enhanced container performance
                                                WebkitOverflowScrolling: 'touch',
                                                overscrollBehavior: 'none',
                                                // Force smooth rendering
                                                transform: 'translateZ(0)',
                                                WebkitTransform: 'translateZ(0)',
                                                willChange: 'transform',
                                                isolation: 'isolate'
                                            }}
                                        >
                                            <div
                                                className="grid grid-cols-21 w-full text-xs"
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(21, minmax(0, 1fr))',
                                                    transform: `translateX(${smoothOffset}px)`,
                                                    willChange: 'transform',
                                                    transition: isDragging || momentumActive ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                                    backfaceVisibility: 'hidden',
                                                    perspective: '1000px',
                                                    transformStyle: 'preserve-3d',
                                                    // Enhanced mobile optimization for ultra-smooth performance
                                                    WebkitTransform: `translateX(${smoothOffset}px)`,
                                                    WebkitBackfaceVisibility: 'hidden',
                                                    WebkitPerspective: '1000px',
                                                    WebkitTransformStyle: 'preserve-3d',
                                                    // Anti-aliasing for smooth edges
                                                    WebkitFontSmoothing: 'antialiased',
                                                    MozOsxFontSmoothing: 'grayscale',
                                                    // Force GPU layer
                                                    isolation: 'isolate',
                                                    contain: 'layout style paint',
                                                    // Smooth rendering
                                                    textRendering: 'optimizeLegibility'
                                                }}
                                            >
                                                {Array.from({ length: 21 }).map((_, i) => {
                                                    const base = unit === 'cm' ? valueCm : valueFt;
                                                    const rounded = Math.round(base);
                                                    const v = rounded - 10 + i;
                                                    const max = unit === 'cm' ? MAX_CM : MAX_FT;
                                                    const isCenter = i === 10;
                                                    const show = v % 5 === 0;
                                                    return (
                                                        <div key={i} className="flex flex-col items-center">
                                                            {/* Arrow only at center position */}
                                                            {isCenter && (
                                                                <div className="mb-1 flex justify-center">
                                                                    <div
                                                                        className="border-solid border-transparent border-b-blue-500"
                                                                        style={{
                                                                            width: 0,
                                                                            height: 0,
                                                                            borderLeftWidth: '8px',
                                                                            borderRightWidth: '8px',
                                                                            borderBottomWidth: '10px'
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <span
                                                                className={`text-center ${isCenter ? 'text-blue-600 font-extrabold text-sm' : 'text-gray-400'}`}
                                                                style={{
                                                                    fontFeatureSettings: 'tnum',
                                                                    // Enhanced text rendering
                                                                    WebkitFontSmoothing: 'antialiased',
                                                                    MozOsxFontSmoothing: 'grayscale',
                                                                    textRendering: 'optimizeLegibility',
                                                                    // Smooth transitions for text
                                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    // Force GPU acceleration for text
                                                                    transform: 'translateZ(0)',
                                                                    WebkitTransform: 'translateZ(0)',
                                                                    willChange: 'color, font-weight'
                                                                }}
                                                            >
                                                                {isCenter ? rounded : (show && v > 0 && v <= max ? v : '')}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer - Save Button */}
                            <div className="px-4 py-4 border-t border-gray-100">
                                <IonButton
                                    expand="block"
                                    shape="round"
                                    onClick={handleSave}
                                    className="h-14"
                                    style={{
                                        '--background': '#1152F4',
                                        '--background-hover': '#2563eb',
                                        'font-weight': '600'
                                    }}
                                >
                                    {isSaving ? <IonSpinner name="crescent" /> : t('Save')}
                                </IonButton>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HeightUpdateModal;
