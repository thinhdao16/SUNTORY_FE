import React from 'react';
import { useTranslation } from 'react-i18next';

interface HashtagInputProps {
  selectedHashtag: string;
  onHashtagChange: (hashtag: string) => void;
  onSearch: () => void;
}

export const HashtagInput: React.FC<HashtagInputProps> = ({
  selectedHashtag,
  onHashtagChange,
  onSearch
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="relative">
        <input
          type="text"
          placeholder={t('Enter hashtag (e.g., #abc, #ng)')}
          value={selectedHashtag}
          onChange={(e) => onHashtagChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        />
        {selectedHashtag && (
          <button
            onClick={() => onHashtagChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
