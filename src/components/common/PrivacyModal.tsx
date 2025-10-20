import React from "react";
import { useTranslation } from "react-i18next";
import MyModal from "@/components/common/modals/Modal";

interface PrivacyModalProps {
  isOpen: boolean;
  closeModal: () => void;
  selectedPrivacy: string;
  onSelectPrivacy: (privacy: string) => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  closeModal,
  selectedPrivacy,
  onSelectPrivacy
}) => {
  const { t } = useTranslation();

  const privacyOptions = [
    {
      id: "everyone",
      label: t("Everyone"),
      icon: "🌍",
      description: t("Anyone can see this post")
    },
    {
      id: "friends",
      label: t("Friends"),
      icon: "👥",
      description: t("Only your friends can see this post")
    },
    {
      id: "private",
      label: t("Private"),
      icon: "🔒",
      description: t("Only you can see this post")
    }
  ];

  const handleSelect = (privacyId: string) => {
    onSelectPrivacy(privacyId);
    closeModal();
  };

  return (
    <MyModal
      isOpen={isOpen}
      closeModal={closeModal}
      className="bottom"
    >
      {/* Drag Handle */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("Who can see your post?")}
          </h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Privacy Options */}
      <div className="space-y-3">
        {privacyOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
              selectedPrivacy === option.id
                ? "bg-blue-50 border-2 border-blue-200"
                : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
            }`}
          >
            <div className="text-2xl">{option.icon}</div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </div>
            {selectedPrivacy === option.id && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </MyModal>
  );
};

export default PrivacyModal;
