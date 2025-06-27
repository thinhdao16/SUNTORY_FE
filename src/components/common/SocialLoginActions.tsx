import React from "react";

interface SocialAction {
    icon: string;
    alt: string;
    onClick?: () => void;
}

interface SocialLoginActionsProps {
    actions?: SocialAction[];
    dividerText?: string;
    showDivider?: boolean;
    showActions?: boolean;
    bottomLogo?: { icon: string; textIcon: string };
}

const SocialLoginActions: React.FC<SocialLoginActionsProps> = ({
    actions,
    dividerText = t("OR"),
    showDivider = true,
    showActions = true,
    bottomLogo,
}) => (
    <>
        {showDivider && (
            <div className="flex items-center my-6">
                <div className="flex-grow border-t "></div>
                <span className="mx-1 text-netural-300 text-sm font-semibold">{dividerText}</span>
                <div className="flex-grow border-t  "></div>
            </div>
        )}
        {showActions && actions && actions.length > 0 && (
            <div className="flex justify-center gap-3 mb-8 ">
                {actions.map((action, idx) => (
                    <button
                        key={action.alt}
                        className="w-[45px] aspect-square flex items-center justify-center shadow rounded-full"
                        onClick={action.onClick}
                    >
                        <img src={action.icon} alt={t(action.alt)} />
                    </button>
                ))}
            </div>
        )}
        {bottomLogo && (
            <div className="flex justify-center fixed bottom-10 left-1/2 -translate-x-1/2 -translate-y-1/2x gap-1">
                <img src={bottomLogo.icon} alt={t("WAYJET")} />
                <img src={bottomLogo.textIcon} alt={t("WAYJET")} />
            </div>
        )}
    </>
);

export default SocialLoginActions;