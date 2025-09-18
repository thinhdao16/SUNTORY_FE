import { useTranslation } from 'react-i18next';
import { useAuthInfo } from '../Auth/hooks/useAuthInfo';
import { TopicType } from "@/constants/topicType";
import useAppInit from '@/hooks/useAppInit';
import PageContainer from '@/components/layout/PageContainer';
import AppImage from '@/components/common/AppImage';
import medicalSupportSvg from "@/icons/logo/home/medical_support.png";
import documentTranslationSvg from "@/icons/logo/home/document_translation.png";
import menuTranslation from "@/icons/logo/home/menu_translation.png";
import foodDiscoverySvg from "@/icons/logo/home/food_discovery.png";
import { useLanguageSwitcher } from './hooks/useLanguageSwitcher';

import { HomeHeader } from './components/HomeHeader';
import { FeatureGrid } from './components/FeatureGrid';

function Home() {
  const { t, ready, i18n } = useTranslation('home', { useSuspense: false });
  const languageSwitcher = useLanguageSwitcher();
  if (!ready) return null;
  const { data: userInfo } = useAuthInfo();

  const features = [
    {
      image: (
        <AppImage
          src={medicalSupportSvg}
          alt="Medical Report Interpretation"
          className="w-full h-full object-contain"
          wrapperClassName="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-gray-100"
          effect="blur"
          hardHeight={80}

        />
      ),
      title: t("Medical Report Interpretation"),
      desc: t("Analyze your medical reports for diagnoses and medication"),
      topic: TopicType.MedicalSupport,
    },
    {
      image: (
        <AppImage
          src={documentTranslationSvg}
          alt="Contract & Document Analysis"
          className="w-full h-full object-contain"
          wrapperClassName="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-gray-100"
          effect="blur"
          hardHeight={80}

        />
      ),
      title: t("Contract & Document Analysis"),
      desc: t("Scan documents to find key terms and hidden risks"),
      topic: TopicType.DocumentTranslation,
    },
    // {
    //   image: (
    //     <AppImage
    //       src={menuTranslation}
    //       alt="Menu Translation"
    //       className="w-full h-full object-contain"
    //       wrapperClassName="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-gray-100"
    //       effect="blur"
    //       hardHeight={80}
    //     />
    //   ),
    //   title: t("Menu Translation"),
    //   desc: t("Decode any menu with a simple scan"),
    //   topic: TopicType.MenuTranslation,
    // },
    {
      image: (
        <AppImage
          src={foodDiscoverySvg}
          alt="Food Label Interpretation"
          className="w-full h-full object-contain"
          wrapperClassName="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-gray-100"
          effect="blur"
          hardHeight={80}

        />
      ),
      title: t("Food Label Interpretation"),
      desc: t("Scan food labels for instant ingredient breakdowns"),
      topic: TopicType.FoodDiscovery,
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

  useAppInit();

  return (
    <PageContainer className='!bg-screen-page !h-screen '>
      <HomeHeader userInfo={userInfo} />
      <div className='-mt-34 px-4 pb-30'>
        <FeatureGrid features={features} />
        {/* <HowItWorksSection items={howItWorks} /> */}
        {/* <GetStartedButton chatTopicId={TopicType.Chat} /> */}
      </div>
    </PageContainer>
  );
}

export default Home;
