import React from "react";
import SplashLogo from "@/icons/logo/splash_logo.svg?react";
import SplashText from "@/icons/logo/splash_text.svg?react";

const SplashScreen: React.FC = () => (
    <div
        className="fixed inset-0 flex items-center justify-center h-screen z-[9999] bg-main"
    >
        <div className="flex flex-col items-center">
            <SplashLogo className="animate-pulse w-[80px] h-full" />
            <SplashText className="animate-pulse w-[150px] h-full mt-6" />
        </div>
    </div>
);

export default SplashScreen;