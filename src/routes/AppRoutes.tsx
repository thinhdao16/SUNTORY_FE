import React, { Suspense, lazy, useEffect } from "react";
import {
  Route,
  Switch,
  useLocation,
  Redirect,
} from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import BottomTabBar from "@/components/common/BottomTabBar";
import RouteLoading from "./RouteLoading";
import { useAuthStore } from "@/store/zustand/auth-store";
import ChatSidebarLayout from "@/components/layout/ChatSidebarLayout";
import useAppInit from "@/hooks/useAppInit";
import TranslateHistory from "@/pages/Translate/TranslateHistory";

const routes = {
  Chat: lazy(() => import("@/pages/ChatStream/ChatStream")),
  ChangePassword: lazy(() => import("@/pages/Auth/ChangePassword/ChangePassword")),
  Camera: lazy(() => import("@/pages/Camera/Camera")),
  CameraWeb: lazy(() => import("@/pages/Camera/CameraWeb")),
  ForgotPassword: lazy(() => import("@/pages/Auth/ForgotPassword/ForgotPassword")),
  HealthInformation: lazy(() => import("@/pages/HealthInformation/HealthInformation")),
  HealthInformationDone: lazy(() => import("@/pages/HealthInformation/HealthInformationDone")),
  HealthInformationWelcome: lazy(() => import("@/pages/HealthInformation/HealthInformationWelcome")),
  Home: lazy(() => import("@/pages/Home/Home")),
  Login: lazy(() => import("@/pages/Auth/Login/Login")),
  NewPassword: lazy(() => import("@/pages/Auth/NewPassword/NewPassword")),
  NotFound: lazy(() => import("@/pages/NotFound/NotFound")),
  Otp: lazy(() => import("@/pages/Auth/Otp/Otp")),
  ProfileSetting: lazy(() => import("@/pages/Profile/ProfileSetting")),
  ProfileAllergyInfo: lazy(() => import("@/pages/Profile/HealthInformationEdit/AllergyInfo/AllergyInfo")),
  ProfileHealthInfo: lazy(() => import("@/pages/Profile/HealthInformationEdit/HealthInfo/HealthInfo")),
  ProfileMedicineInfo: lazy(() => import("@/pages/Profile/HealthInformationEdit/MedicineInfo/MedicineInfo")),
  Rate: lazy(() => import("@/pages/Rate/Rate")),
  Register: lazy(() => import("@/pages/Auth/Register/Register")),
  SocialChatPrivate: lazy(() => import("@/pages/SocialChat/SocialChatThread/SocialChatThread")),
  SocialChatRecent: lazy(() => import("@/pages/SocialChat/SocialChat")),
  SocialFeed: lazy(() => import("@/pages/Social/Feed/Feed")),
  SocialGroup: lazy(() => import("@/pages/SocialGroup/SocialGroup")),
  SocialQRNative: lazy(() => import("@/pages/SocialQR/SocialQRNative/SocialQRNative")),
  SocialQRWeb: lazy(() => import("@/pages/SocialQR/SocialQRWeb/SocialQRWeb")),
  SocialPartner: lazy(() => import("@/pages/SocialPartner/SocialPartner")),
  TakePhoto: lazy(() => import("@/pages/TakePhoto/TakePhoto")),
  Translate: lazy(() => import("@/pages/Translate/Translate")),
  TranslateHistory: lazy(() => import("@/pages/Translate/TranslateHistory")),
  MenuTranslation: lazy(() => import("@/pages/Menu/MenuTranslation")),
  FoodList: lazy(() => import("@/pages/Menu/components/FoodList")),
  AllergiesSetup: lazy(() => import("@/pages/Menu/components/AllergiesSetup")),
  DietSetup: lazy(() => import("@/pages/Menu/components/DietSetup")),
  AnalyzingSetup: lazy(() => import("@/pages/Menu/components/AnalyzingSetup")),
  ScanMenu: lazy(() => import("@/pages/Menu/components/ScanMenu")),
  MenuAnalyzing: lazy(() => import("@/pages/Menu/components/MenuAnalyzing")),
  MyProfile: lazy(() => import("@/pages/Profile/MyProfile")),
  OtherUserProfile: lazy(() => import("@/pages/Profile/OtherUserProfile")),
  MyInformation: lazy(() => import("@/pages/Profile/AccountEdit/MyInformation")),
  AiProfileInformation: lazy(() => import("@/pages/Profile/AiHealthInformationEdit/AiProfileInformation")),
  FriendList: lazy(() => import("@/pages/Profile/Friend/FriendList")),
  FriendRequestSent: lazy(() => import("@/pages/Profile/Friend/FriendRequestSent")),
  ShareProfile: lazy(() => import("@/pages/Profile/ShareProfile/ShareProfile")),
  Notification: lazy(() => import("@/pages/Notification/Notification")),
};

const authRoutes = ["/login", "/register"];
const authRoutesDontShowTabBar = ["/camera", "/social-qr-web", "/social-qr-native", "/social-chat/camera", "/social-chat/camera-web", "/social-chat/t", "/social-feed/camera", "/social-feed/camera-web", "/social-feed/t", "/menu-translation", "/social-feed/create"];
const ignoreRoutes = ["/forgot-password", "/otp", "/new-password", "/change-password"];

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const showTabBar =
    !authRoutes.some(path => location.pathname.startsWith(path)) &&
    !ignoreRoutes.some(path => location.pathname.startsWith(path)) &&
    !authRoutesDontShowTabBar.some(path => location.pathname.startsWith(path));

  useAppInit();

  if (isAuthenticated && authRoutes.includes(location.pathname)) {
    return <Redirect to="/social-chat" />;
  }
  return (
    <>  
      <div className = "pb-[var(--safe-area-inset-bottom)] pt-[var(--safe-area-inset-top)]">
        <Suspense fallback={<RouteLoading />}>
          <Switch>
            <Route path="/login" component={routes.Login} exact />
            <Route path="/register" component={routes.Register} exact />
            <Route path="/forgot-password" component={routes.ForgotPassword} exact />
            <Route path="/otp" component={routes.Otp} exact />
            <Route path="/home" component={routes.Home} exact />
            <Route path="/new-password" component={routes.NewPassword} exact />
            <Route path="/take-photo" component={routes.TakePhoto} exact />
            <Route path="/camera-web" component={routes.CameraWeb} exact />

            <PrivateRoute path="/camera" component={routes.Camera} exact />
            <PrivateRoute path="/health-information" component={routes.HealthInformation} exact />
            <PrivateRoute path="/health-information/welcome" component={routes.HealthInformationWelcome} exact />
            <PrivateRoute path="/health-information/done" component={routes.HealthInformationDone} exact />
            <PrivateRoute path="/health-information/health-info" component={routes.ProfileHealthInfo} exact />
            <PrivateRoute path="/health-information/allergy-info" component={routes.ProfileAllergyInfo} exact />
            <PrivateRoute path="/health-information/medicine-info" component={routes.ProfileMedicineInfo} exact />
            <PrivateRoute path="/rate" component={routes.Rate} exact />
            <PrivateRoute path="/chat/:type?/:sessionId?" component={routes.Chat} />
            <PrivateRoute path="/social-chat/:type?/:roomId?/:infoRoom?" component={routes.SocialChatRecent} exact />
            <PrivateRoute path="/social-feed/:type?/:feedId?/:infoFeed?/:tabName?" component={routes.SocialFeed} exact />
            {/* <PrivateRoute path="/social-chat" component={() => <Redirect to="/social-chat" />}/> */}
            <PrivateRoute path="/social-group/add" component={routes.SocialGroup} exact />
            <PrivateRoute path="/social-group" component={() => <Redirect to="/social-group/add" />} />
            <PrivateRoute path="/social-partner/add" component={routes.SocialPartner} exact />
            <PrivateRoute path="/social-partner" component={() => <Redirect to="/social-partner/add" />} />
            <PrivateRoute path="/share-profile" component={routes.ShareProfile} exact />
            <PrivateRoute path="/social-qr-web" component={routes.SocialQRWeb} exact />
            <PrivateRoute path="/social-qr-native" component={routes.SocialQRNative} exact />
            <PrivateRoute path="/translate" component={routes.Translate} exact />
            <PrivateRoute path="/translate/history" component={TranslateHistory} exact />
            <PrivateRoute path="/change-password" component={routes.ChangePassword} exact />
            <PrivateRoute path="/menu-translation/:section?" component={routes.MenuTranslation} exact />
            <PrivateRoute path="/menu-analyzing" component={routes.MenuAnalyzing} exact />
            <PrivateRoute path="/food-list" component={routes.FoodList} exact />
            <PrivateRoute path="/my-profile/:tabName?" component={routes.MyProfile} exact />
            <PrivateRoute path="/profile/:userId/:tab?" component={routes.OtherUserProfile} exact />
            <PrivateRoute path="/profile-setting" component={routes.ProfileSetting} exact />
            <PrivateRoute path="/my-information" component={routes.MyInformation} exact />
            <PrivateRoute path="/ai-profile-setting" component={routes.AiProfileInformation} exact />
            <PrivateRoute path="/friend-list" component={routes.FriendList} exact />
            <PrivateRoute path="/friend-request-sent" component={routes.FriendRequestSent} exact />
            <PrivateRoute path="/notification-list" component={routes.Notification} exact />
            <Route exact path="/" render={() => <Redirect to="/social-chat" />} />
            <Route path="*" component={routes.NotFound} />
          </Switch>
        </Suspense>
        {showTabBar && (
          <>
            <BottomTabBar />
            <ChatSidebarLayout />
          </>
        )}
      </div>
    </>
  );
};

export default AppRoutes;