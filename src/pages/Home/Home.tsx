import { useTranslation } from 'react-i18next';

import { useAuthInfo } from '../Auth/hooks/useAuthInfo';
import { TopicType } from "@/constants/topicType";
import useAppInit from '@/hooks/useAppInit';
import PageContainer from '@/components/layout/PageContainer';

import { HomeHeader } from './components/HomeHeader';
import { FeatureGrid } from './components/FeatureGrid';
import { HowItWorksSection } from './components/HowItWorksSection';
import { GetStartedButton } from './components/GetStartedButton';

import MedicalSupportIcon from "@/icons/logo/home/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/home/document_translation.svg?react";
import DrugIstrucstionsIcon from "@/icons/logo/home/drug_instructions.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/home/food_discovery.svg?react";

function Home() {
  const { t } = useTranslation();
  const { data: userInfo } = useAuthInfo();

  const features = [
    {
      image: <MedicalSupportIcon className="w-full h-full object-cover flex-1 " />,
      title: t("Medical Support"),
      topic: TopicType.MedicalSupport,
    },
    {
      image: <DocumentTranslationIcon className="w-full h-full object-cover flex-1 " />,
      title: t("Document Translation"),
      topic: TopicType.DocumentTranslation,
    },
    {
      image: <DrugIstrucstionsIcon className="w-full h-full object-cover flex-1 " />,
      title: t("Drug Instructions"),
      topic: TopicType.DrugInstructions,
    },
    {
      image: <FoodDiscoveryIcon className="w-full h-full object-cover flex-1 " />,
      title: t("Food Discovery"),
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
    <PageContainer className='!bg-screen-page'>
      <HomeHeader userInfo={userInfo} />
      <div className='-mt-34 px-6 pb-10'>
        <FeatureGrid features={features} />
        {/* <HowItWorksSection items={howItWorks} /> */}
        {/* <GetStartedButton chatTopicId={TopicType.Chat} /> */}
      </div>
    </PageContainer>
  );
}

export default Home;
