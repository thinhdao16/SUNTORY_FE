import React from "react";

const SplashScreen: React.FC = () => (
    <div
        className="fixed inset-0 flex items-center justify-center h-screen z-[9999] bg-main"
    // style={{
    //     background: `url("/background/background_splash_screen.svg") center center / cover no-repeat, #fff`,
    // }}
    >
        <div className="flex flex-col items-center">
            <img
                src="/logo/splash_logo.svg"
                alt="Logo"
                className="animate-pulse w-[80px] h-full"
            />
            <img
                src="/logo/splash_text.svg"
                alt="Logo"
                className="animate-pulse w-[150px] h-full mt-6"
            />
        </div>
    </div>
);

export default SplashScreen;