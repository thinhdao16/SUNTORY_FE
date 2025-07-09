import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthInfo } from '../Auth/hooks/useAuthInfo';
import { TopicType } from "@/constants/topicType";
import useAppInit from '@/hooks/useAppInit';
import PageContainer from '@/components/layout/PageContainer';
import { useChatHistoryLastModule } from '../Chat/hooks/useChatHistorylastModule';

// Custom hooks
import { useUserStats } from './hooks/useUserStats';
import { useChatNavigation } from './hooks/useChatNavigation';

// Components
import { HomeHeader } from './components/HomeHeader';
import { FeatureGrid } from './components/FeatureGrid';
import { HowItWorksSection } from './components/HowItWorksSection';
import { GetStartedButton } from './components/GetStartedButton';

// Icons
import MedicalSupportIcon from "@/icons/logo/home/medical_support.svg?react";
import DocumentTranslationIcon from "@/icons/logo/home/document_translation.svg?react";
import DrugIstrucstionsIcon from "@/icons/logo/home/drug_instructions.svg?react";
import FoodDiscoveryIcon from "@/icons/logo/home/food_discovery.svg?react";

function Home() {
  const { t } = useTranslation();
  const { data: userInfo } = useAuthInfo();
  const { chatHistory } = useChatHistoryLastModule();

  // Custom hooks
  const { getChatLink } = useChatNavigation(chatHistory);

  // Features data
  const features = [
    {
      image: <MedicalSupportIcon className="w-full h-full object-cover flex-1 my-2" />,
      title: t("Medical Support"),
      link: () => getChatLink(TopicType.MedicalSupport),
    },
    {
      image: <DocumentTranslationIcon className="w-full h-full object-cover flex-1 my-2" />,
      title: t("Document Translation"),
      link: () => getChatLink(TopicType.DocumentTranslation),
    },
    {
      image: <DrugIstrucstionsIcon className="w-full h-full object-cover flex-1 my-2" />,
      title: t("Drug Instructions"),
      link: () => getChatLink(TopicType.DrugInstructions),
    },
    {
      image: <FoodDiscoveryIcon className="w-full h-full object-cover flex-1 my-2" />,
      title: t("Food Discovery"),
      link: () => getChatLink(TopicType.FoodDiscovery),
    },
  ];

  // How it works data
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

      <div className='-mt-24 px-6 pb-10'>
        <FeatureGrid features={features} />
        <HowItWorksSection items={howItWorks} />
        <GetStartedButton getChatLink={getChatLink} chatTopicId={TopicType.Chat} />
      </div>
    </PageContainer>
  );
}

export default Home;
