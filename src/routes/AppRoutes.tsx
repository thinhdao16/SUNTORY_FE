import React, { useEffect, useState, Suspense, lazy } from "react";
import {
  Route,
  Switch,
  useLocation,
  useHistory,
  Redirect,
} from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import BottomTabBar from "@/components/common/BottomTabBar";
import RouteLoading from "./RouteLoading";
import { useAuthStore } from "@/store/zustand/auth-store";
import ChatSidebarLayout from "@/components/layout/ChatSidebarLayout";
import { useUiStore } from "@/store/zustand/ui-store";

const AllergyInfo = lazy(() => import("@/pages/HealthInformation/Progress_3/AllergyInfo"));
const BasicInfo = lazy(() => import("@/pages/HealthInformation/Progress_1/BasicInfo"));
const Chat = lazy(() => import("@/pages/Chat/Chat"));
const ChangePassword = lazy(() => import("@/pages/Auth/ChangePassword/ChangePassword"));
const Confirm = lazy(() => import("@/pages/HealthInformation/Progress_5/Confirm"));
const ForgotPassword = lazy(() => import("@/pages/Auth/ForgotPassword/ForgotPassword"));
const HealthInfo = lazy(() => import("@/pages/HealthInformation/Progress_2/HealthInfo"));
const HealthInformation = lazy(() => import("@/pages/HealthInformation/HealthInformation"));
const HealthInformationDone = lazy(() => import("@/pages/HealthInformation/HealthInformationDone"));
const HealthInformationWelcome = lazy(() => import("@/pages/HealthInformation/HealthInformationWelcome"));
const Home = lazy(() => import("@/pages/Home/Home"));
const Login = lazy(() => import("@/pages/Auth/Login/Login"));
const MedicineInfo = lazy(() => import("@/pages/HealthInformation/Progress_4/MedicineInfo"));
const NewPassword = lazy(() => import("@/pages/Auth/NewPassword/NewPassword"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));
const Otp = lazy(() => import("@/pages/Auth/Otp/Otp"));
const Profile = lazy(() => import("@/pages/Profile/Profile"));
const Rate = lazy(() => import("@/pages/Rate/Rate"));
const Register = lazy(() => import("@/pages/Auth/Register/Register"));
const Scanner = lazy(() => import("@/pages/Scanner/Scanner"));
const ScannerById = lazy(() => import("@/pages/Scanner/ScannerById"));
const TakePhoto = lazy(() => import("@/pages/TakePhoto/TakePhoto"));
const Translate = lazy(() => import("@/pages/Translate/Translate"));
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    const unlisten = history.listen(() => {
      setLoading(true);
      setTimeout(() => setLoading(false), 200);
    });
    return () => unlisten();
  }, [history]);
  const authRoutes = ["/login", "/register"];
  const authRoutesDontShowTabBar = ["/take-photo"]
  const ignoreRoutes = ["/forgot-password", "/otp", "/new-password", "/change-password"];
  const showTabBar = !authRoutes.includes(location.pathname) && !ignoreRoutes.includes(location.pathname) && !authRoutesDontShowTabBar.includes(location.pathname);
  if (isAuthenticated && authRoutes.includes(location.pathname)) {
    return <Redirect to="/home" />;
  }
  return (
    <>
      <div>
        {/* {loading && <RouteLoading />} */}
        <Suspense fallback={<RouteLoading />}>
          <Switch>
            <Route path="/login" component={Login} exact />
            <Route path="/register" component={Register} exact />
            <Route path="/forgot-password" component={ForgotPassword} exact />
            <Route path="/otp" component={Otp} exact />
            <Route path="/home" component={Home} exact />
            <Route path="/new-password" component={NewPassword} exact />
            <Route path="/take-photo" component={TakePhoto} exact />

            <PrivateRoute path="/health-information" component={HealthInformation} exact />
            <PrivateRoute path="/health-information/welcome" component={HealthInformationWelcome} exact />
            <PrivateRoute path="/health-information/done" component={HealthInformationDone} exact />
            <PrivateRoute path="/health-information/progress-1" component={BasicInfo} exact />
            <PrivateRoute path="/health-information/progress-2" component={HealthInfo} exact />
            <PrivateRoute path="/health-information/progress-3" component={AllergyInfo} exact />
            <PrivateRoute path="/health-information/progress-4" component={MedicineInfo} exact />
            <PrivateRoute path="/health-information/progress-5" component={Confirm} exact />
            <PrivateRoute path="/rate" component={Rate} exact />
            <PrivateRoute path="/chat/:type?/:sessionId?" component={Chat} />
            <PrivateRoute path="/translate" component={Translate} exact />
            <PrivateRoute path="/profile/:section?" component={Profile} exact />
            <PrivateRoute path="/change-password" component={ChangePassword} exact />
            <PrivateRoute path="/scanner" component={Scanner} exact />
            <PrivateRoute path="/scanner/:id" component={ScannerById} />

            <Route exact path="/" render={() => <Redirect to="/home" />} />
            <Route path="*" component={NotFound} />
          </Switch>
        </Suspense>
        {showTabBar && (
          <><BottomTabBar /><ChatSidebarLayout /></>
        )}
      </div>

    </>
  );
};

export default AppRoutes;