import React, { useEffect } from "react";

const withColorSetup = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const HOC: React.FC<P> = (props) => {
        useEffect(() => {
            const storedColorMain = localStorage.getItem("color-main");
            const storedColorMainLight = localStorage.getItem("color-main-light");

            if (storedColorMain && storedColorMainLight) {
                document.documentElement.style.setProperty("--color-main", storedColorMain);
                document.documentElement.style.setProperty("--color-main-light", storedColorMainLight);
            }
        }, []);

        return <WrappedComponent {...props} />;
    };

    return HOC;
};

export default withColorSetup;