import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/store/zustand/auth-store";
import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";

const PrivateRoute: React.FC<RouteProps> = ({ component: Component, ...rest }) => {
    useAuthGuard();
    const { isAuthenticated } = useAuthStore();
    // const isAuthenticated = true
    if (!Component) return null;
    return (
        <Route
            {...rest}
            render={props =>
                isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to="/login" />
                )
            }
        />
    );
};

export default PrivateRoute;