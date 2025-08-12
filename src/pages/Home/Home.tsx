import { useTranslation } from 'react-i18next';
import { useAuthInfo } from '../Auth/hooks/useAuthInfo';
import { TopicType } from "@/constants/topicType";
import useAppInit from '@/hooks/useAppInit';
import PageContainer from '@/components/layout/PageContainer';
import AppImage from '@/components/common/AppImage';

import medicalSupportSvg from "@/icons/logo/home/medical_support.svg";
import documentTranslationSvg from "@/icons/logo/home/document_translation.svg";
import drugInstructionsSvg from "@/icons/logo/home/drug_instructions.svg";
import foodDiscoverySvg from "@/icons/logo/home/food_discovery.svg";

import { HomeHeader } from './components/HomeHeader';
import { FeatureGrid } from './components/FeatureGrid';

function Home() {
  const { t, ready } = useTranslation('home', { useSuspense: false });
  if (!ready) return null;
  const { data: userInfo } = useAuthInfo();

  const features = [
    {
      image: (
        <AppImage
          src={medicalSupportSvg}
          alt="Medical Support"
          className="w-full h-full object-cover flex-1 "
          fallbackRatio={16 / 9}
          hardHeight={0}
          effect="blur"
        />
      ),
      title: t("Medical Support"),
      topic: TopicType.MedicalSupport,
    },
    {
      image: (
        <AppImage
          src={documentTranslationSvg}
          alt="Document Translation"
          className="w-full h-full object-cover flex-1 "
          fallbackRatio={16 / 9}
          hardHeight={0}
          effect="blur"
        />
      ),
      title: t("Document Translation"),
      topic: TopicType.DocumentTranslation,
    },
    {
      image: (
        <AppImage
          src={drugInstructionsSvg}
          alt="Drug Instructions"
          className="w-full h-full object-cover flex-1 "
          fallbackRatio={16 / 9}
          hardHeight={0}
          effect="blur"
        />
      ),
      title: t("Drug Instructions"),
      topic: TopicType.DrugInstructions,
    },
    {
      image: (
        <AppImage
          src={foodDiscoverySvg}
          alt="Food Discovery"
          className="w-full h-full object-cover flex-1 "
          fallbackRatio={16 / 9}
          hardHeight={0}
          effect="blur"
        />
      ),
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
