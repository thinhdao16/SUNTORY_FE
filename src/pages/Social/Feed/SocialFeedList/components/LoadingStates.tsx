import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStatesProps {
  loading: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  refreshing: boolean;
  hasNextPage: boolean;
  posts: any[];
  error: any;
  onRefresh: () => void;
  onFetchNextPage: () => void;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading,
  isFetchingNextPage,
  isRefetching,
  refreshing,
  hasNextPage,
  posts,
  error,
  onRefresh,
  onFetchNextPage
}) => {
  const { t } = useTranslation();

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('Error loading posts')}</h3>
          <p className="text-gray-500 mb-4">{typeof error === 'string' ? error : 'An error occurred'}</p>
          <button
            onClick={onRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('Try again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Refreshing indicator */}
      {(isRefetching || refreshing) && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('Refreshing...')}</span>
          </div>
        </div>
      )}

      {/* Loading more posts indicator */}
      {(loading || isFetchingNextPage) && posts.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('Loading more posts...')}</span>
          </div>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && !loading && !isFetchingNextPage && posts.length > 0 && (
        <div className="flex justify-center py-6">
          <button
            onClick={onFetchNextPage}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('Load more posts')}
          </button>
        </div>
      )}

      {/* No more posts indicator */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">{t('No more posts to load')}</p>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !loading && !error && !isRefetching && !refreshing && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No posts yet')}</h3>
            <p className="text-gray-500 mb-4">{t('Be the first to share something!')}</p>
          </div>
        </div>
      )}
    </>
  );
};
