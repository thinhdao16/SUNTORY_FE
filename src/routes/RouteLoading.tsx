import React from "react";

const RouteLoading: React.FC = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white/95 z-[9999]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-main border-solid"></div>
    </div>
);

export default RouteLoading;