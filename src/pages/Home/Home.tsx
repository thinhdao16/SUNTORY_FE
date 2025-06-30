import { openSidebarWithAuthCheck } from '@/store/zustand/ui-store';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from "react-router-dom";
import { useAuthInfo } from '../Auth/hooks/useAuthInfo';
import { TopicType } from "@/constants/topicType";

import NavBarHomeIcon from "@/icons/logo/nav_bar_home.svg?react";
import VectorRightIcon from "@/icons/logo/vector_right.svg?react";
import LinkToIcon from "@/icons/logo/link_to.svg?react";
import MedicalSupportIcon from "@/icons/logo/home/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/home/document_translation.svg?react";
import ProductInformationIcon from "@/icons/logo/home/product_information.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/home/food_discovery.svg?react";
import useAppInit from '@/hooks/useAppInit';

function Home() {
  const history = useHistory();
  const { data: userInfo } = useAuthInfo();
  useAppInit();

  const features = [
    {
      image: <MedicalSupportIcon className="w-full h-full object-cover rounded-xl flex-1" />,
      title: t("Medical Support"),
      link: "/chat/10",
    },
    {
      image: <DocumentTranslationIcon className="w-full h-full object-cover rounded-xl flex-1" />,
      title: t("Document Translation"),
      link: "/chat/20",
    },
    {
      image: <ProductInformationIcon className="w-full h-full object-cover rounded-xl flex-1" />,
      title: t("Product Information"),
      link: "/chat/30",
    },
    {
      image: <FoodDiscoveryIcon className="w-full h-full object-cover rounded-xl flex-1" />,
      title: t("Food Discovery"),
      link: "/chat/40",
    },
  ];
  const howItWorks = [
    {
      step: 1,
      title: t("Create Your Profile"),
      desc: t("Set up your health profile with medical history"),
    },
    {
      step: 2,
      title: t("Scan & Upload"),
      desc: t("Take photos of prescriptions or medical documents for instant"),
    },
    {
      step: 3,
      title: t("Get AI Insights"),
      desc: t("Receive personalized recommendations and health"),
    },
  ];
  const user = userInfo;
  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(1, age);
  };

  const age = user?.dateOfBirth ? getAge(user.dateOfBirth) : "-";
  const height = user?.height ? `${user.height} ${t("cm")}` : "-";
  const weight = user?.weight ? `${user.weight} ${t("kg")}` : "-";
  const bmi =
    user?.height && user?.weight
      ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
      : "-";

  return (
    <IonPage>
      <IonContent fullscreen className="!pt-0 safe-area-inset-0">
        <div className="bg-screen-page pb-30">
          <div className="relative rounded-b-3xl overflow-hidden px-6 pt-6 h-[318px]">
            {/* {!headerImgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20">
                <div className="w-8 h-8 border-4 border-main border-t-transparent rounded-full animate-spin"></div>
              </div>
            )} */}
            {/* Replace <img ... /> with SVG component */}
            <div
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                backgroundImage: 'url("background/background_radi_home_header.svg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10">
              <div className="h-[62px] flex items-center">
                <button onClick={() => openSidebarWithAuthCheck()} >
                  <NavBarHomeIcon />
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex items-start gap-2 mt-6">
                  {userInfo?.id ? (
                    <div className="text-white text-2xl font-semibold truncate max-w-[250px] min-w-0">
                      {t("Hi,")} {user?.lastname || user?.email || t("Guest")}
                    </div>
                  ) : (
                    <div className="text-white text-2xl font-semibold truncate min-w-0">
                      {t("Welcome")}
                    </div>
                  )}
                </div>
                {userInfo?.id ? (
                  <a
                    className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap"
                    onClick={() => history.push("/profile/account")}
                    style={{ cursor: "pointer" }}
                  >
                    <span>{t("Update Profile")}</span>
                    <span className="bg-white rounded-full flex items-center justify-center h-[13px] w-[13px]">
                      <VectorRightIcon className="w-[8px]" />
                    </span>
                  </a>
                ) : (
                  <a
                    className="flex items-center gap-2 border border-white rounded-full text-white text-sm font-medium bg-gradient-to-b from-main to-primary-600 px-3 py-1 whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis"
                    onClick={() => history.push("/login")}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap block">{t("Login")}</span>
                  </a>
                )}
              </div>
              <div className="mt-6 bg-white bg-opacity-90 rounded-2xl flex justify-between items-center px-6 py-4 w-full max-w-xl mx-auto">
                <div className="flex-1 text-center">
                  <div className="text-main font-medium">{t("BMI")}</div>
                  <div className="text-sm text-netural-300">{bmi}</div>
                </div>
                <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
                <div className="flex-1 text-center">
                  <div className="text-main font-medium">{t("Age")}</div>
                  <div className="text-sm text-netural-300">{age}</div>
                </div>
                <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
                <div className="flex-1 text-center">
                  <div className="text-main font-medium">{t("Height")}</div>
                  <div className="text-sm text-netural-300">{height}</div>
                </div>
                <div className="w-[0.5px] h-9 bg-netural-300 mx-2" />
                <div className="flex-1 text-center">
                  <div className="text-main font-medium">{t("Weight")}</div>
                  <div className="text-sm text-netural-300">{weight}</div>
                </div>
              </div>
            </div>
          </div>
          <div className='-mt-24 px-6'>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-4    relative z-999">
              {features.map((f, idx) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-4 flex flex-col items-start justify-start aspect-square w-full"
                  onClick={() => history.push(f.link)}
                >
                  <div className="flex justify-between gap-4 items-center w-full mb-1">
                    <div className="font-semibold leading-none text-[14px] mb-1">{f.title}</div>
                    <button
                      className=" top-3 right-3 bg-main rounded-full aspect-square h-[30px] flex items-center justify-center shadow-md"
                      onClick={() => history.push(f.link)}
                    >
                      <LinkToIcon />
                    </button>
                  </div>
                  {f.image}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <span className="font-bold text-[22px] text-gray-900 mb-1">{t("How It Works")}</span>
              <span className="text-netural-400 text-sm mb-4 block">{t("Three simple steps to better health")}</span>
              <div className="flex flex-col gap-4">
                {howItWorks.map((item) => (
                  <div key={item.step} className="flex items-center gap-3 bg-white rounded-xl p-4">
                    <div className="h-10 aspect-square flex items-center justify-center rounded-full bg-main text-white font-bold">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{item.title}</div>
                      <div className="text-gray-500 text-sm leading-none">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className=" mt-4">
              <div className="bg-gradient-to-r from-primary-400 to-main rounded-xl p-4 text-center text-white font-semibold" onClick={() => history.push(`/chat/${TopicType.Chat}`)}>
                {t("Get Started")}
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Home;
