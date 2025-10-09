import React from "react";

const NotFound: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-red-500 mb-4">{t("404")}</h1>
        <p className="text-lg text-gray-600 mb-4">{t("Page Not Found")}</p>
        <a href="/home" className="text-main underline">{t("Go Home")}</a>
    </div>
);

export default NotFound;