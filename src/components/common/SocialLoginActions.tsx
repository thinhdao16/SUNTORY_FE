import React, { useRef } from "react";
import { t } from "@/lib/globalT";
import { useGoogleLogin } from "@/pages/Auth/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import Toast from "@/global/Toast";

// Import SVG as React component
import GoogleIcon from "@/icons/logo/social/google.svg?react";

interface SocialLoginActionsProps {
    dividerText?: string;
    showDivider?: boolean;
    showActions?: boolean;
    bottomLogo?: { icon: React.FC<React.SVGProps<SVGSVGElement>>; textIcon: React.FC<React.SVGProps<SVGSVGElement>> };
}

const SocialLoginActions: React.FC<SocialLoginActionsProps> = ({
    dividerText = t("OR"),
    showDivider = true,
    showActions = true,
    bottomLogo,
}) => {
    const { handleGoogleWebLogin, nativeLogin, isWeb } = useGoogleLogin();
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const socialActions = [
        {
            key: "google",
            render: isWeb ? (
                <>
                    <div className="relative w-[45px] aspect-square">
                        <button
                            className="w-[45px] aspect-square flex items-center justify-center shadow rounded-full"
                        >
                            <GoogleIcon aria-label="Google" />
                        </button>
                        <div ref={googleBtnRef} className="w-[45px] aspect-square shadow rounded-full absolute top-0 z-10 opacity-0 ">
                            <GoogleLogin
                                onSuccess={handleGoogleWebLogin}
                                onError={() => {
                                    Toast("Google login failed");
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <button
                    onClick={nativeLogin}
                    className="w-[45px] aspect-square flex items-center justify-center shadow rounded-full"
                >
                    <GoogleIcon className="w-6 h-6" aria-label="Google" />
                </button>
            ),
        },
        // Thêm Facebook, Apple ở đây sau này
    ];

    return (
        <>
            {showDivider && (
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t "></div>
                    <span className="mx-1 text-netural-300 text-sm font-semibold">{dividerText}</span>
                    <div className="flex-grow border-t  "></div>
                </div>
            )}
            {showActions && (
                <div className="flex justify-center gap-3 mb-8">
                    {socialActions.map(action => (
                        <React.Fragment key={action.key}>{action.render}</React.Fragment>
                    ))}
                </div>
            )}
            {bottomLogo && (
                <div className="flex justify-center fixed bottom-10 left-1/2 -translate-x-1/2 -translate-y-1/2x gap-1">
                    <bottomLogo.icon className="h-6" aria-label={t("WAYJET")} />
                    <bottomLogo.textIcon className="h-6" aria-label={t("WAYJET")} />
                </div>
            )}
        </>
    );
};

export default SocialLoginActions;


